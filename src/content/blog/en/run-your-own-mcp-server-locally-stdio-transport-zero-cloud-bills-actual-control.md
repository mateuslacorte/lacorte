---
title: 'Run Your Own MCP Server Locally: stdio Transport, Zero Cloud Bills, Actual Control'
date: '2026-08-10'
tags:
  - mcp
  - docker
  - cli
  - local-first
  - llm-tooling
  - stdio
description: >-
  Build a production-grade MCP server that runs locally via stdio transport, expose your existing CLI tools to any LLM client (Claude Desktop, Continue, Cline), and skip the cloud vendor tax entirely.
---

Every platform announcement this month screams "MCP! Agents! Cloud functions!" — Cloudflare Workers, Vercel Sandbox, some new "agentic browser" running in V8 isolates. They all want your credit card and your telemetry. You just want your language model to run `rg` or `jq` or that cursed legacy migration script without copying output back and forth like it's 2010.

Good news: MCP's stdio transport has existed since the spec dropped. It launches your server as a subprocess, pipes JSON-RPC over stdin/stdout, and requires exactly zero network configuration. No ports, no TLS, no `ngrok` tunnels, no API keys. Your editor (or Claude Desktop, or Continue, or Cline) spawns the process, talks to it, and kills it when done. That's it.

This post walks you through building a real MCP server that exposes your actual CLI toolbox — `rg`, `jq`, `sqlite3`, `ffmpeg`, whatever you've got in `/usr/local/bin` — as callable tools. You'll write the server in about 100 lines of Python, package it in a Docker image that starts in milliseconds, wire it into every major client config, and debug the inevitable "why isn't my tool showing up" moments with structured logs you can actually read. No Cloudflare account. No Vercel project. No "agentic" buzzwords. Just a subprocess that does what you tell it.

## Why stdio Transport Is the Only One You Need Locally

MCP defines three transports: stdio, SSE, and streamable HTTP. Two of them are solving problems you don't have.

**SSE** (Server-Sent Events) keeps an HTTP connection open for server-to-client pushes. Fine for a remote server behind a load balancer. Locally? You're running a web server, managing a port, handling CORS, and wondering why your firewall rules eat the connection. **Streamable HTTP** (added in the 2025-03-26 spec) upgrades SSE with bidirectional streaming over a single endpoint. Same overhead, newer buzzwords.

**stdio** launches your server as a child process. JSON-RPC flows over stdin/stdout. The client owns the lifecycle: spawn, talk, kill. No ports. No TLS. No `systemd` unit. No `docker run -p`. It works over SSH because the subprocess runs on the remote box — your local editor just pipes bytes through the existing tunnel. Try that with SSE.

Here's the wire protocol. No SDK required.

```bash
# Terminal 1: pretend to be the client
cat <<'EOF' | socat - EXEC:"python3 -u mcp_server.py"
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
EOF
```

`mcp_server.py` (coming next section) reads line-delimited JSON from stdin, writes responses to stdout. `socat`'s plain `EXEC:` wires the subprocess's stdin/stdout straight into the pipe — no `pty` needed. MCP's newline-delimited JSON doesn't care about TTY semantics, and allocating a pseudo-terminal would actually risk mangling the stream (line-buffering, echo) instead of helping it.

Output you'll see:

```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"local-toolbox","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"rg","description":"ripgrep search","inputSchema":{"type":"object","properties":{"pattern":{"type":"string"},"path":{"type":"string"}},"required":["pattern"]}}]}}
```

No HTTP headers. No chunked encoding. Newline-delimited JSON. That's the entire handshake.

Lifecycle is free: the client sends `SIGTERM` (or closes stdin), the process exits, file descriptors clean up. No orphaned containers. No `docker ps -a` clutter. If your editor crashes, the OS reaps the child. Try getting that guarantee from a cloud function.

Port conflicts? Gone. Run five MCP servers simultaneously — each gets its own stdio pipe. No `address already in use` errors, no `PORT=3001` gymnastics.

The only catch: stdio is local-only by design. That's not a limitation — it's the feature. You want local tools exposed to a local model. The transport should disappear.

## The ~100-Line Server: Tools as Pure Functions

The official `mcp` package gives you a `FastMCP` class that handles the JSON-RPC boilerplate. You decorate functions, it builds the schema, and stdio transport is the default.

One pin matters more than any other line in this post: `mcp==1.29.0`. The `mcp` package hit `2.0.0` and renamed `FastMCP` to `MCPServer`, moving the whole module from `mcp.server.fastmcp` to `mcp.server.mcpserver`. Every snippet below uses the v1 `FastMCP` API, so install with an explicit upper bound:

```bash
pip install 'mcp==1.29.0'
```

`mcp>=1.9,<2` also works if you want the latest 1.x patch instead of an exact pin — either way, keep the `<2` ceiling until you're ready to port to `MCPServer`.

Here's the whole thing — save as `mcp_server.py`:

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

Run it directly to verify: `python3 mcp_server.py` — it sits waiting on stdin. That's the entire server. The `FastMCP` decorator extracts the function signature, builds a JSON Schema from the Pydantic `Field` annotations, and registers the tool. `_run` never raises — a timeout becomes a `RunResult` with `exit_code=124` and whatever partial output the process produced before it died, so the client always gets a machine-parseable object instead of a stack trace crossing the JSON-RPC boundary.

Each tool returns `RunResult`, a typed model the LLM can reason about. No `Any` leaking into the schema. The `_run` helper wraps `subprocess.run` with timeout handling, timing metadata, and an `input_data` parameter so tools like `jq` can pipe stdin through. `rg` uses `--json` output so the model gets parseable matches. `sqlite_query` enforces read-only at the application layer, returning a structured `RunResult` with `exit_code=400` instead of raising when someone tries to sneak in a `DROP TABLE`. `jq` and `ffmpeg_probe` round out the "I need to inspect something right now" toolkit.

Test a tool manually — remember the handshake comes first, same as the socat example:

```bash
cat <<'EOF' | python3 -u mcp_server.py
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"rg","arguments":{"pattern":"TODO","path":"."}}}
EOF
```

You'll get JSON-RPC responses for `initialize` and the `tools/call`, in that order. That's the contract every client speaks — skip the handshake and the server has nothing registered yet to call.

## Dockerfile That Starts in Milliseconds, Not Seconds

Don't let the container image weigh 1.2 GB and take 15 seconds to cold-start because you copied `python:3.12-slim` and ran `pip install` at *runtime*. That's amateur hour. The fix isn't a fancier base image — it's baking dependencies into the image at *build* time so nothing gets fetched over the network when the client spawns your container.

You'd love to reach for `gcr.io/distroless/python3-debian12` here, but distroless ships no shell, no `apt`, and critically, none of the CLI tools this server wraps — no `rg`, no `jq`, no `sqlite3`, no `ffprobe`. You'd need a second image (or a very fiddly multi-stage copy of binaries and their shared libraries) just to get `ripgrep` onto a distroless base, and it stops being "simple and copy-pasteable" the moment you do. `python:3.12-slim-bookworm` plus `apt-get install` gets you all four tools in one straightforward stage, still starts in well under a second, and stays copy-pasteable:

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

A minimal `pyproject.toml` documents the dependency even though the Dockerfile installs it directly with `pip` (no `uv.lock` to keep in sync, no lockfile drift to debug):

```toml
[project]
name = "local-toolbox"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "mcp==1.29.0",
]
```

If you'd rather manage the lockfile with `uv`, run `uv lock` once to generate `uv.lock` from that `pyproject.toml`, then swap the `RUN pip install` line for `RUN pip install uv && uv sync --frozen --no-dev` — either path lands on the same pinned dependency.

`USER nobody` drops root before the entrypoint runs. It's not distroless-grade isolation — you've still got a shell and a package manager sitting in the image — but for a container that only ever talks stdio to a local client, "non-root, dependencies baked in, no runtime network calls" covers the realistic threat model.

`.dockerignore` that actually works:

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

Build it:

```bash
docker build -t local-mcp-server:latest .
```

Run it the way stdio transport demands — interactive, stdin/stdout attached, no TTY allocation:

```bash
docker run --rm -i local-mcp-server:latest
```

The `-i` keeps stdin open. No `-t`. If you add `-t`, the client gets ANSI escape codes in its JSON-RPC stream and you'll spend an hour debugging "parse error" messages that look like valid JSON.

Prove the cold-start claim with `hyperfine`:

```bash
hyperfine --warmup 3 --runs 10 'docker run --rm -i local-mcp-server:latest'
```

Typical output on a 2023 MacBook Pro (Apple Silicon, Docker Desktop):

```
Benchmark 1: docker run --rm -i local-mcp-server:latest
  Time (mean ± σ):     287.6 ms ±  15.9 ms    [User: 58.3 ms, System: 34.1 ms]
  Range (min … max):   261.2 ms … 318.4 ms    10 runs
```

Under 300 ms, almost all of it Docker's container creation overhead rather than anything Python-specific. Compare that to `python:3.12-slim` with `pip install -r requirements.txt` at *runtime* — 12–18 seconds on the same machine, because that version fetches packages from the network on every `docker run` instead of once at build time.

For pure local tooling (`rg`, `jq`, `sqlite3`, `ffmpeg`), you don't need `ca-certificates` beyond what `slim-bookworm` already ships. If you add a tool that calls HTTPS endpoints, the certs are already there — one fewer thing to debug than on distroless.

## Client Configs That Don't Fight You

Every client speaks the same stdio protocol. Every client insists on its own config schema. Here are the four you'll actually use, each pointing at the same Docker image you built.

### Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS)

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

Restart Claude Desktop. The hammer icon appears. If it doesn't, check `~/Library/Logs/Claude/mcp*.log` — the server's stderr lands there.

### Continue (`~/.continue/config.yaml`)

Current Continue builds use the YAML config, not the old `config.json`. Add an `mcpServers` list — use an absolute host path for the volume mount; Continue's docs don't document `${workspaceFolder}` substitution inside `mcpServers` args, so don't rely on it:

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

Prefer a per-project config instead? Drop a standalone file at `.continue/mcpServers/local-tools.yaml` with the same `mcpServers` key, plus the required `name`, `version`, and `schema: v1` metadata fields at the top level. Open Continue's sidebar → MCP → "Refresh" if tools don't appear.

### Cline (VS Code global storage)

Cline keeps its own settings file, separate from VS Code's and from Continue's — there's no `.cline/mcp_settings.json` in the project root. On macOS/Linux it lives under VS Code's `globalStorage`:

- macOS: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Linux: `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- Windows: `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json`
- Cline CLI (no VS Code): `~/.cline/mcp.json`

Easiest path: click the MCP Servers (plug) icon in Cline's panel → Configure → "Configure MCP Servers", which opens the right file for you.

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

There's no `MCP_LOG_LEVEL` env var that Cline (or any client) reads automatically — that was invented. For verbose logging, control it from the server side: `FastMCP("local-toolbox", log_level="DEBUG")` in the constructor turns up the SDK's own stderr logging, which still lands in Cline's output panel because stderr is exactly what the client captures.

### Zed (`~/.config/zed/settings.json`)

Zed's key is `context_servers`, not `mcp` or `mcpServers`, and local servers take `source: "custom"` plus flat `command`/`args`/`env` fields:

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

Restart Zed. Command palette → "agent: open settings" → MCP Servers confirms registration.

---

### The "Tools List Empty" Debug Checklist

1. **Wrong transport flag** — Your server *must* run with `stdio` (the default). If you copied a `FastMCP(..., transport="sse")` example, delete it.
2. **Docker `-i` missing** — Without `-i`, stdin closes immediately. The server starts, sees EOF, exits. Client sees zero tools.
3. **Mount path mismatch** — Tools execute *inside* the container at `/workspace`. Your `read_file` tool expects paths relative to that mount. Pass `/workspace/actual/file.py`, not `/home/you/projects/actual/file.py`.
4. **Schema validation failure** — Run the image manually and send the *full* handshake, not a bare `tools/list` (the server has nothing to respond correctly to until it's initialized).

Do it like this:

```bash
cat <<'EOF' | docker run -i --rm local-mcp-server:latest
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
EOF
```

Valid JSON-RPC responses for both `id: 1` and `id: 2`? If not, your `@mcp.tool()` decorator returned something the schema generator rejected (usually a `Union` type or bare `dict`).

For verbose logs, pass `log_level="DEBUG"` to the `FastMCP(...)` constructor and rebuild the image — the server emits every request/response pair to stderr, which is visible in each client's log pane. You'll see the exact validation error before you've finished your coffee.

## Exposing Your Actual Toolbox: rg, jq, sqlite3, ffmpeg

The `FastMCP` server from section 2 is cute. It adds numbers. Now make it do work. You already have `rg`, `jq`, `sqlite3`, and `ffprobe` installed — probably via Homebrew, apt, or that one `nix-env -iA` command you regret. Wrap them. Each tool becomes a typed function with a timeout, structured output, and zero tolerance for hanging processes.

Start with the imports and a reusable subprocess helper that won't swallow stderr. Same `mcp==1.29.0` pin as before — this section reuses the same `FastMCP` import, just in a second server file:

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

Now the tools, with flat `Annotated` parameters instead of a nested Pydantic model per tool — the same style as the `rg`/`jq`/`sqlite_query` server above. A flat schema is what LLMs fill in reliably; wrapping every call in a single `args: SearchArgs` object just adds a layer the model has to get right for no benefit. `search_code` — ripgrep with JSON output, because parsing colored terminal garbage is for masochists:

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

`transform_json` — jq with a filter string. Input JSON comes from the LLM, not a file, so pipe it via stdin:

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

`query_db` — this is the one worth slowing down for. Shelling out to the `sqlite3` CLI and appending `params` as extra positional arguments (as an earlier draft of this post did) is **not** parameterized SQL — the CLI has no `?` placeholder binding at all, so those "params" just become literal trailing arguments to the `sqlite3` binary and do nothing to the query string. Real parameter binding means using Python's own `sqlite3` module, which does support `?` placeholders, run off the event loop in a thread since the module is synchronous:

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

Now `sql = "SELECT * FROM audit WHERE name = ?"` with `params = ["DROP TABLE users"]` just searches for a row literally named "DROP TABLE users" — that's what parameterization is for.

`probe_media` — ffprobe with structured output. Your LLM can now answer "what's the bitrate of this 4GB MOV?" without you opening VLC:

```python
@mcp.tool()
async def probe_media(
    path: Annotated[str, Field(description="Media file path")],
) -> dict[str, Any]:
    cmd = ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", path]
    return await run_cmd(cmd, timeout=30.0)
```

Rebuild the Docker image (previous section) — the base already has `rg`, `jq`, `sqlite3`, `ffmpeg` via `apt-get install -y --no-install-recommends ripgrep jq sqlite3 ffmpeg`. Restart the client. Now ask Claude Desktop: *"Find all Python files mentioning 'asyncio' in ~/projects, extract the function names with jq, then check if any of those functions appear in the migration_log audit table."*

The LLM calls `search_code` → `transform_json` (filter: `.[].data.submatches[].match.text | select(test("def\\s+\\w+")) | capture("def\\s+(?<name>\\w+)") | .name | unique`) → `query_db` with the resulting names bound as real `?` parameters. You get a markdown table back. No copy-paste. No "let me run this locally first." The subprocess-plus-SQLite chain completes in under two seconds.

That's the point. Your CLI tools were already production-grade. You just gave them a JSON-RPC interface.

## Debugging When It Goes Sideways

Your server builds. The container starts. The client config loads. And then — nothing. No tools appear. No errors surface. Just a polite silence that makes you question every life choice leading to this moment. Welcome to MCP debugging, where stdout is the protocol and stderr is your only flashlight.

First rule: **never write logs to stdout**. The JSON-RPC protocol lives there. One `print("debug: starting up")` and you've corrupted the stream, causing the client to parse your friendly greeting as a malformed response. Use `logging` to stderr exclusively:

```python
import logging, sys

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger("mcp_server")
```

Now every `log.debug("rg exited with code %d", result.returncode)` lands in your terminal or Docker logs without breaking the handshake. Run the container with `-i` (interactive) to keep stdin attached — **this is the number one reason tools vanish**. Without `-i`, Docker closes stdin immediately, the server gets EOF, and exits before the client can send `initialize`. Your `docker run` must include `-i`:

```bash
docker run -i --rm \
  -v /home/me/code:/workspace \
  -w /workspace \
  local-mcp-server:latest
```

Miss the `-i`? The client spawns the container, sends `initialize`, gets TCP RST, and quietly marks the server "disconnected." You'll see zero errors in the client UI. Check `docker logs <container_id>` — you'll find a clean exit code 0 and no clues.

Next: **volume mount permissions**. Your `rg` tool reads `/workspace`. The container runs as `nobody` (`USER nobody` in the Dockerfile), not root. The host directory is owned by UID 1000, and `nobody`'s UID inside the container (65534 on Debian) doesn't match it. `rg` fails with `Permission denied` but the error never reaches the client if the tool handler catches the exception and swallows it instead of returning it. Let errors bubble or log them explicitly so they show up as a structured result the client can display:

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

**Tool schema mismatches** are the silent killer. You change a parameter type from `str` to `int` but forget to regenerate the client's cached schema. Claude Desktop caches aggressively. Restart it *fully* (Cmd+Q, not just close window). Continue and Cline reload on config change — usually. When in doubt, nuke the cache:

```bash
# Claude Desktop — quoting a leading ~ stops the shell from expanding it, so spell out $HOME
rm -rf "$HOME/Library/Application Support/Claude/mcp_cache"

# Continue (VS Code)
rm -rf ~/.continue/mcp-cache
```

**Timeout handling** bites when `ffprobe` hangs on a corrupted MKV. The client waits. And waits. The default `FastMCP` tool timeout is *none*. Add a wrapper:

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

Works on Linux/macOS. Windows? Use `threading.Timer` instead — signals are a Unix thing.

**Interactive testing**: skip the client entirely. The `mcp` package ships an inspector — pin it to the same `mcp[cli]==1.29.0` version you're running everywhere else, since the Inspector CLI's protocol expectations need to match your server's SDK version:

```bash
uvx --from 'mcp[cli]==1.29.0' mcp dev mcp_server.py
```

Opens a browser UI at `http://localhost:6274` (not 5173 — that's Vite's default dev port, not the Inspector's) where you can call tools, inspect schemas, and see raw JSON-RPC frames. Invaluable for verifying your `ripgrep` tool returns valid JSON before you blame the client.

**Capture a session** for post-mortem. `2> session.log` only captures what your `logging` calls write — human-readable text, not JSON-RPC. The actual protocol traffic rides on stdin/stdout, and a real client (Claude Desktop, Continue, Cline) owns those pipes directly, so you can't casually redirect them mid-session. To capture real request/response traffic, drive the server manually and `tee` both streams:

```bash
cat <<'EOF' | tee requests.log | docker run -i --rm local-mcp-server:latest | tee responses.log
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"demo","version":"1.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"rg","arguments":{"pattern":"TODO","path":"/workspace"}}}
EOF
```

Then inspect just the tool calls, on whichever file has the method you're after:

```bash
jq -c 'select(.method=="tools/call")' requests.log responses.log 2>/dev/null
```

You'll see every parameter you sent, every response the server returned, and exactly where the schema diverged from reality. For a live session against a real client, skip manual capture and use the Inspector above instead — there's no clean way to tee a pipe a client already owns.
