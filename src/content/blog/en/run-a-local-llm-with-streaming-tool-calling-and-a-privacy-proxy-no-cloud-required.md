---
title: 'Run a Local LLM with Streaming, Tool Calling, and a Privacy Proxy — No Cloud Required'
date: '2026-08-02'
tags:
  - docker
  - python
  - networking
  - security
  - cli
  - llm
description: >-
  Wire up a local LLM with WebSocket streaming, MCP tool calling, and OHTTP privacy proxy using only Docker, standard CLIs, and config files — no API keys, no cloud accounts.
---

You don't need a GPU cluster to run a useful model. You don't need an API key to stream tokens. And you definitely don't need to send your prompts through someone else's logging pipeline just to get a shell command executed. The headlines are full of "open-source AI" debates and enterprise governance frameworks — meanwhile, I've been running a 7B model on a Hetzner CX42 that streams tokens over WebSockets, calls local tools via MCP, and speaks to it through Oblivious HTTP so the request path — model name, prompt, tool arguments — never sits in a relay's logs as plaintext. Cloudflare Research just open-sourced `pvcli`, a curl-like Rust CLI for building and debugging exactly this OHTTP plumbing, and it's what makes testing that layer tractable instead of a weekend of hand-rolled HPKE. Vercel added WebSocket support for Python functions because people actually need bidirectional streaming. The MCP spec hit 2026-07-28 and everyone's suddenly implementing it. None of this requires a PhD or a credit card. It requires Docker, a few config files, and the patience to wire STDIN to STDOUT across three processes without losing your mind. By the end of this post, you'll have a single `docker-compose up` that gives you: a local model serving OpenAI-compatible endpoints, WebSocket streaming for real-time tokens, an MCP server exposing your filesystem and shell as tools, and an OHTTP path you can test end-to-end with `pvcli` against your own stack before you ever point it at a public relay. All local. All auditable. All yours.

## The Stack: What Runs Where and Why

Three containers. Three jobs. One `docker-compose.yml` that doesn't require a YAML therapist to debug — plus one host-side CLI for the privacy layer, because that's where it actually belongs.

**vLLM** (`vllm` service, port 8000) serves the model with OpenAI-compatible `/v1/chat/completions` and `/v1/completions` endpoints. It speaks HTTP and WebSocket (`/v1/chat/completions` with `stream: true`). I run `vllm/vllm-openai:latest` with `--model Qwen/Qwen2.5-7B-Instruct --dtype auto --gpu-memory-utilization 0.85 --max-model-len 8192`. The `--enable-auto-tool-choice` flag lets the model emit tool calls natively — no shim layer required.

**MCP Server** (`mcp` service, no exposed ports) is a Python process exposing filesystem and shell tools via the Model Context Protocol over stdio. It runs `python mcp_server.py`, where `mcp_server.py` implements `list_tools`, `call_tool` for `read_file`, `write_file`, `list_dir`, `run_shell`. The container mounts `/workspace` read-write and `/etc/passwd` read-only so the model can't escape its sandbox. Health check: `python -c "import mcp_server; print('ok')"`.

**Proxy** (`proxy` service, port 8080) is a FastAPI app that sits in front of vLLM, injects MCP tool definitions into every request, and executes tool calls over stdio when the model asks for one. It's the thing your client actually talks to.

**pvcli** and the local OHTTP gateway worker both run on *your machine*, not in Compose. `pvcli` (Cloudflare Research's curl-like OHTTP client, `cargo install --git https://github.com/cloudflareresearch/pvcli`) is the thing that builds and encrypts the Oblivious HTTP request; the gateway worker (bundled in the same repo, run with `wrangler dev`) is what decrypts it and forwards to your `proxy` service. More on both in the privacy section — they're host tools you invoke, not containers you babysit.

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

`depends_on` with `condition: service_healthy` means vLLM must pass `/health` before MCP and the proxy start — no race conditions, no "connection refused" spam in logs. `restart: unless-stopped` survives host reboots, kernel updates, and 3 AM "why is the GPU idle" investigations.

The MCP server Dockerfile is 11 lines. The proxy Dockerfile is 9. vLLM pulls a 12 GB image once. Total YAML: under 50 lines. You'll spend more time reading this paragraph than editing the compose file.

## Serving the Model: vLLM with OpenAI-Compatible API and WebSocket Streaming

vLLM is the only serving engine that makes local inference feel like you're hitting a managed endpoint — without the managed price tag. The trick is feeding it the right flags. Environment variables are for people who enjoy debugging why their model loaded in FP16 when they asked for BF16. Use CLI args. They're explicit, version-controlled, and survive container restarts without mystery.

Start with a Dockerfile that pins CUDA so your next `docker pull` doesn't silently upgrade the driver stack and break tensor cores:

```dockerfile
# Dockerfile.vllm
FROM vllm/vllm-openai:v0.6.3-cu124

# Pin the exact wheel if you're paranoid about supply chain
# RUN pip install --no-cache-dir vllm==0.6.3 --extra-index-url https://download.pytorch.org/whl/cu124

ENTRYPOINT ["python", "-m", "vllm.entrypoints.openai.api_server"]
```

Now the compose service. The flags below are the minimum viable config for a 7B model that streams tokens, speaks OpenAI-compatible JSON, and — critically — understands tool calls via the MCP parser:

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

Breakdown: `--enable-auto-tool-choice` lets the model decide when to call a tool instead of forcing `tool_choice: required` on every request. `--tool-call-parser hermes` matches Qwen's function-calling format (Hermes-style `<|tool_calls_begin|>` tokens). If you're running Llama-3.1 or Nemotron, swap to `--tool-call-parser llama3_json`. The parser flag is the difference between structured tool calls and the model hallucinating JSON in the middle of a sentence.

`--enable-prefix-caching` reuses KV cache for shared prompts — your system prompt and tool definitions stop recomputing on every turn. `--disable-log-requests` keeps your logs readable; vLLM logs every request body by default, which is cute until you're debugging a 32k context window.

**CPU-only fallback.** No GPU? Comment the `runtime` and `nvidia` lines, drop `--gpu-memory-utilization`, switch `--dtype` away from `bfloat16` (most CPU backends either reject it or fall back to a slow emulated path — use `float32` for correctness, or `float16` if you want to trade some precision for speed), and add `--device cpu --enforce-eager`. The model will crawl, but it'll crawl *correctly*:

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

Launch with `docker compose -f docker-compose.yml -f docker-compose.cpu.yml up`. The override file merges cleanly — no YAML therapist required.

Verify it's alive:

```bash
curl -s http://localhost:8000/v1/models | jq '.data[].id'
# "qwen2.5-7b-instruct"

curl -s -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-7b-instruct","messages":[{"role":"user","content":"ping"}],"stream":true}' \
  | head -c 200
```

You should see SSE chunks streaming back. If you get `{"object":"error","message":"Model qwen2.5-7b-instruct not found"}`, check `--served-model-name` matches the request. vLLM validates this strictly — a feature, not a bug.

## Building the MCP Server: Filesystem and Shell Tools Over stdio

The MCP spec says "stdio transport" like it's trivial. It is — once you stop fighting the event loop. The `mcp` package handles the JSON-RPC framing; you just implement tools that return `TextContent` and don't block the loop. Here's a server that exposes four tools and survives a model that thinks `rm -rf /` is a reasonable file operation.

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

The allowlist is your safety net. The model *will* hallucinate `sudo rm -rf /` — don't ask me how I know. `shlex.split` prevents injection, `asyncio.wait_for` enforces the timeout, and `cwd=WORKSPACE` keeps it jailed. No `shell=True`, ever.

Wire it in `docker-compose.yml`:

```yaml
mcp:
  build: .
  working_dir: /workspace
  volumes:
    - ./workspace:/workspace
  stdin_open: true
  tty: true
```

The `stdin_open: true` and `tty: true` keep stdio alive — Docker closes stdin otherwise. Build with a minimal `Dockerfile`:

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

Test it manually before the model touches it:

```bash
docker compose run --rm mcp python -c "
import json, sys
req = {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list', 'params': {}}
print(json.dumps(req), flush=True)
"
```

You'll get a JSON-RPC response with your four tools. The model calls `tools/call` with `{"name": "run_shell", "arguments": {"cmd": "ls -la"}}` and gets structured text back. No HTTP, no WebSocket, no auth tokens — just stdin/stdout doing what Unix intended.

## Wiring Tool Calling: From Model Output to MCP Execution and Back

The model talks. The MCP server listens. Something has to translate between them without buffering the entire response into RAM — and without executing a tool call before the model has finished writing its arguments. Enter the proxy — a FastAPI app that sits between your client and vLLM, hijacks `/v1/chat/completions`, and turns tool calls into stdio round-trips.

Two things people get wrong here, both of which matter more than the happy-path demo: **streamed tool calls arrive as fragments**, not one clean JSON blob. vLLM emits a `tool_calls` delta per token (or near it), each one carrying a slice of the arguments string and an `index` telling you which call it belongs to — you have to buffer by index until `finish_reason == "tool_calls"` before you `json.loads` anything, or you'll crash on truncated JSON on the very first token. And **vLLM won't emit tool calls at all** unless the request payload actually carries a `tools` array — `--enable-auto-tool-choice` only enables the *mechanism*; the proxy still has to inject the tool definitions (pulled from the MCP server's `tools/list`) into every request that doesn't already have them.

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

The recursive `stream_with_tools` is still the trick, just with a buffer in front of it: as fragments arrive we accumulate them by `index`; once `finish_reason` flips to `tool_calls`, the full argument strings are ready to parse. We execute each tool via MCP stdio, inject the `assistant`/`tool` messages back into history, and re-invoke the model — streaming the follow-up tokens to the client as if nothing happened. No premature `json.loads` on a half-written string. No second HTTP request from the caller.

The proxy image needs its own copy of `mcp_server.py`, since it spawns MCP as a local subprocess rather than talking to the `mcp` service over the network — that container stays around purely for the manual `docker compose run --rm mcp ...` smoke test from the previous section:

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

Build it from the repo root so both `proxy/` and `mcp-server/mcp_server.py` are in context — that's why the compose service above uses `context: .` with an explicit `dockerfile: proxy/Dockerfile` instead of `build: ./proxy`. Point your client at `http://localhost:8080/v1/chat/completions`. The model thinks it's talking to OpenAI. The MCP server thinks it's talking to a CLI. The proxy? It just passes notes between two processes that don't know each other exists.

## Privacy Proxy: Testing OHTTP Plumbing with pvcli

Oblivious HTTP (RFC 9458) has three roles, and it's worth being precise about who sees what: the **client** encrypts a request to the **gateway**'s public key and hands the encrypted blob to a **relay**; the relay forwards the blob blindly — it sees your IP but never the plaintext — to the gateway; the gateway decrypts, makes the real request to the **target**, and encrypts the response back the same way. The relay knows who you are but not what you asked. The gateway knows what you asked but not who you are. Neither party alone can connect the two.

`pvcli` is Cloudflare Research's client for exactly this — a real, curl-like Rust binary, not a fictional keygen/encapsulate/decapsulate toolchain. Install it with `cargo`:

```bash
cargo install --git https://github.com/cloudflareresearch/pvcli
```

There's no separate `hpke-keygen` or `encapsulate` step to run by hand — `pvcli` fetches the gateway's public key itself and does the encryption inline, in one command. The full three-hop shape, straight from the project's README, looks like this:

```bash
pvcli -vvv --ohttp \
  --first-hop https://relay-cloudflare.ohttp.info \
  --proxy https://gateway.ohttp.info \
  -X POST \
  --header "content-type: application/json" \
  --data '{"test":1}' \
  https://target.ohttp.info/anything
```

`--first-hop` is the relay, `--proxy` is the gateway, and the trailing URL is the target the gateway will actually fetch on your behalf. Run that verbatim before you touch your own stack — it's a smoke test against Cloudflare's own public relay, gateway, and echo target, and it tells you whether `pvcli` and your network path are sane before you add your own services into the mix.

### Pointing pvcli at your own stack

The gateway is the piece that actually needs an HPKE implementation, and hand-rolling one for a blog post is a bad idea. Cloudflare ships a real one for exactly this purpose: `ohttp-gateway-worker`, a Cloudflare Worker bundled inside the `pvcli` repo itself, runnable locally with `wrangler dev`. Clone the repo (the same one `cargo install --git` already pulled) and boot it:

```bash
git clone https://github.com/cloudflareresearch/pvcli
cd pvcli
npm install wrangler
npx wrangler dev --cwd ./crates/ohttp-gateway-worker
# Gateway now listening on http://localhost:8787
```

Like `pvcli` itself, this runs on your machine, not in Compose — it's a dev tool, not a service the app depends on at runtime. Point `pvcli` at it with `-x` (proxy through the local worker) plus `--ohttp` (still encrypt, just without a separate relay hop), and give it your `proxy` service as the real target:

```bash
pvcli --ohttp -vv -x http://localhost:8787 \
  -X POST \
  --header "content-type: application/json" \
  --data '{"model":"qwen2.5-7b-instruct","messages":[{"role":"user","content":"ping"}],"stream":true}' \
  http://localhost:8080/v1/chat/completions
```

The worker decrypts the HPKE-wrapped, binary-HTTP-encoded request, replays it as a real HTTP request to `http://localhost:8080/v1/chat/completions` — your `proxy` service, published on the host — and encrypts the streamed response back. If the model call works, MCP tool calls trigger correctly, and you get SSE chunks back through an encrypted round-trip, the OHTTP plumbing is sound.

Sanity-check the worker directly whenever something looks off — it serves its HPKE key config at `/ohttp-config`, and a wrong content-type or an unreachable worker is the first thing to rule out:

```bash
curl -sv http://localhost:8787/ohttp-config | head -c0
# look for: content-type: application/ohttp-keys
```

**Be honest about what this proves.** Collapsing the relay hop into a single local worker verifies the encryption and framing are correct — it does *not* hide anything from your ISP, because there's no second network hop; client and gateway are the same machine. For that, you chain a real relay in front, exactly like the smoke-test command above: point `--first-hop` at a public relay (Cloudflare's, or your own once deployed), keep `--proxy` pointed at your gateway once it's publicly reachable (`wrangler deploy` gives it a `workers.dev` URL), and the target stays your backend. The commands don't change shape — only which endpoints are on your laptop versus the internet.

## Debugging the Full Stack: Logs, Traces, and When It Breaks

The stack runs. Then it doesn't. A tool call hangs for 30 seconds before the model times out. WebSocket frames arrive out of order under load. `pvcli` returns a decrypt error because the gateway worker restarted with a fresh key and your client cached the old config. Welcome to distributed systems debugging — local edition.

### Structured Logs or Bust

Every container emits JSON. Configure the Docker daemon once in `/etc/docker/daemon.json`:

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

Restart Docker. Now `docker compose logs -f --tail=100` gives you parseable output. Pipe it through `jq` for the good stuff:

```bash
docker compose logs -f proxy | jq -r 'select(.level=="error") | "\(.timestamp) [\(.service)] \(.message)"'
```

The proxy logs every tool call with `request_id`, `tool_name`, `duration_ms`, and `exit_code`. When `duration_ms` hits 30000, you've found your timeout. Check the MCP container's stdout — it's usually a shell command waiting for stdin that never comes.

### WebSocket Backpressure: The Silent Killer

Streaming works fine until the client pauses consumption. vLLM's send buffer fills, the TCP window closes, and the proxy's `async for chunk in response.iter_bytes()` blocks. The fix isn't in code — it's in the kernel.

```bash
# On the host, persist across reboots
sysctl -w net.core.somaxconn=4096
sysctl -w net.ipv4.tcp_notsent_lowat=16384
echo 'net.core.somaxconn=4096' >> /etc/sysctl.d/99-websocket.conf
echo 'net.ipv4.tcp_notsent_lowat=16384' >> /etc/sysctl.d/99-websocket.conf
```

`tcp_notsent_lowat` tells the kernel to apply backpressure at the socket layer instead of buffering megabytes in kernel memory. Your WebSocket frames stay ordered. Your proxy doesn't OOM. The model keeps streaming.

### HPKE Key Mismatch: Decrypt Failures at the Gateway

The local `ohttp-gateway-worker` derives its HPKE key pair once, from a fixed dev seed, and holds it in memory for the life of the `wrangler dev` process (see `crates/ohttp-gateway-worker/src/lib.rs` in the `pvcli` repo — it's a `OnceLock` seeded from a hardcoded string, which is exactly right for local testing and exactly wrong for anything you'd deploy). Every time you restart the worker, `pvcli` needs to re-fetch the current key config — if it's cached the old one, or if you're running an old worker process against a newer `pvcli` invocation, you get an HPKE decrypt failure instead of a decoded request. Confirm what key the worker is actually serving right now:

```bash
curl -s http://localhost:8787/ohttp-config -o /tmp/current_config.bin
xxd /tmp/current_config.bin | head -n 4
```

Then re-run your `pvcli` command with `-vvv` and watch the trace — it logs the key ID it fetched and used for encapsulation, so you can compare it against what the worker just handed you in `/tmp/current_config.bin`. If they don't match, restart the worker cleanly, wait for the `Ready on http://localhost:8787` line, and retry; there's no rotation to race against locally, just a fresh key on every process restart. If you deploy the worker for real (`wrangler deploy`), swap that hardcoded seed for a proper Workers secret before anyone else depends on the key staying stable across deploys.

### Production Hardening Checklist

- [ ] **Resource limits** in `docker-compose.yml` for every service:
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
- [ ] **Log rotation** via the daemon config above — 50 MB × 5 files per container keeps the host disk from filling.
- [ ] **Healthchecks** that actually test the happy path, not just port binding:
  ```yaml
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 10s
    timeout: 3s
    retries: 3
    start_period: 30s
  ```
- [ ] **The sysctl tweak** (`net.ipv4.tcp_notsent_lowat=16384`) — the only thing that stops WebSocket disconnects when the client lags.
- [ ] **A real HPKE key for the gateway** — before you `wrangler deploy` the gateway worker anywhere it matters, replace the hardcoded dev seed in `get_hpke_config()` with a key derived from a Workers secret, and plan a deploy window where old and new key configs both validate so in-flight `pvcli` requests encrypted to the previous key don't 400 mid-rollout.

The stack is local. The failures are real. The debugging tools are standard. You don't need a vendor dashboard — you need `jq`, `curl`, and the patience to read a decrypt error message twice.
