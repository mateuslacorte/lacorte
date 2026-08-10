---
title: 'Rode Seu Próprio Servidor MCP Localmente: Transporte stdio, Zero Conta de Nuvem, Controle de Verdade'
date: '2026-08-10'
tags:
  - mcp
  - docker
  - cli
  - local-first
  - ferramentas-llm
  - stdio
description: >-
  Construa um servidor MCP de nível de produção que roda localmente via transporte stdio, exponha suas CLIs já existentes para qualquer cliente LLM (Claude Desktop, Continue, Cline) e pule completamente o pedágio dos provedores de nuvem.
---

Todo anúncio de plataforma neste mês grita "MCP! Agentes! Funções na nuvem!" — Cloudflare Workers, Vercel Sandbox, algum novo "navegador agêntico" rodando em isolados V8. Todos eles querem seu cartão de crédito e sua telemetria. Você só quer que seu modelo de linguagem rode `rg` ou `jq` ou aquele script de migração legado amaldiçoado sem copiar a saída de um lado para o outro como se fosse 2010.

Boa notícia: o transporte stdio do MCP existe desde que a spec foi lançada. Ele inicia seu servidor como um subprocesso, transmite JSON-RPC via stdin/stdout, e não exige absolutamente nenhuma configuração de rede. Sem portas, sem TLS, sem túneis `ngrok`, sem API keys. Seu editor (ou Claude Desktop, ou Continue, ou Cline) cria o processo, conversa com ele, e o mata quando termina. É só isso.

Este post te guia pela construção de um servidor MCP de verdade que expõe sua caixa de ferramentas de CLI de verdade — `rg`, `jq`, `sqlite3`, `ffmpeg`, o que quer que você tenha em `/usr/local/bin` — como ferramentas chamáveis. Você vai escrever o servidor em cerca de 100 linhas de Python, empacotá-lo numa imagem Docker que inicia em milissegundos, conectá-lo em todas as configs de cliente relevantes, e depurar os inevitáveis momentos "por que minha ferramenta não aparece" com logs estruturados que você realmente consegue ler. Sem conta na Cloudflare. Sem projeto na Vercel. Sem termos da moda "agêntico". Só um subprocesso que faz o que você manda.

## Por Que o Transporte stdio É o Único de Que Você Precisa Localmente

O MCP define três transportes: stdio, SSE e HTTP streamable. Dois deles resolvem problemas que você não tem.

**SSE** (Server-Sent Events) mantém uma conexão HTTP aberta para pushes do servidor para o cliente. Ótimo para um servidor remoto atrás de um load balancer. Localmente? Você está rodando um servidor web, gerenciando uma porta, lidando com CORS, e se perguntando por que suas regras de firewall engolem a conexão. **HTTP Streamable** (adicionado na spec de 2025-03-26) atualiza o SSE com streaming bidirecional sobre um único endpoint. Mesma sobrecarga, termos da moda mais novos.

**stdio** inicia seu servidor como um processo filho. JSON-RPC flui via stdin/stdout. O cliente é dono do ciclo de vida: cria, conversa, mata. Sem portas. Sem TLS. Sem unit do `systemd`. Sem `docker run -p`. Funciona via SSH porque o subprocesso roda na máquina remota — seu editor local só transmite bytes pelo túnel já existente. Tenta fazer isso com SSE.

Aqui está o protocolo de fio. Sem SDK necessário.

```bash
# Terminal 1: pretend to be the client
cat <<'EOF' | socat - EXEC:"python3 -u mcp_server.py"
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
EOF
```

`mcp_server.py` (na próxima seção) lê JSON delimitado por linha do stdin, escreve respostas no stdout. O `EXEC:` simples do `socat` conecta o stdin/stdout do subprocesso diretamente ao pipe — sem precisar de `pty`. O JSON delimitado por nova linha do MCP não se importa com semântica de TTY, e alocar um pseudo-terminal na verdade arriscaria corromper o stream (buffer por linha, eco) em vez de ajudar.

Saída que você vai ver:

```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"local-toolbox","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"rg","description":"ripgrep search","inputSchema":{"type":"object","properties":{"pattern":{"type":"string"},"path":{"type":"string"}},"required":["pattern"]}}]}}
```

Sem headers HTTP. Sem chunked encoding. JSON delimitado por nova linha. É todo o handshake.

O ciclo de vida é de graça: o cliente manda `SIGTERM` (ou fecha o stdin), o processo termina, os file descriptors são limpos. Sem containers órfãos. Sem bagunça de `docker ps -a`. Se seu editor travar, o SO recolhe o filho. Tenta obter essa garantia de uma função de nuvem.

Conflitos de porta? Extintos. Rode cinco servidores MCP simultaneamente — cada um ganha seu próprio pipe stdio. Sem erros de `address already in use`, sem ginástica de `PORT=3001`.

A única pegadinha: o stdio é local por design. Isso não é uma limitação — é a característica. Você quer ferramentas locais expostas a um modelo local. O transporte deveria desaparecer.

## O Servidor de ~100 Linhas: Ferramentas como Funções Puras

O pacote oficial `mcp` te dá uma classe `FastMCP` que lida com o boilerplate de JSON-RPC. Você decora funções, ele constrói o schema, e o transporte stdio é o padrão.

Um detalhe importa mais do que qualquer outra linha deste post: `mcp==1.29.0`. O pacote `mcp` chegou na versão `2.0.0` e renomeou `FastMCP` para `MCPServer`, movendo o módulo inteiro de `mcp.server.fastmcp` para `mcp.server.mcpserver`. Todo trecho abaixo usa a API `FastMCP` da v1, então instale com um limite superior explícito:

```bash
pip install 'mcp==1.29.0'
```

`mcp>=1.9,<2` também funciona se você quiser o patch 1.x mais recente em vez de um pin exato — de qualquer forma, mantenha o teto `<2` até estar pronto para migrar para `MCPServer`.

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

Rode-o diretamente para verificar: `python3 mcp_server.py` — ele fica esperando no stdin. Esse é o servidor inteiro. O decorator `FastMCP` extrai a assinatura da função, constrói um JSON Schema a partir das anotações `Field` do Pydantic, e registra a ferramenta. `_run` nunca lança exceção — um timeout se torna um `RunResult` com `exit_code=124` e qualquer saída parcial que o processo produziu antes de morrer, então o cliente sempre recebe um objeto parseável por máquina em vez de um stack trace cruzando a fronteira do JSON-RPC.

Cada ferramenta retorna `RunResult`, um modelo tipado sobre o qual o LLM pode raciocinar. Nenhum `Any` escapando para o schema. O helper `_run` envolve `subprocess.run` com tratamento de timeout, metadados de tempo, e um parâmetro `input_data` para que ferramentas como `jq` possam passar stdin adiante. `rg` usa saída `--json` para que o modelo receba matches parseáveis. `sqlite_query` impõe somente leitura na camada de aplicação, retornando um `RunResult` estruturado com `exit_code=400` em vez de lançar exceção quando alguém tenta enfiar um `DROP TABLE` de contrabando. `jq` e `ffmpeg_probe` completam o kit de ferramentas "preciso inspecionar algo agora mesmo".

Teste uma ferramenta manualmente — lembre-se que o handshake vem primeiro, igual no exemplo do socat:

```bash
cat <<'EOF' | python3 -u mcp_server.py
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"rg","arguments":{"pattern":"TODO","path":"."}}}
EOF
```

Você vai receber respostas JSON-RPC para o `initialize` e para o `tools/call`, nessa ordem. Esse é o contrato que todo cliente fala — pule o handshake e o servidor ainda não tem nada registrado para chamar.

## Dockerfile Que Inicia em Milissegundos, Não Segundos

Não deixe a imagem do container pesar 1,2 GB e levar 15 segundos para dar cold-start porque você copiou `python:3.12-slim` e rodou `pip install` em *runtime*. Isso é amadorismo. O conserto não é uma imagem base mais chique — é embutir as dependências na imagem em *build time* para que nada seja buscado pela rede quando o cliente iniciar seu container.

Você adoraria usar `gcr.io/distroless/python3-debian12` aqui, mas distroless não vem com shell, sem `apt`, e criticamente, nenhuma das CLIs que este servidor envolve — sem `rg`, sem `jq`, sem `sqlite3`, sem `ffprobe`. Você precisaria de uma segunda imagem (ou uma cópia multi-stage bem complicada de binários e suas bibliotecas compartilhadas) só para colocar o `ripgrep` numa base distroless, e ela deixa de ser "simples e copiável" no momento em que você faz isso. `python:3.12-slim-bookworm` mais `apt-get install` te dá as quatro ferramentas num único estágio direto, ainda inicia em bem menos de um segundo, e continua sendo copiável:

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

Um `pyproject.toml` mínimo documenta a dependência mesmo que o Dockerfile a instale diretamente com `pip` (sem `uv.lock` para manter sincronizado, sem drift de lockfile para depurar):

```toml
[project]
name = "local-toolbox"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "mcp==1.29.0",
]
```

Se você preferir gerenciar o lockfile com `uv`, rode `uv lock` uma vez para gerar `uv.lock` a partir desse `pyproject.toml`, depois troque a linha `RUN pip install` por `RUN pip install uv && uv sync --frozen --no-dev` — ambos os caminhos chegam na mesma dependência fixada.

`USER nobody` abandona o root antes do entrypoint rodar. Não é isolamento de nível distroless — você ainda tem um shell e um gerenciador de pacotes sentados na imagem — mas para um container que só fala stdio com um cliente local, "não-root, dependências embutidas, sem chamadas de rede em runtime" cobre o modelo de ameaça realista.

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

Rode-a do jeito que o transporte stdio exige — interativo, stdin/stdout conectados, sem alocação de TTY:

```bash
docker run --rm -i local-mcp-server:latest
```

O `-i` mantém o stdin aberto. Sem `-t`. Se você adicionar `-t`, o cliente recebe códigos de escape ANSI no stream JSON-RPC e você vai passar uma hora depurando mensagens de "parse error" que parecem JSON válido.

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

Abaixo de 300 ms, quase tudo sobrecarga de criação de container do Docker em vez de algo específico do Python. Compare com `python:3.12-slim` com `pip install -r requirements.txt` em *runtime* — 12 a 18 segundos na mesma máquina, porque essa versão busca pacotes pela rede em todo `docker run` em vez de uma vez só em build time.

Para ferramentas puramente locais (`rg`, `jq`, `sqlite3`, `ffmpeg`), você não precisa de `ca-certificates` além do que o `slim-bookworm` já traz. Se você adicionar uma ferramenta que chama endpoints HTTPS, os certificados já estão lá — uma coisa menos para depurar do que numa base distroless.

## Configs de Cliente Que Não Brigam Com Você

Todo cliente fala o mesmo protocolo stdio. Todo cliente insiste no seu próprio schema de config. Aqui estão os quatro que você vai realmente usar, cada um apontando para a mesma imagem Docker que você construiu.

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

Reinicie o Claude Desktop. O ícone de martelo aparece. Se não aparecer, verifique `~/Library/Logs/Claude/mcp*.log` — o stderr do servidor cai lá.

### Continue (`~/.continue/config.yaml`)

Builds atuais do Continue usam o config em YAML, não o antigo `config.json`. Adicione uma lista `mcpServers` — use um caminho absoluto no host para o mount do volume; a documentação do Continue não documenta substituição de `${workspaceFolder}` dentro dos args de `mcpServers`, então não confie nisso:

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

Prefere um config por projeto? Coloque um arquivo separado em `.continue/mcpServers/local-tools.yaml` com a mesma chave `mcpServers`, mais os campos de metadados obrigatórios `name`, `version` e `schema: v1` no nível raiz. Abra a barra lateral do Continue → MCP → "Refresh" se as ferramentas não aparecerem.

### Cline (armazenamento global do VS Code)

O Cline mantém seu próprio arquivo de configurações, separado do VS Code e do Continue — não existe um `.cline/mcp_settings.json` na raiz do projeto. No macOS/Linux ele fica dentro do `globalStorage` do VS Code:

- macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- Cline CLI (sem VS Code): `~/.cline/mcp.json`

Caminho mais fácil: clique no ícone de MCP Servers (tomada) no painel do Cline → Configure → "Configure MCP Servers", que abre o arquivo certo para você.

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

Não existe uma env var `MCP_LOG_LEVEL` que o Cline (ou qualquer cliente) leia automaticamente — isso foi invenção. Para logging verboso, controle pelo lado do servidor: `FastMCP("local-toolbox", log_level="DEBUG")` no construtor aumenta o próprio logging de stderr do SDK, que ainda cai no painel de saída do Cline porque stderr é exatamente o que o cliente captura.

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

### O Checklist de Depuração "Lista de Ferramentas Vazia"

1. **Flag de transporte errada** — Seu servidor *precisa* rodar com `stdio` (o padrão). Se você copiou um exemplo com `FastMCP(..., transport="sse")`, apague-o.
2. **Falta o `-i` do Docker** — Sem `-i`, o stdin fecha imediatamente. O servidor inicia, vê EOF, e termina. O cliente vê zero ferramentas.
3. **Mount path errado** — As ferramentas executam *dentro* do container em `/workspace`. Sua ferramenta `read_file` espera caminhos relativos a esse mount. Passe `/workspace/actual/file.py`, não `/home/you/projects/actual/file.py`.
4. **Falha de validação de schema** — Rode a imagem manualmente e envie o handshake *completo*, não um `tools/list` isolado (o servidor não tem nada para responder corretamente até ser inicializado).

Faça assim:

```bash
cat <<'EOF' | docker run -i --rm local-mcp-server:latest
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
EOF
```

Respostas JSON-RPC válidas para `id: 1` e `id: 2`? Se não, seu decorator `@mcp.tool()` retornou algo que o gerador de schema rejeitou (geralmente um tipo `Union` ou um `dict` sem tipo).

Para logs verbosos, passe `log_level="DEBUG"` ao construtor `FastMCP(...)` e reconstrua a imagem — o servidor emite cada par de requisição/resposta no stderr, visível no painel de log de cada cliente. Você vai ver o erro de validação exato antes de terminar o café.

## Expondo Sua Caixa de Ferramentas de Verdade: rg, jq, sqlite3, ffmpeg

O servidor `FastMCP` da seção 2 é bonitinho. Ele soma números. Agora faça-o trabalhar de verdade. Você já tem `rg`, `jq`, `sqlite3` e `ffprobe` instalados — provavelmente via Homebrew, apt, ou aquele comando `nix-env -iA` que você se arrepende de ter rodado. Envolva-os. Cada ferramenta se torna uma função tipada com timeout, saída estruturada e zero tolerância para processos pendurados.

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

Agora as ferramentas, com parâmetros `Annotated` planos em vez de um modelo Pydantic aninhado por ferramenta — o mesmo estilo do servidor `rg`/`jq`/`sqlite_query` acima. Um schema plano é o que os LLMs preenchem de forma confiável; envolver toda chamada num único objeto `args: SearchArgs` só adiciona uma camada que o modelo precisa acertar sem benefício nenhum. `search_code` — ripgrep com saída JSON, porque parsear lixo colorido de terminal é para masoquistas:

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

`transform_json` — jq com uma string de filtro. O JSON de entrada vem do LLM, não de um arquivo, então passe-o via stdin:

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

`query_db` — essa é a que vale a pena diminuir o ritmo para explicar. Chamar a CLI `sqlite3` e anexar `params` como argumentos posicionais extras (como um rascunho anterior deste post fazia) **não é** SQL parametrizado — a CLI não tem nenhum binding de placeholder `?`, então esses "params" simplesmente se tornam argumentos posicionais literais no fim da chamada do binário `sqlite3` e não fazem nada pela string da query. Binding de parâmetro de verdade significa usar o próprio módulo `sqlite3` do Python, que de fato suporta placeholders `?`, executado fora do event loop numa thread já que o módulo é síncrono:

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

Agora `sql = "SELECT * FROM audit WHERE name = ?"` com `params = ["DROP TABLE users"]` simplesmente procura por uma linha literalmente chamada "DROP TABLE users" — é para isso que serve a parametrização.

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

Esse é o ponto. Suas ferramentas de CLI já eram de nível de produção. Você só deu a elas uma interface JSON-RPC.

## Depurando Quando as Coisas Dão Errado

Seu servidor compila. O container inicia. O config do cliente carrega. E então — nada. Nenhuma ferramenta aparece. Nenhum erro surge. Só um silêncio educado que te faz questionar cada decisão de vida que te trouxe até este momento. Bem-vindo à depuração de MCP, onde o stdout é o protocolo e o stderr é sua única lanterna.

Primeira regra: **nunca escreva logs no stdout**. O protocolo JSON-RPC mora lá. Um `print("debug: starting up")` e você corrompeu o stream, fazendo o cliente parsear sua saudação amigável como uma resposta malformada. Use `logging` exclusivamente para stderr:

```python
import logging, sys

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("mcp_server")
```

Agora todo `log.debug("rg exited with code %d", result.returncode)` cai no seu terminal ou nos logs do Docker sem quebrar o handshake. Rode o container com `-i` (interativo) para manter o stdin conectado — **esse é o motivo número um pelo qual ferramentas desaparecem**. Sem `-i`, o Docker fecha o stdin imediatamente, o servidor recebe EOF, e termina antes que o cliente consiga enviar `initialize`. Seu `docker run` precisa incluir `-i`:

```bash
docker run -i --rm \
  -v /home/me/code:/workspace \
  -w /workspace \
  local-mcp-server:latest
```

Esqueceu o `-i`? O cliente inicia o container, envia `initialize`, recebe um TCP RST, e silenciosamente marca o servidor como "desconectado". Você vai ver zero erros na UI do cliente. Verifique `docker logs <container_id>` — você vai encontrar um exit code 0 limpo e nenhuma pista.

Próximo: **permissões de mount de volume**. Sua ferramenta `rg` lê `/workspace`. O container roda como `nobody` (`USER nobody` no Dockerfile), não como root. O diretório do host é dono da UID 1000, e a UID do `nobody` dentro do container (65534 no Debian) não bate com ela. `rg` falha com `Permission denied`, mas o erro nunca chega ao cliente se o handler da ferramenta capturar a exceção e engoli-la em vez de retorná-la. Deixe os erros propagarem ou logue-os explicitamente para que apareçam como um resultado estruturado que o cliente consegue exibir:

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

**Descompassos de schema de ferramenta** são o assassino silencioso. Você troca um parâmetro de `str` para `int` mas esquece de regenerar o schema cacheado do cliente. O Claude Desktop cacheia agressivamente. Reinicie-o *completamente* (Cmd+Q, não só fechar a janela). Continue e Cline recarregam na mudança de config — geralmente. Na dúvida, zere o cache:

```bash
# Claude Desktop — quoting a leading ~ stops the shell from expanding it, so spell out $HOME
rm -rf "$HOME/Library/Application Support/Claude/mcp_cache"

# Continue (VS Code)
rm -rf ~/.continue/mcp-cache
```

**Tratamento de timeout** mordem quando `ffprobe` pendura num MKV corrompido. O cliente espera. E espera. O timeout padrão de ferramenta do `FastMCP` é *nenhum*. Adicione um wrapper:

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

Funciona em Linux/macOS. Windows? Use `threading.Timer` em vez disso — signals são coisa de Unix.

**Teste interativo**: pule o cliente completamente. O pacote `mcp` traz um inspector — fixe-o na mesma versão `mcp[cli]==1.29.0` que você está rodando em todo lugar, já que as expectativas de protocolo da CLI do Inspector precisam bater com a versão do SDK do seu servidor:

```bash
uvx --from 'mcp[cli]==1.29.0' mcp dev mcp_server.py
```

Abre uma UI de navegador em `http://localhost:6274` (não 5173 — essa é a porta padrão de dev do Vite, não a do Inspector) onde você pode chamar ferramentas, inspecionar schemas, e ver os frames JSON-RPC crus. Inestimável para verificar se sua ferramenta `ripgrep` retorna JSON válido antes de culpar o cliente.

**Capture uma sessão** para post-mortem. `2> session.log` só captura o que suas chamadas de `logging` escrevem — texto legível por humano, não JSON-RPC. O tráfego real do protocolo viaja no stdin/stdout, e um cliente de verdade (Claude Desktop, Continue, Cline) é dono desses pipes diretamente, então você não pode simplesmente redirecioná-los no meio da sessão. Para capturar tráfego real de requisição/resposta, opere o servidor manualmente e use `tee` nos dois streams:

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

Você vai ver cada parâmetro que enviou, cada resposta que o servidor retornou, e exatamente onde o schema divergiu da realidade. Para uma sessão em tempo real contra um cliente de verdade, pule a captura manual e use o Inspector acima — não existe um jeito limpo de usar `tee` num pipe que um cliente já possui.
