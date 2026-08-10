---
title: 'Rode seu próprio servidor MCP localmente: transporte stdio, zero conta na nuvem, controle de verdade'
date: '2026-08-10'
tags:
  - mcp
  - docker
  - cli
  - local-first
  - ferramentas-llm
  - stdio
description: >-
  Monte um servidor MCP de produção que roda localmente via transporte stdio,
  exponha suas CLIs já existentes pra qualquer cliente LLM (Claude Desktop,
  Continue, Cline) e pule de vez o pedágio dos provedores de nuvem.
---

Todo anúncio de plataforma neste mês grita "MCP! Agentes! Funções na nuvem!" — Cloudflare Workers, Vercel Sandbox, algum "navegador agêntico" novo rodando em isolate V8. Todos querem seu cartão e sua telemetria. Você só quer que o modelo rode `rg`, `jq` ou aquele script de migração legado amaldiçoado sem ficar copiando saída de um lado pro outro como se fosse 2010.

Boa notícia: o transporte stdio do MCP existe desde que a spec saiu. Ele sobe seu servidor como subprocesso, manda JSON-RPC pelo stdin/stdout e não exige configuração de rede nenhuma. Sem porta, sem TLS, sem túnel `ngrok`, sem API key. Seu editor (ou Claude Desktop, ou Continue, ou Cline) cria o processo, conversa com ele e mata quando termina. É só isso.

Este post te guia na construção de um servidor MCP de verdade que expõe sua caixa de ferramentas de CLI — `rg`, `jq`, `sqlite3`, `ffmpeg`, o que tiver em `/usr/local/bin` — como ferramentas chamáveis. Você escreve o servidor em umas 100 linhas de Python, empacota numa imagem Docker que sobe em milissegundos, pluga em todas as configs de cliente relevantes e debuga os inevitáveis momentos "por que minha ferramenta não aparece" com log estruturado que dá pra ler de verdade. Sem conta na Cloudflare. Sem projeto na Vercel. Sem buzzword "agêntico". Só um subprocesso que faz o que você manda.

## Por que o transporte stdio é o único que você precisa localmente

O MCP define três transportes: stdio, SSE e HTTP streamable. Dois deles resolvem problema que você não tem.

**SSE** (Server-Sent Events) mantém uma conexão HTTP aberta pra push do servidor pro cliente. Ótimo pra servidor remoto atrás de load balancer. Localmente? Você sobe um servidor web, gerencia porta, lida com CORS e fica se perguntando por que a regra de firewall engole a conexão. **HTTP Streamable** (adicionado na spec de 2025-03-26) atualiza o SSE com streaming bidirecional sobre um único endpoint. Mesma sobrecarga, buzzword mais novo.

**stdio** sobe seu servidor como processo filho. JSON-RPC flui via stdin/stdout. O cliente é dono do ciclo de vida: cria, conversa, mata. Sem porta. Sem TLS. Sem unit do `systemd`. Sem `docker run -p`. Funciona via SSH porque o subprocesso roda na máquina remota — seu editor local só manda byte pelo túnel que já existe. Tenta fazer isso com SSE.

Aqui está o protocolo cru. Sem SDK.

```bash
# Terminal 1: pretend to be the client
cat <<'EOF' | socat - EXEC:"python3 -u mcp_server.py"
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
EOF
```

`mcp_server.py` (na próxima seção) lê JSON delimitado por linha do stdin, escreve respostas no stdout. O `EXEC:` simples do `socat` liga o stdin/stdout do subprocesso direto no pipe — sem precisar de `pty`. O JSON delimitado por nova linha do MCP não liga pra semântica de TTY, e alocar um pseudo-terminal na verdade arrisca corromper o stream (buffer por linha, eco) em vez de ajudar.

Saída que você vai ver:

```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"local-toolbox","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"rg","description":"ripgrep search","inputSchema":{"type":"object","properties":{"pattern":{"type":"string"},"path":{"type":"string"}},"required":["pattern"]}}]}}
```

Sem header HTTP. Sem chunked encoding. JSON delimitado por nova linha. É o handshake inteiro.

O ciclo de vida vem de graça: o cliente manda `SIGTERM` (ou fecha o stdin), o processo termina, os file descriptors são limpos. Sem container órfão. Sem bagunça de `docker ps -a`. Se o editor travar, o SO recolhe o filho. Tenta obter essa garantia de uma função na nuvem.

Conflito de porta? Extinto. Rode cinco servidores MCP ao mesmo tempo — cada um ganha seu próprio pipe stdio. Sem erro de `address already in use`, sem ginástica de `PORT=3001`.

A única pegadinha: stdio é local por design. Isso não é limitação — é a feature. Você quer ferramenta local exposta a um modelo local. O transporte deveria sumir.

## O servidor de ~100 linhas: ferramentas como funções puras

O pacote oficial `mcp` te dá uma classe `FastMCP` que cuida do boilerplate de JSON-RPC. Você decora funções, ele monta o schema, e o transporte stdio é o padrão.

Um detalhe importa mais do que qualquer outra linha deste post: `mcp==1.29.0`. O pacote `mcp` chegou na `2.0.0` e renomeou `FastMCP` pra `MCPServer`, movendo o módulo inteiro de `mcp.server.fastmcp` pra `mcp.server.mcpserver`. Todo trecho abaixo usa a API `FastMCP` da v1, então instale com teto explícito:

```bash
pip install 'mcp==1.29.0'
```

`mcp>=1.9,<2` também funciona se você quiser o patch 1.x mais recente em vez de pin exato — de qualquer forma, mantenha o teto `<2` até estar pronto pra migrar pra `MCPServer`.

Aqui está o negócio inteiro — salve como `mcp_server.py`:

```python
#!/usr/bin/env python3
"""MCP server exposing local CLI tools via stdio transport."""
from __future__ import annotations

import shlex
import subprocess
import time
from pathlib import Path
from typing import Annotated

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field

mcp = FastMCP("local-toolbox")


class RunResult(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    duration_ms: int


def _run(
    cmd: list[str],
    cwd: Path | None = None,
    timeout: float = 30.0,
    input_data: str | None = None,
) -> RunResult:
    start = time.perf_counter()
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            input=input_data,
            check=False,
        )
        return RunResult(
            stdout=proc.stdout,
            stderr=proc.stderr,
            exit_code=proc.returncode,
            duration_ms=int((time.perf_counter() - start) * 1000),
        )
    except subprocess.TimeoutExpired as e:
        return RunResult(
            stdout=(e.stdout or ""),
            stderr=(e.stderr or "") + f"\n[timed out after {timeout}s]",
            exit_code=124,
            duration_ms=int((time.perf_counter() - start) * 1000),
        )


@mcp.tool()
def rg(
    pattern: Annotated[str, Field(description="Regex pattern to search for")],
    path: Annotated[str, Field(default=".", description="Directory or file to search")],
    flags: Annotated[str, Field(default="", description="Extra rg flags (e.g. '-i -t py')")] = "",
) -> RunResult:
    """Search with ripgrep. Returns structured result with stdout/stderr/exit_code."""
    cmd = ["rg", "--json", *shlex.split(flags), pattern, path]
    return _run(cmd)


@mcp.tool()
def jq(
    filter_expr: Annotated[str, Field(description="jq filter expression")],
    input_json: Annotated[str, Field(description="JSON string to filter")],
) -> RunResult:
    """Transform JSON with jq. Input must be valid JSON string."""
    cmd = ["jq", filter_expr]
    return _run(cmd, input_data=input_json)


@mcp.tool()
def sqlite_query(
    db_path: Annotated[str, Field(description="Path to SQLite database file")],
    query: Annotated[str, Field(description="SELECT query to execute")],
) -> RunResult:
    """Run a read-only SQLite query. No transactions, no writes."""
    if not query.strip().upper().startswith("SELECT"):
        return RunResult(stdout="", stderr="Only SELECT queries allowed", exit_code=400, duration_ms=0)
    cmd = ["sqlite3", "-json", db_path, query]
    return _run(cmd)


@mcp.tool()
def ffmpeg_probe(
    file_path: Annotated[str, Field(description="Media file to inspect")],
) -> RunResult:
    """Probe media file metadata with ffprobe (JSON output)."""
    cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", file_path]
    return _run(cmd)


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

Rode direto pra verificar: `python3 mcp_server.py` — ele fica esperando no stdin. Esse é o servidor inteiro. O decorator `FastMCP` extrai a assinatura da função, monta um JSON Schema a partir das anotações `Field` do Pydantic e registra a ferramenta. `_run` nunca lança — um timeout vira `RunResult` com `exit_code=124` e qualquer saída parcial que o processo produziu antes de morrer, então o cliente sempre recebe um objeto parseável por máquina em vez de stack trace atravessando a fronteira do JSON-RPC.

Cada ferramenta retorna `RunResult`, um modelo tipado sobre o qual o LLM consegue raciocinar. Nenhum `Any` vazando pro schema. O helper `_run` envolve `subprocess.run` com tratamento de timeout, metadado de tempo e um parâmetro `input_data` pra ferramentas como `jq` passarem stdin adiante. `rg` usa saída `--json` pra o modelo receber match parseável. `sqlite_query` força somente leitura na camada de aplicação, devolvendo `RunResult` estruturado com `exit_code=400` em vez de lançar quando alguém tenta enfiar um `DROP TABLE` de contrabando. `jq` e `ffmpeg_probe` fecham o kit "preciso inspecionar alguma coisa agora".

Teste uma ferramenta na mão — lembre que o handshake vem primeiro, igual no exemplo do socat:

```bash
cat <<'EOF' | python3 -u mcp_server.py
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"rg","arguments":{"pattern":"TODO","path":"."}}}
EOF
```

Você recebe respostas JSON-RPC pro `initialize` e pro `tools/call`, nessa ordem. Esse é o contrato que todo cliente fala — pule o handshake e o servidor ainda não tem nada registrado pra chamar.

## Dockerfile que sobe em milissegundos, não em segundos

Não deixe a imagem pesar 1,2 GB e levar 15 segundos de cold-start porque você copiou `python:3.12-slim` e rodou `pip install` em *runtime*. Isso é gambiarra. O conserto não é base mais chique — é embutir as dependências na imagem em *build time* pra nada ser buscado na rede quando o cliente iniciar o container.

Você adoraria usar `gcr.io/distroless/python3-debian12` aqui, mas distroless não vem com shell, sem `apt`, e — o ponto crítico — nenhuma das CLIs que este servidor envolve: sem `rg`, sem `jq`, sem `sqlite3`, sem `ffprobe`. Você precisaria de uma segunda imagem (ou uma cópia multi-stage bem chata de binários e bibliotecas compartilhadas) só pra enfiar o `ripgrep` numa base distroless, e deixa de ser "simples e copiável" no momento em que você faz isso. `python:3.12-slim-bookworm` mais `apt-get install` te dá as quatro ferramentas num estágio só, ainda sobe bem abaixo de um segundo, e continua sendo copiável:

```dockerfile
# syntax=docker/dockerfile:1.7
FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends \
      ripgrep jq sqlite3 ffmpeg \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml mcp_server.py ./
RUN pip install --no-cache-dir 'mcp==1.29.0'
USER nobody
ENTRYPOINT ["python3", "-u", "mcp_server.py"]
```

Um `pyproject.toml` mínimo documenta a dependência mesmo que o Dockerfile instale direto com `pip` (sem `uv.lock` pra manter sincronizado, sem drift de lockfile pra depurar):

```toml
[project]
name = "local-toolbox"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "mcp==1.29.0",
]
```

Se você preferir gerenciar o lockfile com `uv`, rode `uv lock` uma vez pra gerar `uv.lock` a partir desse `pyproject.toml`, depois troque a linha `RUN pip install` por `RUN pip install uv && uv sync --frozen --no-dev` — os dois caminhos chegam na mesma dependência pinada.

`USER nobody` larga o root antes do entrypoint rodar. Não é isolamento nível distroless — você ainda tem shell e gerenciador de pacotes na imagem — mas pra um container que só fala stdio com um cliente local, "não-root, dependências embutidas, sem chamada de rede em runtime" cobre o modelo de ameaça realista.

`.dockerignore` que realmente funciona:

```
**/__pycache__
**/*.pyc
.venv
.git
.gitignore
README.md
*.log
.DS_Store
pytest.ini
```

Construa a imagem:

```bash
docker build -t local-mcp-server:latest .
```

Rode do jeito que o transporte stdio exige — interativo, stdin/stdout conectados, sem alocação de TTY:

```bash
docker run --rm -i local-mcp-server:latest
```

O `-i` mantém o stdin aberto. Sem `-t`. Se você adicionar `-t`, o cliente recebe código de escape ANSI no stream JSON-RPC e você vai passar uma hora debugando mensagem de "parse error" que parece JSON válido.

Comprove a afirmação do cold-start com `hyperfine`:

```bash
hyperfine --warmup 3 --runs 10 'docker run --rm -i local-mcp-server:latest'
```

Saída típica num MacBook Pro 2023 (Apple Silicon, Docker Desktop):

```
Benchmark 1: docker run --rm -i local-mcp-server:latest
  Time (mean ± σ):     287.6 ms ±  15.9 ms    [User: 58.3 ms, System: 34.1 ms]
  Range (min … max):   261.2 ms … 318.4 ms    10 runs
```

Abaixo de 300 ms, quase tudo é overhead de criação de container do Docker, não algo específico do Python. Compare com `python:3.12-slim` com `pip install -r requirements.txt` em *runtime* — 12 a 18 segundos na mesma máquina, porque essa versão busca pacote na rede em todo `docker run` em vez de uma vez só em build time.

Pra ferramentas puramente locais (`rg`, `jq`, `sqlite3`, `ffmpeg`), você não precisa de `ca-certificates` além do que o `slim-bookworm` já traz. Se adicionar uma ferramenta que chama endpoint HTTPS, os certificados já estão lá — uma coisa a menos pra depurar do que numa base distroless.

## Configs de cliente que não brigam com você

Todo cliente fala o mesmo protocolo stdio. Todo cliente insiste no próprio schema de config. Aqui estão os quatro que você vai usar de verdade, cada um apontando pra mesma imagem Docker que você construiu.

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` no macOS)

```json
{
  "mcpServers": {
    "local-tools": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/Users/you/projects:/workspace",
        "-w", "/workspace",
        "local-mcp-server:latest"
      ]
    }
  }
}
```

Reinicie o Claude Desktop. O ícone de martelo aparece. Se não aparecer, olhe `~/Library/Logs/Claude/mcp*.log` — o stderr do servidor cai lá.

### Continue (`~/.continue/config.yaml`)

Builds atuais do Continue usam config em YAML, não o antigo `config.json`. Adicione uma lista `mcpServers` — use caminho absoluto no host pro mount do volume; a documentação do Continue não documenta substituição de `${workspaceFolder}` dentro dos args de `mcpServers`, então não confie nisso:

```yaml
mcpServers:
  - name: local-tools
    command: docker
    args:
      - run
      - -i
      - --rm
      - -v
      - /Users/you/projects:/workspace
      - -w
      - /workspace
      - local-mcp-server:latest
```

Prefere config por projeto? Coloque um arquivo separado em `.continue/mcpServers/local-tools.yaml` com a mesma chave `mcpServers`, mais os campos de metadados obrigatórios `name`, `version` e `schema: v1` no nível raiz. Abra a barra lateral do Continue → MCP → "Refresh" se as ferramentas não aparecerem.

### Cline (armazenamento global do VS Code)

O Cline mantém o próprio arquivo de settings, separado do VS Code e do Continue — não existe `.cline/mcp_settings.json` na raiz do projeto. No macOS/Linux ele mora dentro do `globalStorage` do VS Code:

- macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- Cline CLI (sem VS Code): `~/.cline/mcp.json`

Caminho mais fácil: clique no ícone de MCP Servers (tomada) no painel do Cline → Configure → "Configure MCP Servers", que abre o arquivo certo pra você.

```json
{
  "mcpServers": {
    "local-tools": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/Users/you/projects:/workspace",
        "-w", "/workspace",
        "local-mcp-server:latest"
      ]
    }
  }
}
```

Não existe uma env var `MCP_LOG_LEVEL` que o Cline (ou qualquer cliente) leia automaticamente — isso foi invenção. Pra logging verboso, controle pelo lado do servidor: `FastMCP("local-toolbox", log_level="DEBUG")` no construtor aumenta o próprio logging de stderr do SDK, que ainda cai no painel de saída do Cline porque stderr é exatamente o que o cliente captura.

### Zed (`~/.config/zed/settings.json`)

A chave do Zed é `context_servers`, não `mcp` ou `mcpServers`, e servidores locais usam `source: "custom"` mais campos planos `command`/`args`/`env`:

```json
{
  "context_servers": {
    "local-tools": {
      "source": "custom",
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-v", "/home/you/projects:/workspace",
        "-w", "/workspace",
        "local-mcp-server:latest"
      ],
      "env": {}
    }
  }
}
```

Reinicie o Zed. Command palette → "agent: open settings" → MCP Servers confirma o registro.

---

### O checklist de debug "lista de ferramentas vazia"

1. **Flag de transporte errada** — Seu servidor *precisa* rodar com `stdio` (o padrão). Se você copiou um exemplo com `FastMCP(..., transport="sse")`, apague isso.
2. **Falta o `-i` do Docker** — Sem `-i`, o stdin fecha na hora. O servidor sobe, vê EOF e termina. O cliente vê zero ferramentas.
3. **Mount path errado** — As ferramentas executam *dentro* do container em `/workspace`. Sua ferramenta `read_file` espera caminhos relativos a esse mount. Passe `/workspace/actual/file.py`, não `/home/you/projects/actual/file.py`.
4. **Falha de validação de schema** — Rode a imagem na mão e envie o handshake *completo*, não um `tools/list` isolado (o servidor não tem nada pra responder direito até ser inicializado).

Faça assim:

```bash
cat <<'EOF' | docker run -i --rm local-mcp-server:latest
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
EOF
```

Respostas JSON-RPC válidas pra `id: 1` e `id: 2`? Se não, seu decorator `@mcp.tool()` devolveu algo que o gerador de schema rejeitou (geralmente um tipo `Union` ou um `dict` sem tipo).

Pra logs verbosos, passe `log_level="DEBUG"` ao construtor `FastMCP(...)` e reconstrua a imagem — o servidor emite cada par de requisição/resposta no stderr, visível no painel de log de cada cliente. Você vê o erro de validação exato antes de terminar o café.

## Expondo sua caixa de ferramentas de verdade: rg, jq, sqlite3, ffmpeg

O servidor `FastMCP` da seção 2 é bonitinho. Ele soma números. Agora faça ele trabalhar de verdade. Você já tem `rg`, `jq`, `sqlite3` e `ffprobe` instalados — provavelmente via Homebrew, apt, ou aquele `nix-env -iA` que você se arrepende de ter rodado. Envolva. Cada ferramenta vira função tipada com timeout, saída estruturada e zero tolerância pra processo pendurado.

Comece com os imports e um helper de subprocesso reutilizável que não engole o stderr. Mesmo pin `mcp==1.29.0` de antes — esta seção reaproveita o mesmo import de `FastMCP`, só que num segundo arquivo de servidor:

```python
import asyncio
import json
import sqlite3
from typing import Annotated, Any

from pydantic import Field
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("toolbox")

async def run_cmd(cmd: list[str], timeout: float = 10.0) -> dict[str, Any]:
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        return {"ok": False, "error": f"timeout after {timeout}s", "stdout": "", "stderr": ""}
    return {
        "ok": proc.returncode == 0,
        "exit_code": proc.returncode,
        "stdout": stdout.decode("utf-8", errors="replace"),
        "stderr": stderr.decode("utf-8", errors="replace"),
    }
```

Agora as ferramentas, com parâmetros `Annotated` planos em vez de um modelo Pydantic aninhado por ferramenta — o mesmo estilo do servidor `rg`/`jq`/`sqlite_query` acima. Schema plano é o que LLM preenche com confiança; embrulhar toda chamada num único objeto `args: SearchArgs` só adiciona uma camada que o modelo precisa acertar sem benefício nenhum. `search_code` — ripgrep com saída JSON, porque parsear lixo colorido de terminal é pra masoquista:

```python
@mcp.tool()
async def search_code(
    pattern: Annotated[str, Field(description="Regex pattern")],
    path: Annotated[str, Field(default=".", description="Root directory")],
    file_type: Annotated[str | None, Field(default=None, description="File type (e.g. py, js, rs)")] = None,
) -> dict[str, Any]:
    cmd = ["rg", "--json", "--no-heading", "--line-number", pattern]
    if file_type:
        cmd += ["-t", file_type]
    cmd.append(path)
    return await run_cmd(cmd, timeout=15.0)
```

`transform_json` — jq com uma string de filtro. O JSON de entrada vem do LLM, não de um arquivo, então passe via stdin:

```python
@mcp.tool()
async def transform_json(
    filter_expr: Annotated[str, Field(description="jq filter expression")],
    input_data: Annotated[dict | list, Field(description="JSON value to transform")],
) -> dict[str, Any]:
    proc = await asyncio.create_subprocess_exec(
        "jq", filter_expr,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(
            proc.communicate(json.dumps(input_data).encode()),
            timeout=5.0,
        )
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        return {"ok": False, "error": "jq timeout", "stdout": "", "stderr": ""}
    return {
        "ok": proc.returncode == 0,
        "stdout": stdout.decode().strip(),
        "stderr": stderr.decode().strip(),
    }
```

`query_db` — essa vale diminuir o ritmo pra explicar. Chamar a CLI `sqlite3` e anexar `params` como argumentos posicionais extras (como um rascunho anterior deste post fazia) **não é** SQL parametrizado — a CLI não tem binding de placeholder `?`, então esses "params" simplesmente viram argumentos posicionais literais no fim da chamada do binário `sqlite3` e não fazem nada pela string da query. Binding de parâmetro de verdade significa usar o próprio módulo `sqlite3` do Python, que de fato suporta placeholders `?`, executado fora do event loop numa thread já que o módulo é síncrono:

```python
@mcp.tool()
async def query_db(
    db_path: Annotated[str, Field(description="Path to .sqlite file")],
    sql: Annotated[str, Field(description="SELECT only — no mutations")],
    params: Annotated[list[Any], Field(default_factory=list, description="Positional ? parameters for the query")],
) -> dict[str, Any]:
    if not sql.strip().upper().startswith("SELECT"):
        return {"ok": False, "error": "only SELECT statements allowed", "rows": []}

    def _query() -> list[dict[str, Any]]:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        try:
            cursor = conn.execute(sql, params)
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    try:
        rows = await asyncio.wait_for(asyncio.to_thread(_query), timeout=10.0)
    except asyncio.TimeoutError:
        return {"ok": False, "error": "query timeout after 10s", "rows": []}
    except sqlite3.Error as e:
        return {"ok": False, "error": str(e), "rows": []}
    return {"ok": True, "rows": rows}
```

Agora `sql = "SELECT * FROM audit WHERE name = ?"` com `params = ["DROP TABLE users"]` simplesmente procura por uma linha literalmente chamada "DROP TABLE users" — é pra isso que serve a parametrização.

`probe_media` — ffprobe com saída estruturada. Seu LLM agora consegue responder "qual é o bitrate desse MOV de 4GB?" sem você precisar abrir o VLC:

```python
@mcp.tool()
async def probe_media(
    path: Annotated[str, Field(description="Media file path")],
) -> dict[str, Any]:
    cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", path]
    return await run_cmd(cmd, timeout=30.0)
```

Reconstrua a imagem Docker (seção anterior) — a base já tem `rg`, `jq`, `sqlite3`, `ffmpeg` via `apt-get install -y --no-install-recommends ripgrep jq sqlite3 ffmpeg`. Reinicie o cliente. Agora pergunte ao Claude Desktop: *"Encontre todos os arquivos Python mencionando 'asyncio' em ~/projects, extraia os nomes das funções com jq, e depois verifique se alguma dessas funções aparece na tabela de auditoria migration_log."*

O LLM chama `search_code` → `transform_json` (filtro: `.[].data.submatches[].match.text | select(test("def\\s+\\w+")) | capture("def\\s+(?<name>\\w+)") | .name | unique`) → `query_db` com os nomes resultantes vinculados como parâmetros `?` reais. Você recebe uma tabela em markdown de volta. Sem copiar e colar. Sem "deixa eu rodar isso localmente primeiro". A cadeia subprocesso-mais-SQLite completa em menos de dois segundos.

Esse é o ponto. Suas ferramentas de CLI já eram de produção. Você só deu a elas uma interface JSON-RPC.

## Debugando quando as coisas dão errado

Seu servidor compila. O container sobe. O config do cliente carrega. E então — nada. Nenhuma ferramenta aparece. Nenhum erro surge. Só um silêncio educado que faz você questionar cada decisão de vida que te trouxe até aqui. Bem-vindo ao debug de MCP, onde o stdout é o protocolo e o stderr é a sua única lanterna.

Primeira regra: **nunca escreva log no stdout**. O protocolo JSON-RPC mora lá. Um `print("debug: starting up")` e você corrompeu o stream, fazendo o cliente parsear sua saudação amigável como resposta malformada. Use `logging` exclusivamente pra stderr:

```python
import logging, sys

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("mcp_server")
```

Agora todo `log.debug("rg exited with code %d", result.returncode)` cai no terminal ou nos logs do Docker sem quebrar o handshake. Rode o container com `-i` (interativo) pra manter o stdin conectado — **esse é o motivo número um pelo qual ferramentas desaparecem**. Sem `-i`, o Docker fecha o stdin na hora, o servidor recebe EOF e termina antes do cliente conseguir enviar `initialize`. Seu `docker run` precisa incluir `-i`:

```bash
docker run -i --rm \
  -v /home/me/code:/workspace \
  -w /workspace \
  local-mcp-server:latest
```

Esqueceu o `-i`? O cliente inicia o container, envia `initialize`, recebe um TCP RST e silenciosamente marca o servidor como "desconectado". Você vê zero erros na UI do cliente. Olhe `docker logs <container_id>` — vai achar exit code 0 limpo e nenhuma pista.

Próximo: **permissões de mount de volume**. Sua ferramenta `rg` lê `/workspace`. O container roda como `nobody` (`USER nobody` no Dockerfile), não como root. O diretório do host é dono da UID 1000, e a UID do `nobody` dentro do container (65534 no Debian) não bate. `rg` falha com `Permission denied`, mas o erro nunca chega ao cliente se o handler da ferramenta capturar a exceção e engolir em vez de devolver. Deixe os erros propagarem ou logue explicitamente pra aparecerem como resultado estruturado que o cliente consegue mostrar:

```python
@mcp.tool()
def ripgrep(pattern: str, path: str = "/workspace") -> dict:
    log.debug("rg %s %s", pattern, path)
    try:
        result = subprocess.run(
            ["rg", "--json", pattern, path],
            capture_output=True, text=True, timeout=30, check=False
        )
        return {"exit_code": result.returncode, "stdout": result.stdout, "stderr": result.stderr}
    except subprocess.TimeoutExpired as e:
        log.error("rg timed out after 30s: %s", e)
        raise  # let the client see the timeout error
```

**Descompasso de schema de ferramenta** é o assassino silencioso. Você troca um parâmetro de `str` pra `int` mas esquece de regenerar o schema cacheado do cliente. O Claude Desktop cacheia agressivo. Reinicie *por completo* (Cmd+Q, não só fechar a janela). Continue e Cline recarregam na mudança de config — em geral. Na dúvida, zere o cache:

```bash
# Claude Desktop — quoting a leading ~ stops the shell from expanding it, so spell out $HOME
rm -rf "$HOME/Library/Application Support/Claude/mcp_cache"

# Continue (VS Code)
rm -rf ~/.continue/mcp-cache
```

**Tratamento de timeout** dói quando `ffprobe` trava num MKV corrompido. O cliente espera. E espera. O timeout padrão de ferramenta do `FastMCP` é *nenhum*. Adicione um wrapper:

```python
import signal

def with_timeout(seconds: int):
    def decorator(fn):
        def wrapper(*args, **kwargs):
            def handler(signum, frame):
                raise TimeoutError(f"Tool {fn.__name__} exceeded {seconds}s")
            old = signal.signal(signal.SIGALRM, handler)
            signal.alarm(seconds)
            try:
                return fn(*args, **kwargs)
            finally:
                signal.alarm(0)
                signal.signal(signal.SIGALRM, old)
        return wrapper
    return decorator

@mcp.tool()
@with_timeout(15)
def ffprobe(path: str) -> dict:
    ...
```

Funciona em Linux/macOS. Windows? Use `threading.Timer` no lugar — signal é coisa de Unix.

**Teste interativo**: pule o cliente por completo. O pacote `mcp` traz um inspector — fixe na mesma versão `mcp[cli]==1.29.0` que você roda em todo lugar, já que as expectativas de protocolo da CLI do Inspector precisam bater com a versão do SDK do servidor:

```bash
uvx --from 'mcp[cli]==1.29.0' mcp dev mcp_server.py
```

Abre uma UI de navegador em `http://localhost:6274` (não 5173 — essa é a porta padrão de dev do Vite, não a do Inspector) onde você pode chamar ferramentas, inspecionar schemas e ver os frames JSON-RPC crus. Inestimável pra verificar se sua ferramenta `ripgrep` devolve JSON válido antes de culpar o cliente.

**Capture uma sessão** pra post-mortem. `2> session.log` só captura o que suas chamadas de `logging` escrevem — texto legível por humano, não JSON-RPC. O tráfego real do protocolo viaja no stdin/stdout, e um cliente de verdade (Claude Desktop, Continue, Cline) é dono desses pipes diretamente, então você não consegue só redirecionar no meio da sessão. Pra capturar tráfego real de requisição/resposta, opere o servidor na mão e use `tee` nos dois streams:

```bash
cat <<'EOF' | tee requests.log | docker run -i --rm local-mcp-server:latest | tee responses.log
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"rg","arguments":{"pattern":"TODO","path":"/workspace"}}}
EOF
```

Depois inspecione só as chamadas de ferramenta, em qualquer um dos arquivos que tenha o método que você procura:

```bash
jq -c 'select(.method=="tools/call")' requests.log responses.log 2>/dev/null
```

Você vê cada parâmetro que enviou, cada resposta que o servidor devolveu, e exatamente onde o schema divergiu da realidade. Pra uma sessão em tempo real contra um cliente de verdade, pule a captura manual e use o Inspector acima — não existe jeito limpo de usar `tee` num pipe que um cliente já possui.
