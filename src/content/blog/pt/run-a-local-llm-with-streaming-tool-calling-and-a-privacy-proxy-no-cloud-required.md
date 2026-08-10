---
title: 'Rode um LLM local com streaming, tool calling e um proxy de privacidade — sem nuvem'
date: '2026-08-02'
tags:
  - docker
  - python
  - redes
  - segurança
  - cli
  - llm
description: >-
  Monte um LLM local com streaming via WebSocket, tool calling via MCP e um proxy
  de privacidade OHTTP — só Docker, CLIs de sempre e arquivos de config. Sem API
  key, sem conta na nuvem.
---

Você não precisa de um cluster de GPUs pra rodar um modelo útil. Não precisa de API key pra fazer streaming de tokens. E definitivamente não precisa mandar seus prompts pelo pipeline de log de outra pessoa só pra executar um comando no shell. As manchetes vivem de debate sobre "IA open-source" e framework corporativo de governança — enquanto isso, eu rodo um 7B num Hetzner CX42 que faz streaming via WebSocket, chama ferramenta local via MCP, e fala comigo por Oblivious HTTP pra que o caminho da request — nome do modelo, prompt, argumentos das tools — nunca apareça em texto puro no log de um relay. A Cloudflare Research acabou de abrir o código do `pvcli`, uma CLI em Rust no estilo curl pra montar e depurar exatamente essa infra OHTTP, e é isso que torna testar essa camada tratável em vez de um fim de semana implementando HPKE na mão. A Vercel adicionou WebSocket em funções Python porque o pessoal de fato precisa de streaming bidirecional. A spec do MCP bateu em 2026-07-28 e de repente todo mundo está implementando. Nada disso pede doutorado nem cartão de crédito. Pede Docker, uns arquivos de config e paciência pra ligar STDIN a STDOUT entre três processos sem perder a cabeça. No fim deste post você tem um único `docker-compose up` que entrega: modelo local com endpoints compatíveis com OpenAI, streaming via WebSocket pra tokens em tempo real, um servidor MCP expondo filesystem e shell como tools, e um caminho OHTTP que você testa de ponta a ponta com `pvcli` na sua própria stack antes de apontar pra um relay público. Tudo local. Tudo auditável. Tudo seu.

## A stack: o que roda onde e por quê

Três containers. Três funções. Um `docker-compose.yml` que não exige terapia de YAML pra depurar — mais uma CLI no host pra camada de privacidade, porque é ali que ela faz sentido.

**vLLM** (serviço `vllm`, porta 8000) serve o modelo com endpoints compatíveis com OpenAI, `/v1/chat/completions` e `/v1/completions`. Fala HTTP e WebSocket (`/v1/chat/completions` com `stream: true`). Eu rodo `vllm/vllm-openai:latest` com `--model Qwen/Qwen2.5-7B-Instruct --dtype auto --gpu-memory-utilization 0.85 --max-model-len 8192`. A flag `--enable-auto-tool-choice` deixa o modelo emitir tool calls nativamente — sem shim no meio.

**Servidor MCP** (serviço `mcp`, sem portas expostas) é um processo Python expondo tools de filesystem e shell via Model Context Protocol em stdio. Roda `python mcp_server.py`, onde `mcp_server.py` implementa `list_tools` e `call_tool` pra `read_file`, `write_file`, `list_dir`, `run_shell`. O container monta `/workspace` como read-write e `/etc/passwd` como read-only pra o modelo não escapar do sandbox. Health check: `python -c "import mcp_server; print('ok')"`.

**Proxy** (serviço `proxy`, porta 8080) é um app FastAPI na frente do vLLM: injeta as definições de tools do MCP em cada request e executa as tool calls via stdio quando o modelo pede. É com ele que o cliente de fato conversa.

**pvcli** e o gateway local de OHTTP rodam *na sua máquina*, não no Compose. `pvcli` (o cliente OHTTP no estilo curl da Cloudflare Research, `cargo install --git https://github.com/cloudflareresearch/pvcli`) monta e criptografa a request Oblivious HTTP; o gateway worker (no mesmo repo, com `wrangler dev`) descriptografa e encaminha pro serviço `proxy`. Mais sobre os dois na seção de privacidade — são ferramentas do host que você invoca, não containers pra ficar babysitando.

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

`depends_on` com `condition: service_healthy` significa que o vLLM precisa passar no `/health` antes do MCP e do proxy subirem — sem race condition, sem spam de "connection refused" no log. `restart: unless-stopped` sobrevive a reboot do host, update de kernel e investigação de "por que a GPU está ociosa" às 3 da manhã.

O Dockerfile do servidor MCP tem 11 linhas. O do proxy, 9. O vLLM baixa uma imagem de 12 GB uma vez. YAML total: menos de 50 linhas. Você gasta mais tempo lendo este parágrafo do que editando o compose.

## Servindo o modelo: vLLM com API compatível com OpenAI e streaming via WebSocket

O vLLM é o único serving engine que faz inferência local parecer que você está batendo num endpoint gerenciado — sem o preço de serviço gerenciado. O truque é passar as flags certas. Variável de ambiente é pra quem gosta de depurar por que o modelo carregou em FP16 quando pediu BF16. Use argumentos de CLI. São explícitos, versionados e sobrevivem a restart de container sem mistério.

Comece com um Dockerfile que fixa o CUDA pra o próximo `docker pull` não atualizar a stack de driver em silêncio e quebrar tensor core:

```dockerfile
# Dockerfile.vllm
FROM vllm/vllm-openai:v0.6.3-cu124

# Pin the exact wheel if you're paranoid about supply chain
# RUN pip install --no-cache-dir vllm==0.6.3 --extra-index-url https://download.pytorch.org/whl/cu124

ENTRYPOINT ["python", "-m", "vllm.entrypoints.openai.api_server"]
```

Agora o serviço no compose. As flags abaixo são a config mínima viável pra um 7B que faz streaming de tokens, fala JSON compatível com OpenAI e — o ponto crítico — entende tool calls via o parser do MCP:

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

Resumo: `--enable-auto-tool-choice` deixa o modelo decidir quando chamar uma tool em vez de forçar `tool_choice: required` em toda request. `--tool-call-parser hermes` casa com o formato de function-calling do Qwen (tokens estilo Hermes, `<|tool_calls_begin|>`). Se estiver rodando Llama-3.1 ou Nemotron, troque pra `--tool-call-parser llama3_json`. A flag do parser é a diferença entre tool calls estruturadas e o modelo alucinando JSON no meio da frase.

`--enable-prefix-caching` reaproveita o KV cache pra prompts compartilhados — system prompt e definições de tools param de recomputar a cada turno. `--disable-log-requests` mantém o log legível; o vLLM loga o body de cada request por padrão, o que é fofo até você depurar uma janela de contexto de 32k.

**Fallback só-CPU.** Sem GPU? Comente as linhas `runtime` e `nvidia`, tire `--gpu-memory-utilization`, troque `--dtype` de `bfloat16` (a maioria dos backends de CPU rejeita ou cai num caminho emulado lento — use `float32` pra correção, ou `float16` se quiser trocar um pouco de precisão por velocidade) e adicione `--device cpu --enforce-eager`. O modelo vai rastejar, mas rasteja *certo*:

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

Suba com `docker compose -f docker-compose.yml -f docker-compose.cpu.yml up`. O override mescla limpo — sem terapia de YAML.

Confira se está vivo:

```bash
curl -s http://localhost:8000/v1/models | jq '.data[].id'
# "qwen2.5-7b-instruct"

curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-7b-instruct","messages":[{"role":"user","content":"ping"}],"stream":true}' \
  | head -c 200
```

Você deve ver chunks SSE chegando em streaming. Se vier `{"object":"error","message":"Model qwen2.5-7b-instruct not found"}`, confira se `--served-model-name` casa com a request. O vLLM valida isso no rigor — feature, não bug.

## Montando o servidor MCP: tools de filesystem e shell em stdio

A spec do MCP trata "transporte stdio" como se fosse trivial. E é — depois que você para de brigar com o event loop. O pacote `mcp` cuida do framing JSON-RPC; você só implementa tools que devolvem `TextContent` e não bloqueiam o loop. Aqui vai um servidor com quatro tools que sobrevive a um modelo convencido de que `rm -rf /` é operação de arquivo razoável.

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

A allowlist é a sua rede de segurança. O modelo *vai* alucinar `sudo rm -rf /` — não me pergunte como eu sei. `shlex.split` evita injeção, `asyncio.wait_for` impõe o timeout e `cwd=WORKSPACE` mantém tudo enjaulado. Nunca `shell=True`.

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

`stdin_open: true` e `tty: true` mantêm o stdio vivo — sem isso o Docker fecha o stdin. Build com um `Dockerfile` mínimo:

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

Teste na mão antes do modelo colocar a pata nele:

```bash
docker compose run --rm mcp python -c "
import json, sys
req = {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list', 'params': {}}
print(json.dumps(req), flush=True)
"
```

Você recebe uma resposta JSON-RPC com as quatro tools. O modelo chama `tools/call` com `{"name": "run_shell", "arguments": {"cmd": "ls -la"}}` e volta com texto estruturado. Sem HTTP, sem WebSocket, sem token de auth — só stdin/stdout fazendo o que o Unix sempre fez.

## Ligando o tool calling: da saída do modelo à execução no MCP e de volta

O modelo fala. O servidor MCP escuta. Alguma coisa precisa traduzir entre os dois sem bufferizar a resposta inteira na RAM — e sem executar uma tool call antes do modelo terminar de escrever os argumentos. Entra o proxy: um app FastAPI entre o cliente e o vLLM, que intercepta `/v1/chat/completions` e transforma tool calls em ida e volta via stdio.

Duas pegadinhas que o pessoal erra aqui, e as duas importam mais que a demo do caminho feliz: **tool calls em streaming chegam em pedaços**, não num blob JSON limpo. O vLLM emite um delta de `tool_calls` por token (ou perto disso), cada um com uma fatia da string de argumentos e um `index` dizendo a qual call pertence — você precisa bufferizar por `index` até `finish_reason == "tool_calls"` antes de qualquer `json.loads`, senão trava em JSON truncado já no primeiro token. E **o vLLM não emite tool call nenhuma** a menos que o payload da request realmente traga um array `tools` — `--enable-auto-tool-choice` só liga o *mecanismo*; o proxy ainda precisa injetar as definições (vindas do `tools/list` do MCP) em toda request que ainda não as tenha.

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

O `stream_with_tools` recursivo continua sendo o truque, agora com um buffer na frente: conforme os fragmentos chegam, acumulamos por `index`; quando `finish_reason` vira `tool_calls`, as strings de argumentos estão completas pra parsear. Executamos cada tool via stdio do MCP, injetamos as mensagens `assistant`/`tool` de volta no histórico e reinvocamos o modelo — transmitindo os tokens da continuação pro cliente como se nada tivesse acontecido. Nada de `json.loads` prematuro numa string pela metade. Nada de segunda request HTTP do lado de quem chamou.

A imagem do proxy precisa da própria cópia de `mcp_server.py`, porque ela dispara o MCP como subprocesso local em vez de falar com o serviço `mcp` pela rede — aquele container continua existindo só pro smoke test manual `docker compose run --rm mcp ...` da seção anterior:

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

Faça o build a partir da raiz do repo, pra `proxy/` e `mcp-server/mcp_server.py` entrarem no contexto — por isso o serviço no compose usa `context: .` com `dockerfile: proxy/Dockerfile` explícito em vez de `build: ./proxy`. Aponte o cliente pra `http://localhost:8080/v1/chat/completions`. O modelo acha que está falando com a OpenAI. O servidor MCP acha que está falando com uma CLI. E o proxy? Só passa bilhete entre dois processos que não sabem que o outro existe.

## Proxy de privacidade: testando a infra OHTTP com pvcli

Oblivious HTTP (RFC 9458) tem três papéis, e vale ser preciso sobre quem vê o quê: o **cliente** criptografa uma request com a chave pública do **gateway** e entrega o blob cifrado a um **relay**; o relay encaminha o blob às cegas — vê seu IP, nunca o texto puro — pro gateway; o gateway descriptografa, faz a request de verdade no **target** e criptografa a resposta de volta do mesmo jeito. O relay sabe quem você é, mas não o que perguntou. O gateway sabe o que perguntou, mas não quem você é. Isolados, nenhum dos dois junta as duas pontas.

`pvcli` é o cliente da Cloudflare Research pra exatamente isso — binário Rust de verdade, no estilo curl, não um toolchain fictício de keygen/encapsulate/decapsulate. Instale com `cargo`:

```bash
cargo install --git https://github.com/cloudflareresearch/pvcli
```

Não tem passo separado de `hpke-keygen` ou `encapsulate` pra rodar na mão — o `pvcli` busca a chave pública do gateway sozinho e faz a criptografia inline, num comando só. O formato completo de três saltos, direto do README do projeto, fica assim:

```bash
pvcli -vvv --ohttp \
  --first-hop https://relay-cloudflare.ohttp.info \
  --proxy https://gateway.ohttp.info \
  -X POST \
  --header "content-type: application/json" \
  --data '{"test":1}' \
  https://target.ohttp.info/anything
```

`--first-hop` é o relay, `--proxy` é o gateway, e a URL final é o target que o gateway de fato busca em seu nome. Rode isso ao pé da letra antes de mexer na sua stack — é um smoke test contra o relay público, o gateway e o target de eco da própria Cloudflare, e te diz se o `pvcli` e o caminho de rede estão sãos antes de misturar seus próprios serviços.

### Apontando o pvcli pra sua própria stack

O gateway é a peça que de fato precisa de implementação HPKE, e montar uma na mão pra post de blog é má ideia. A Cloudflare disponibiliza uma de verdade exatamente pra isso: `ohttp-gateway-worker`, um Cloudflare Worker empacotado no próprio repo do `pvcli`, rodável localmente com `wrangler dev`. Clone o repositório (o mesmo que o `cargo install --git` já baixou) e suba:

```bash
git clone https://github.com/cloudflareresearch/pvcli
cd pvcli
npm install wrangler
npx wrangler dev --cwd ./crates/ohttp-gateway-worker
# Gateway now listening on http://localhost:8787
```

Como o próprio `pvcli`, isso roda na sua máquina, não no Compose — ferramenta de dev, não serviço do qual o app depende em runtime. Aponte o `pvcli` pra ele com `-x` (proxy pelo worker local) mais `--ohttp` (ainda criptografando, só que sem salto de relay separado), e passe o serviço `proxy` como target real:

```bash
pvcli --ohttp -vv -x http://localhost:8787 \
  -X POST \
  --header "content-type: application/json" \
  --data '{"model":"qwen2.5-7b-instruct","messages":[{"role":"user","content":"ping"}],"stream":true}' \
  http://localhost:8080/v1/chat/completions
```

O worker descriptografa a request empacotada em HPKE e codificada em binary-HTTP, reproduz como HTTP de verdade em `http://localhost:8080/v1/chat/completions` — seu serviço `proxy`, publicado no host — e criptografa a resposta em streaming de volta. Se a chamada ao modelo funciona, as tool calls do MCP disparam certo e você recebe chunks SSE por uma ida e volta cifrada, a infra OHTTP está sólida.

Faça um sanity check no worker direto sempre que algo parecer estranho — ele serve a config de chave HPKE em `/ohttp-config`, e content-type errado ou worker inalcançável é a primeira coisa a descartar:

```bash
curl -sv http://localhost:8787/ohttp-config | head -c0
# look for: content-type: application/ohttp-keys
```

**Seja honesto sobre o que isso prova.** Colapsar o salto do relay num único worker local verifica que criptografia e framing estão corretos — *não* esconde nada do seu provedor, porque não há segundo salto de rede; cliente e gateway são a mesma máquina. Pra isso, você encadeia um relay de verdade na frente, exatamente como no smoke test acima: aponte `--first-hop` pra um relay público (o da Cloudflare, ou o seu depois de implantado), mantenha `--proxy` no seu gateway quando ele estiver publicamente alcançável (`wrangler deploy` te dá uma URL `workers.dev`), e o target continua sendo o backend. Os comandos ficam iguais — só muda quais endpoints estão no laptop versus na internet.

## Depurando a stack inteira: logs, traces e quando tudo quebra

A stack sobe. Depois para. Uma tool call trava 30 segundos até o modelo dar timeout. Frames de WebSocket chegam fora de ordem sob carga. O `pvcli` devolve erro de descriptografia porque o gateway worker reiniciou com chave nova e o cliente cacheou a config antiga. Bem-vindo à depuração de sistemas distribuídos — edição local.

### Logs estruturados ou nada

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

Reinicie o Docker. Agora `docker compose logs -f --tail=100` te dá saída parseável. Passe pelo `jq` pra parte boa:

```bash
docker compose logs -f proxy | jq -r 'select(.level=="error") | "\(.timestamp) [\(.service)] \(.message)"'
```

O proxy loga cada tool call com `request_id`, `tool_name`, `duration_ms` e `exit_code`. Quando `duration_ms` bate em 30000, achou o timeout. Olhe o stdout do container MCP — em geral é comando de shell esperando um stdin que nunca chega.

### Backpressure no WebSocket: o assassino silencioso

O streaming vai bem até o cliente pausar o consumo. O buffer de envio do vLLM enche, a janela TCP fecha e o `async for chunk in response.iter_bytes()` do proxy bloqueia. O conserto não está no código — está no kernel.

```bash
# On the host, persist across reboots
sysctl -w net.core.somaxconn=4096
sysctl -w net.ipv4.tcp_notsent_lowat=16384
echo 'net.core.somaxconn=4096' >> /etc/sysctl.d/99-websocket.conf
echo 'net.ipv4.tcp_notsent_lowat=16384' >> /etc/sysctl.d/99-websocket.conf
```

`tcp_notsent_lowat` manda o kernel aplicar backpressure na camada de socket em vez de bufferizar megabytes na memória do kernel. Seus frames de WebSocket ficam em ordem. O proxy não toma OOM. O modelo continua no streaming.

### Descompasso de chave HPKE: falhas de descriptografia no gateway

O `ohttp-gateway-worker` local deriva o par de chaves HPKE uma vez, a partir de uma seed fixa de desenvolvimento, e mantém em memória durante a vida do processo `wrangler dev` (veja `crates/ohttp-gateway-worker/src/lib.rs` no repo do `pvcli` — é um `OnceLock` semeado a partir de string hardcoded, exatamente certo pra teste local e exatamente errado pra qualquer coisa que você for implantar). Toda vez que reinicia o worker, o `pvcli` precisa buscar de novo a config de chave atual — se cacheou a antiga, ou se você está com um worker velho contra uma invocação mais nova do `pvcli`, vem falha de descriptografia HPKE em vez de request decodificada. Confirme qual chave o worker está servindo agora:

```bash
curl -s http://localhost:8787/ohttp-config -o /tmp/current_config.bin
xxd /tmp/current_config.bin | head -n 4
```

Depois rode de novo o comando `pvcli` com `-vvv` e acompanhe o trace — ele loga o key ID que buscou e usou no encapsulamento, então você compara com o que o worker acabou de entregar em `/tmp/current_config.bin`. Se não bater, reinicie o worker limpo, espere a linha `Ready on http://localhost:8787` e tente de novo; localmente não há rotação pra correr contra, só chave nova a cada restart do processo. Se implantar o worker de verdade (`wrangler deploy`), troque essa seed hardcoded por um secret decente do Workers antes que alguém dependa da chave ficar estável entre deploys.

### Checklist de hardening pra produção

- [ ] **Limites de recurso** no `docker-compose.yml` pra cada serviço:
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
- [ ] **Rotação de logs** via a config do daemon acima — 50 MB × 5 arquivos por container evita o disco do host encher.
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
- [ ] **Uma chave HPKE de verdade pro gateway** — antes de fazer `wrangler deploy` do gateway worker em qualquer lugar que importe, substitua a seed hardcoded de dev em `get_hpke_config()` por uma chave derivada de um secret do Workers, e planeje uma janela de deploy em que a config de chave antiga e a nova validem, pra requests `pvcli` em trânsito cifradas com a chave anterior não levarem 400 no meio do rollout.

A stack é local. As falhas são reais. As ferramentas de depuração são padrão. Você não precisa de dashboard de vendor — precisa de `jq`, `curl` e paciência pra ler a mensagem de erro de descriptografia duas vezes.
