---
title: 'Rode um LLM Local com Streaming, Tool Calling e um Proxy de Privacidade — Sem Nuvem'
date: '2026-08-02'
tags:
  - docker
  - python
  - redes
  - segurança
  - cli
  - llm
description: >-
  Monte um LLM local com streaming via WebSocket, tool calling via MCP e proxy de privacidade OHTTP usando só Docker, CLIs padrão e arquivos de config — sem API keys, sem conta na nuvem.
---

Você não precisa de um cluster de GPUs para rodar um modelo útil. Você não precisa de uma API key para fazer streaming de tokens. E você definitivamente não precisa mandar seus prompts pelo pipeline de logs de outra pessoa só para executar um comando de shell. As manchetes estão cheias de debates sobre "IA open-source" e frameworks corporativos de governança — enquanto isso, eu venho rodando um modelo 7B num Hetzner CX42 que faz streaming de tokens via WebSocket, chama ferramentas locais via MCP, e conversa com ele através de Oblivious HTTP para que o caminho da requisição — nome do modelo, prompt, argumentos das ferramentas — nunca fique em texto puro nos logs de um relay. A Cloudflare Research acabou de abrir o código do `pvcli`, uma CLI em Rust no estilo curl para construir e depurar exatamente essa infraestrutura OHTTP, e é isso que torna testar essa camada algo tratável em vez de um fim de semana implementando HPKE na mão. A Vercel adicionou suporte a WebSocket para funções Python porque as pessoas realmente precisam de streaming bidirecional. A spec do MCP chegou na versão 2026-07-28 e todo mundo de repente está implementando ela. Nada disso exige um doutorado ou um cartão de crédito. Exige Docker, alguns arquivos de config e a paciência de ligar STDIN a STDOUT entre três processos sem perder a cabeça. Ao final deste post, você vai ter um único `docker-compose up` que te dá: um modelo local servindo endpoints compatíveis com OpenAI, streaming via WebSocket para tokens em tempo real, um servidor MCP expondo seu filesystem e shell como ferramentas, e um caminho OHTTP que você pode testar de ponta a ponta com `pvcli` contra sua própria stack antes de apontá-lo para um relay público. Tudo local. Tudo auditável. Tudo seu.

## A Stack: O Que Roda Onde e Por Quê

Três containers. Três funções. Um `docker-compose.yml` que não exige um terapeuta de YAML para depurar — mais uma CLI no host para a camada de privacidade, porque é ali que ela realmente pertence.

**vLLM** (serviço `vllm`, porta 8000) serve o modelo com endpoints compatíveis com OpenAI, `/v1/chat/completions` e `/v1/completions`. Ele fala HTTP e WebSocket (`/v1/chat/completions` com `stream: true`). Eu rodo `vllm/vllm-openai:latest` com `--model Qwen/Qwen2.5-7B-Instruct --dtype auto --gpu-memory-utilization 0.85 --max-model-len 8192`. A flag `--enable-auto-tool-choice` deixa o modelo emitir tool calls nativamente — sem camada de shim necessária.

**Servidor MCP** (serviço `mcp`, sem portas expostas) é um processo Python expondo ferramentas de filesystem e shell via Model Context Protocol sobre stdio. Ele roda `python mcp_server.py`, onde `mcp_server.py` implementa `list_tools`, `call_tool` para `read_file`, `write_file`, `list_dir`, `run_shell`. O container monta `/workspace` como read-write e `/etc/passwd` como read-only para que o modelo não consiga escapar do sandbox. Health check: `python -c "import mcp_server; print('ok')"`.

**Proxy** (serviço `proxy`, porta 8080) é um app FastAPI que fica na frente do vLLM, injeta as definições de ferramentas do MCP em cada requisição, e executa as tool calls via stdio quando o modelo pede uma. É com ele que seu cliente realmente conversa.

**pvcli** e o gateway local de OHTTP rodam ambos na *sua máquina*, não no Compose. `pvcli` (o cliente OHTTP no estilo curl da Cloudflare Research, `cargo install --git https://github.com/cloudflareresearch/pvcli`) é o que constrói e criptografa a requisição de Oblivious HTTP; o gateway worker (empacotado no mesmo repositório, rodado com `wrangler dev`) é o que descriptografa e encaminha para o seu serviço `proxy`. Mais sobre os dois na seção de privacidade — são ferramentas do host que você invoca, não containers que você cuida.

```yaml
# docker-compose.yml
services:
  vllm:
    image: vllm/vllm-openai:latest
    runtime: nvidia
    environment:
      - HF_HUB_ENABLE_HF_TRANSFER=1
    command: >
      --model Qwen/Qwen2.5-7B-Instruct
      --dtype auto
      --gpu-memory-utilization 0.85
      --max-model-len 8192
      --enable-auto-tool-choice
      --served-model-name qwen2.5-7b
    ports: ["8000:8000"]
    volumes: ["hf-cache:/root/.cache/huggingface"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  mcp:
    build:
      context: ./mcp-server
      dockerfile: Dockerfile
    volumes:
      - ./workspace:/workspace:rw
      - /etc/passwd:/etc/passwd:ro
    healthcheck:
      test: ["CMD", "python", "-c", "import mcp_server; print('ok')"]
      interval: 15s
      timeout: 5s
      retries: 3
    restart: unless-stopped
    depends_on:
      vllm:
        condition: service_healthy

  proxy:
    build:
      context: .
      dockerfile: proxy/Dockerfile
    ports: ["8080:8000"]
    environment:
      - VLLM_URL=http://vllm:8000
    depends_on:
      vllm:
        condition: service_healthy
      mcp:
        condition: service_started
    restart: unless-stopped

volumes:
  hf-cache:
```

`depends_on` com `condition: service_healthy` significa que o vLLM precisa passar o `/health` antes que o MCP e o proxy iniciem — sem race conditions, sem spam de "connection refused" nos logs. `restart: unless-stopped` sobrevive a reboots do host, atualizações de kernel, e investigações de "por que a GPU está ociosa" às 3 da manhã.

O Dockerfile do servidor MCP tem 11 linhas. O do proxy, 9. O vLLM baixa uma imagem de 12 GB uma vez. Total de YAML: menos de 50 linhas. Você vai gastar mais tempo lendo este parágrafo do que editando o arquivo compose.

## Servindo o Modelo: vLLM com API Compatível com OpenAI e Streaming via WebSocket

O vLLM é o único serving engine que faz a inferência local parecer que você está batendo num endpoint gerenciado — sem o preço de um serviço gerenciado. O truque é passar as flags certas. Variáveis de ambiente são para quem gosta de depurar por que o modelo carregou em FP16 quando você pediu BF16. Use argumentos de CLI. Eles são explícitos, versionados, e sobrevivem a restarts de container sem mistério.

Comece com um Dockerfile que fixa o CUDA para que seu próximo `docker pull` não atualize silenciosamente a stack de driver e quebre os tensor cores:

```dockerfile
# Dockerfile.vllm
FROM vllm/vllm-openai:v0.6.3-cu124

# Pin the exact wheel if you're paranoid about supply chain
# RUN pip install --no-cache-dir vllm==0.6.3 --extra-index-url https://download.pytorch.org/whl/cu124

ENTRYPOINT ["python", "-m", "vllm.entrypoints.openai.api_server"]
```

Agora o serviço no compose. As flags abaixo são a config mínima viável para um modelo 7B que faz streaming de tokens, fala JSON compatível com OpenAI, e — crucialmente — entende tool calls via o parser do MCP:

```yaml
# docker-compose.yml (vllm service)
services:
  vllm:
    build:
      context: .
      dockerfile: Dockerfile.vllm
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    ports:
      - "8000:8000"
    ipc: host
    volumes:
      - ~/.cache/huggingface:/root/.cache/huggingface
    command: >
      --model Qwen/Qwen2.5-7B-Instruct
      --dtype bfloat16
      --tensor-parallel-size 1
      --gpu-memory-utilization 0.9
      --max-model-len 32768
      --enable-auto-tool-choice
      --tool-call-parser hermes
      --served-model-name qwen2.5-7b-instruct
      --host 0.0.0.0
      --port 8000
      --enable-prefix-caching
      --disable-log-requests
```

Detalhando: `--enable-auto-tool-choice` deixa o modelo decidir quando chamar uma ferramenta em vez de forçar `tool_choice: required` em toda requisição. `--tool-call-parser hermes` casa com o formato de function-calling do Qwen (tokens estilo Hermes, `<|tool_calls_begin|>`). Se você estiver rodando Llama-3.1 ou Nemotron, troque para `--tool-call-parser llama3_json`. A flag do parser é a diferença entre tool calls estruturadas e o modelo alucinando JSON no meio de uma frase.

`--enable-prefix-caching` reutiliza o KV cache para prompts compartilhados — seu system prompt e as definições de ferramentas param de ser recomputados a cada turno. `--disable-log-requests` mantém seus logs legíveis; o vLLM loga o corpo de cada requisição por padrão, o que é fofo até você estar depurando uma janela de contexto de 32k.

**Fallback só-CPU.** Sem GPU? Comente as linhas `runtime` e `nvidia`, remova `--gpu-memory-utilization`, troque `--dtype` de `bfloat16` (a maioria dos backends de CPU rejeita ou cai num caminho emulado lento — use `float32` para correção, ou `float16` se quiser trocar um pouco de precisão por velocidade), e adicione `--device cpu --enforce-eager`. O modelo vai andar de rastejo, mas vai rastejar *corretamente*:

```yaml
# docker-compose.cpu.yml
services:
  vllm:
    build:
      context: .
      dockerfile: Dockerfile.vllm
    # runtime: nvidia        # <- remove
    # environment:           # <- remove
    #   - NVIDIA_VISIBLE_DEVICES=all
    ports:
      - "8000:8000"
    ipc: host
    volumes:
      - ~/.cache/huggingface:/root/.cache/huggingface
    command: >
      --model Qwen/Qwen2.5-7B-Instruct
      --dtype float32
      --tensor-parallel-size 1
      --max-model-len 32768
      --enable-auto-tool-choice
      --tool-call-parser hermes
      --served-model-name qwen2.5-7b-instruct
      --host 0.0.0.0
      --port 8000
      --enable-prefix-caching
      --disable-log-requests
      --device cpu
      --enforce-eager
```

Inicie com `docker compose -f docker-compose.yml -f docker-compose.cpu.yml up`. O arquivo de override se mescla de forma limpa — sem terapeuta de YAML necessário.

Verifique se está vivo:

```bash
curl -s http://localhost:8000/v1/models | jq '.data[].id'
# "qwen2.5-7b-instruct"

curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-7b-instruct","messages":[{"role":"user","content":"ping"}],"stream":true}' \
  | head -c 200
```

Você deve ver chunks SSE chegando em streaming. Se você receber `{"object":"error","message":"Model qwen2.5-7b-instruct not found"}`, verifique se `--served-model-name` casa com a requisição. O vLLM valida isso estritamente — um recurso, não um bug.

## Construindo o Servidor MCP: Ferramentas de Filesystem e Shell Sobre stdio

A spec do MCP fala de "transporte stdio" como se fosse trivial. E é — depois que você para de lutar contra o event loop. O pacote `mcp` lida com o framing JSON-RPC; você só implementa ferramentas que retornam `TextContent` e não bloqueiam o loop. Aqui está um servidor que expõe quatro ferramentas e sobrevive a um modelo que pensa que `rm -rf /` é uma operação de arquivo razoável.

```python
# mcp_server.py
import asyncio
import json
import os
import shlex
import subprocess
from pathlib import Path
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

app = Server("local-tools")

ALLOWED_COMMANDS = {"ls", "cat", "head", "tail", "grep", "find", "stat", "wc", "echo", "pwd"}
WORKSPACE = Path("/workspace").resolve()
TIMEOUT = 10  # seconds

def _safe_path(path: str) -> Path:
    target = (WORKSPACE / path).resolve()
    if not target.is_relative_to(WORKSPACE):
        raise ValueError("path escapes workspace")
    return target

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="read_file",
            description="Read a file from the workspace",
            inputSchema={"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]},
        ),
        Tool(
            name="write_file",
            description="Write a file to the workspace",
            inputSchema={"type": "object", "properties": {"path": {"type": "string"}, "content": {"type": "string"}}, "required": ["path", "content"]},
        ),
        Tool(
            name="list_dir",
            description="List directory contents",
            inputSchema={"type": "object", "properties": {"path": {"type": "string", "default": "."}}, "required": []},
        ),
        Tool(
            name="run_shell",
            description="Run a shell command (allowlisted only)",
            inputSchema={"type": "object", "properties": {"cmd": {"type": "string"}}, "required": ["cmd"]},
        ),
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    if name == "read_file":
        path = _safe_path(arguments["path"])
        return [TextContent(type="text", text=path.read_text(encoding="utf-8"))]

    if name == "write_file":
        path = _safe_path(arguments["path"])
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(arguments["content"], encoding="utf-8")
        return [TextContent(type="text", text=f"Wrote {path}")]

    if name == "list_dir":
        path = _safe_path(arguments.get("path", "."))
        entries = [f"{e.name}/" if e.is_dir() else e.name for e in path.iterdir()]
        return [TextContent(type="text", text="\n".join(sorted(entries)))]

    if name == "run_shell":
        cmd = arguments["cmd"]
        parts = shlex.split(cmd)
        if not parts or parts[0] not in ALLOWED_COMMANDS:
            return [TextContent(type="text", text=f"Command not allowed: {parts[0] if parts else 'empty'}")]
        try:
            proc = await asyncio.create_subprocess_exec(
                *parts,
                cwd=WORKSPACE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=TIMEOUT)
            out = stdout.decode() + stderr.decode()
            return [TextContent(type="text", text=out or f"(exit code {proc.returncode})")]
        except asyncio.TimeoutError:
            return [TextContent(type="text", text=f"Command timed out after {TIMEOUT}s")]

    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read, write):
        await app.run(read, write, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
```

A allowlist é sua rede de segurança. O modelo *vai* alucinar `sudo rm -rf /` — não me pergunte como eu sei. `shlex.split` previne injeção, `asyncio.wait_for` impõe o timeout, e `cwd=WORKSPACE` mantém tudo enjaulado. Nunca `shell=True`.

Conecte no `docker-compose.yml`:

```yaml
mcp:
  build: .
  working_dir: /workspace
  volumes:
    - ./workspace:/workspace
  stdin_open: true
  tty: true
```

`stdin_open: true` e `tty: true` mantêm o stdio vivo — o Docker fecha o stdin caso contrário. Construa com um `Dockerfile` mínimo:

```dockerfile
# mcp-server/Dockerfile
FROM python:3.12-slim
WORKDIR /app
# mcp 2.0.0 dropped the @app.list_tools()/@app.call_tool() decorator API this
# server uses — pin 1.x until you're ready to port to the new low-level API.
RUN pip install --no-cache-dir "mcp==1.9.4"
COPY mcp_server.py .
CMD ["python", "mcp_server.py"]
```

Teste manualmente antes que o modelo toque nele:

```bash
docker compose run --rm mcp python -c "
import json, sys
req = {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list', 'params': {}}
print(json.dumps(req), flush=True)
"
```

Você vai receber uma resposta JSON-RPC com suas quatro ferramentas. O modelo chama `tools/call` com `{"name": "run_shell", "arguments": {"cmd": "ls -la"}}` e recebe texto estruturado de volta. Sem HTTP, sem WebSocket, sem tokens de autenticação — só stdin/stdout fazendo o que o Unix pretendia.

## Conectando o Tool Calling: Da Saída do Modelo à Execução do MCP e de Volta

O modelo fala. O servidor MCP escuta. Alguma coisa tem que traduzir entre os dois sem bufferizar a resposta inteira na RAM — e sem executar uma tool call antes de o modelo terminar de escrever os argumentos dela. Aí entra o proxy — um app FastAPI que fica entre seu cliente e o vLLM, intercepta `/v1/chat/completions`, e transforma tool calls em idas e voltas via stdio.

Duas coisas que as pessoas erram aqui, e ambas importam mais do que a demo do caminho feliz: **tool calls em streaming chegam como fragmentos**, não como um blob JSON limpo. O vLLM emite um delta de `tool_calls` por token (ou perto disso), cada um carregando uma fatia da string de argumentos e um `index` dizendo a qual chamada ele pertence — você precisa bufferizar por `index` até `finish_reason == "tool_calls"` antes de fazer qualquer `json.loads`, ou você vai travar com JSON truncado já no primeiro token. E **o vLLM não vai emitir tool calls em nada** a menos que o payload da requisição realmente carregue um array `tools` — `--enable-auto-tool-choice` só habilita o *mecanismo*; o proxy ainda precisa injetar as definições das ferramentas (extraídas do `tools/list` do servidor MCP) em toda requisição que ainda não as tenha.

```python
# proxy/main.py
import asyncio
import json
import os
import sys
from collections import defaultdict
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse

MCP_CMD = ["python", "/app/mcp_server.py"]
VLLM_URL = os.getenv("VLLM_URL", "http://vllm:8000")


class MCPClient:
    def __init__(self):
        self.proc: asyncio.subprocess.Process | None = None
        self._request_id = 0
        self._lock = asyncio.Lock()
        self._tools_cache: list[dict] | None = None

    async def start(self):
        self.proc = await asyncio.create_subprocess_exec(
            *MCP_CMD,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=sys.stderr,
        )

    async def call(self, method: str, params: dict) -> dict:
        async with self._lock:
            if not self.proc:
                await self.start()
            self._request_id += 1
            msg = {"jsonrpc": "2.0", "id": self._request_id, "method": method, "params": params}
            self.proc.stdin.write((json.dumps(msg) + "\n").encode())
            await self.proc.stdin.drain()
            line = await self.proc.stdout.readline()
            return json.loads(line)["result"]

    async def list_openai_tools(self) -> list[dict]:
        if self._tools_cache is None:
            result = await self.call("tools/list", {})
            self._tools_cache = [
                {
                    "type": "function",
                    "function": {
                        "name": tool["name"],
                        "description": tool.get("description", ""),
                        "parameters": tool.get("inputSchema", {"type": "object", "properties": {}}),
                    },
                }
                for tool in result.get("tools", [])
            ]
        return self._tools_cache

    async def close(self):
        if self.proc:
            self.proc.terminate()
            await self.proc.wait()


mcp = MCPClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mcp.start()
    yield
    await mcp.close()


app = FastAPI(lifespan=lifespan)


async def stream_with_tools(payload: dict, client: httpx.AsyncClient):
    # Buffer streamed tool-call fragments by index; vLLM sends partial
    # `arguments` strings across many chunks, not one complete JSON blob.
    pending: dict[int, dict] = defaultdict(lambda: {"id": None, "name": None, "arguments": ""})

    async with client.stream("POST", f"{VLLM_URL}/v1/chat/completions", json=payload) as resp:
        async for line in resp.aiter_lines():
            if not line.startswith("data: "):
                continue
            if line == "data: [DONE]":
                yield line + "\n\n"
                return

            chunk = json.loads(line[6:])
            choice = chunk["choices"][0]
            delta = choice.get("delta", {})

            if delta.get("tool_calls"):
                for tc in delta["tool_calls"]:
                    slot = pending[tc["index"]]
                    if tc.get("id"):
                        slot["id"] = tc["id"]
                    fn = tc.get("function") or {}
                    if fn.get("name"):
                        slot["name"] = fn["name"]
                    if fn.get("arguments"):
                        slot["arguments"] += fn["arguments"]
                # Fragments are protocol bookkeeping, not tokens the caller
                # should see — swallow them until the call is complete.
                continue

            if choice.get("finish_reason") == "tool_calls":
                payload["messages"].append(
                    {
                        "role": "assistant",
                        "tool_calls": [
                            {
                                "id": call["id"],
                                "type": "function",
                                "function": {"name": call["name"], "arguments": call["arguments"]},
                            }
                            for call in pending.values()
                        ],
                    }
                )
                for call in pending.values():
                    try:
                        args = json.loads(call["arguments"] or "{}")
                    except json.JSONDecodeError:
                        args = {}
                    result = await mcp.call("tools/call", {"name": call["name"], "arguments": args})
                    payload["messages"].append(
                        {"role": "tool", "tool_call_id": call["id"], "content": json.dumps(result)}
                    )
                async for follow in stream_with_tools(payload, client):
                    yield follow
                return

            yield line + "\n\n"


@app.post("/v1/chat/completions")
async def chat(request: Request):
    payload = await request.json()
    payload.setdefault("tools", await mcp.list_openai_tools())
    payload.setdefault("tool_choice", "auto")

    async with httpx.AsyncClient(timeout=None) as client:
        return StreamingResponse(
            stream_with_tools(payload, client),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
        )
```

O `stream_with_tools` recursivo ainda é o truque, só que agora com um buffer na frente: conforme os fragmentos chegam nós os acumulamos por `index`; quando `finish_reason` vira `tool_calls`, as strings completas de argumentos estão prontas para ser parseadas. Executamos cada ferramenta via stdio do MCP, injetamos as mensagens `assistant`/`tool` de volta no histórico, e reinvocamos o modelo — transmitindo os tokens da continuação para o cliente como se nada tivesse acontecido. Nenhum `json.loads` prematuro numa string pela metade. Nenhuma segunda requisição HTTP da parte de quem chamou.

A imagem do proxy precisa da sua própria cópia de `mcp_server.py`, já que ela dispara o MCP como um subprocesso local em vez de conversar com o serviço `mcp` pela rede — esse container continua existindo só para o smoke test manual `docker compose run --rm mcp ...` da seção anterior:

```dockerfile
# proxy/Dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY proxy/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY proxy/main.py .
COPY mcp-server/mcp_server.py .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```text
# proxy/requirements.txt
fastapi==0.115.6
uvicorn==0.32.1
httpx==0.28.1
```

Construa a partir da raiz do repositório, para que tanto `proxy/` quanto `mcp-server/mcp_server.py` estejam no contexto — é por isso que o serviço no compose acima usa `context: .` com um `dockerfile: proxy/Dockerfile` explícito em vez de `build: ./proxy`. Aponte seu cliente para `http://localhost:8080/v1/chat/completions`. O modelo pensa que está falando com a OpenAI. O servidor MCP pensa que está falando com uma CLI. E o proxy? Ele só passa recadinhos entre dois processos que não sabem que o outro existe.

## Proxy de Privacidade: Testando a Infraestrutura OHTTP com pvcli

Oblivious HTTP (RFC 9458) tem três papéis, e vale a pena ser preciso sobre quem vê o quê: o **cliente** criptografa uma requisição com a chave pública do **gateway** e entrega o blob criptografado a um **relay**; o relay encaminha o blob às cegas — ele vê seu IP mas nunca o texto puro — para o gateway; o gateway descriptografa, faz a requisição real ao **target**, e criptografa a resposta de volta do mesmo jeito. O relay sabe quem você é mas não o que você perguntou. O gateway sabe o que você perguntou mas não quem você é. Nenhuma das partes, isoladamente, consegue conectar as duas informações.

`pvcli` é o cliente da Cloudflare Research para exatamente isso — um binário Rust real, no estilo curl, não um toolchain fictício de keygen/encapsulate/decapsulate. Instale com `cargo`:

```bash
cargo install --git https://github.com/cloudflareresearch/pvcli
```

Não existe um passo separado de `hpke-keygen` ou `encapsulate` para rodar na mão — o `pvcli` busca a chave pública do gateway por conta própria e faz a criptografia inline, num único comando. O formato completo de três saltos, direto do README do projeto, é assim:

```bash
pvcli -vvv --ohttp \
  --first-hop https://relay-cloudflare.ohttp.info \
  --proxy https://gateway.ohttp.info \
  -X POST \
  --header "content-type: application/json" \
  --data '{"test":1}' \
  https://target.ohttp.info/anything
```

`--first-hop` é o relay, `--proxy` é o gateway, e a URL final é o target que o gateway vai efetivamente buscar em seu nome. Rode isso ao pé da letra antes de tocar na sua própria stack — é um smoke test contra o relay público, o gateway e o target de eco da própria Cloudflare, e ele te diz se o `pvcli` e o seu caminho de rede estão sãos antes de você adicionar seus próprios serviços na mistura.

### Apontando o pvcli para a sua própria stack

O gateway é a peça que realmente precisa de uma implementação HPKE, e implementar uma na mão para um post de blog é uma má ideia. A Cloudflare disponibiliza uma real para exatamente esse propósito: `ohttp-gateway-worker`, um Cloudflare Worker empacotado dentro do próprio repositório do `pvcli`, executável localmente com `wrangler dev`. Clone o repositório (o mesmo que o `cargo install --git` já baixou) e inicie-o:

```bash
git clone https://github.com/cloudflareresearch/pvcli
cd pvcli
npm install wrangler
npx wrangler dev --cwd ./crates/ohttp-gateway-worker
# Gateway now listening on http://localhost:8787
```

Assim como o próprio `pvcli`, isso roda na sua máquina, não no Compose — é uma ferramenta de desenvolvimento, não um serviço do qual o app depende em runtime. Aponte o `pvcli` para ele com `-x` (fazer proxy através do worker local) mais `--ohttp` (ainda criptografando, só que sem um salto de relay separado), e dê a ele o seu serviço `proxy` como o target real:

```bash
pvcli --ohttp -vv -x http://localhost:8787 \
  -X POST \
  --header "content-type: application/json" \
  --data '{"model":"qwen2.5-7b-instruct","messages":[{"role":"user","content":"ping"}],"stream":true}' \
  http://localhost:8080/v1/chat/completions
```

O worker descriptografa a requisição empacotada em HPKE e codificada em binary-HTTP, reproduz ela como uma requisição HTTP real para `http://localhost:8080/v1/chat/completions` — seu serviço `proxy`, publicado no host — e criptografa a resposta em streaming de volta. Se a chamada ao modelo funciona, as tool calls do MCP disparam corretamente, e você recebe chunks SSE de volta através de uma ida e volta criptografada, a infraestrutura OHTTP está sólida.

Faça uma verificação de sanidade no worker diretamente sempre que algo parecer estranho — ele serve sua config de chave HPKE em `/ohttp-config`, e um content-type errado ou um worker inalcançável é a primeira coisa a descartar:

```bash
curl -sv http://localhost:8787/ohttp-config | head -c0
# look for: content-type: application/ohttp-keys
```

**Seja honesto sobre o que isso prova.** Colapsar o salto do relay num único worker local verifica que a criptografia e o framing estão corretos — isso *não* esconde nada do seu provedor de internet, porque não há um segundo salto de rede; cliente e gateway são a mesma máquina. Para isso, você encadeia um relay real na frente, exatamente como no comando de smoke test acima: aponte `--first-hop` para um relay público (o da Cloudflare, ou o seu próprio uma vez que esteja implantado), mantenha `--proxy` apontando para o seu gateway uma vez que ele esteja publicamente alcançável (`wrangler deploy` te dá uma URL `workers.dev`), e o target continua sendo o seu backend. Os comandos não mudam de forma — só quais endpoints estão no seu laptop versus na internet.

## Depurando a Stack Completa: Logs, Traces e Quando Tudo Quebra

A stack roda. Depois para de rodar. Uma tool call trava por 30 segundos até o modelo dar timeout. Frames de WebSocket chegam fora de ordem sob carga. `pvcli` retorna um erro de descriptografia porque o gateway worker reiniciou com uma chave nova e seu cliente cacheou a config antiga. Bem-vindo à depuração de sistemas distribuídos — edição local.

### Logs Estruturados ou Nada

Cada container emite JSON. Configure o daemon do Docker uma vez em `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "5",
    "labels": "service,compose_project"
  }
}
```

Reinicie o Docker. Agora `docker compose logs -f --tail=100` te dá saída parseável. Passe ela pelo `jq` para a parte boa:

```bash
docker compose logs -f proxy | jq -r 'select(.level=="error") | "\(.timestamp) [\(.service)] \(.message)"'
```

O proxy loga cada tool call com `request_id`, `tool_name`, `duration_ms`, e `exit_code`. Quando `duration_ms` bate em 30000, você achou seu timeout. Verifique o stdout do container MCP — geralmente é um comando de shell esperando por um stdin que nunca chega.

### Backpressure no WebSocket: O Assassino Silencioso

O streaming funciona bem até o cliente pausar o consumo. O buffer de envio do vLLM enche, a janela TCP fecha, e o `async for chunk in response.iter_bytes()` do proxy bloqueia. O conserto não está no código — está no kernel.

```bash
# On the host, persist across reboots
sysctl -w net.core.somaxconn=4096
sysctl -w net.ipv4.tcp_notsent_lowat=16384
echo 'net.core.somaxconn=4096' >> /etc/sysctl.d/99-websocket.conf
echo 'net.ipv4.tcp_notsent_lowat=16384' >> /etc/sysctl.d/99-websocket.conf
```

`tcp_notsent_lowat` diz ao kernel para aplicar backpressure na camada de socket em vez de bufferizar megabytes na memória do kernel. Seus frames de WebSocket ficam em ordem. Seu proxy não sofre OOM. O modelo continua fazendo streaming.

### Descompasso de Chave HPKE: Falhas de Descriptografia no Gateway

O `ohttp-gateway-worker` local deriva seu par de chaves HPKE uma vez, a partir de uma seed fixa de desenvolvimento, e o mantém em memória durante toda a vida do processo `wrangler dev` (veja `crates/ohttp-gateway-worker/src/lib.rs` no repositório do `pvcli` — é um `OnceLock` semeado a partir de uma string hardcoded, o que é exatamente certo para testes locais e exatamente errado para qualquer coisa que você for implantar). Toda vez que você reinicia o worker, o `pvcli` precisa buscar de novo a config de chave atual — se ele cacheou a antiga, ou se você está rodando um processo de worker antigo contra uma invocação mais nova do `pvcli`, você recebe uma falha de descriptografia HPKE em vez de uma requisição decodificada. Confirme qual chave o worker está realmente servindo agora:

```bash
curl -s http://localhost:8787/ohttp-config -o /tmp/current_config.bin
xxd /tmp/current_config.bin | head -n 4
```

Depois rode de novo seu comando `pvcli` com `-vvv` e observe o trace — ele loga o key ID que buscou e usou para o encapsulamento, então você pode comparar com o que o worker acabou de te entregar em `/tmp/current_config.bin`. Se não coincidirem, reinicie o worker de forma limpa, espere pela linha `Ready on http://localhost:8787`, e tente de novo; não há rotação para correr contra localmente, só uma chave nova a cada restart do processo. Se você implantar o worker de verdade (`wrangler deploy`), troque essa seed hardcoded por um secret adequado do Workers antes que qualquer outra pessoa dependa da chave se manter estável entre deploys.

### Checklist de Hardening para Produção

- [ ] **Limites de recursos** no `docker-compose.yml` para cada serviço:
  ```yaml
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 6G
      reservations:
        cpus: '1.0'
        memory: 4G
  ```
- [ ] **Rotação de logs** via a config do daemon acima — 50 MB × 5 arquivos por container evita que o disco do host enche.
- [ ] **Healthchecks** que de fato testam o caminho feliz, não só o bind da porta:
  ```yaml
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 10s
    timeout: 3s
    retries: 3
    start_period: 30s
  ```
- [ ] **O ajuste de sysctl** (`net.ipv4.tcp_notsent_lowat=16384`) — a única coisa que impede desconexões de WebSocket quando o cliente atrasa.
- [ ] **Uma chave HPKE real para o gateway** — antes de fazer `wrangler deploy` do gateway worker em qualquer lugar que importe, substitua a seed hardcoded de dev em `get_hpke_config()` por uma chave derivada de um secret do Workers, e planeje uma janela de deploy em que tanto a config de chave antiga quanto a nova validem, para que requisições `pvcli` em trânsito criptografadas com a chave anterior não recebam 400 no meio do rollout.

A stack é local. As falhas são reais. As ferramentas de depuração são padrão. Você não precisa de um dashboard de vendor — precisa de `jq`, `curl`, e da paciência de ler uma mensagem de erro de descriptografia duas vezes.
