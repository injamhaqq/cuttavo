# Token savings — what's configured, and what was reviewed

Durable record so this doesn't get re-derived every session.

## Configured in this repo (transparent, no third-party code)

| File | Lever | Effect |
|---|---|---|
| `.claude/settings.json` → `env` | `BASH_MAX_OUTPUT_LENGTH=20000`, `MAX_MCP_OUTPUT_TOKENS=15000` | Caps oversized tool output at the source (input tokens). |
| `.claude/settings.json` → `outputStyle` | `caveman` | Terse responses (output tokens). |
| `.claude/hooks/reduce-output.sh` | `PreToolUse` Bash hook | Advisory nudge toward quiet flags / structured tools on noisy commands. Never rewrites or blocks. |
| `.claude/output-styles/caveman.md` | Output style | The concise style itself. |
| `CLAUDE.md` | Instructions | Output discipline + accuracy rules. |

Free built-ins that matter more than any install: `/clear` between tasks,
`/compact` on long sessions, subagents for big searches, `Read`/`Grep`/`Glob`
instead of shell dumps. Right-size the model. New chat per topic on claude.ai.

## Third-party repos reviewed (read-only, not installed here)

| Repo | Verdict | Notes |
|---|---|---|
| `rtk.ai/install.sh` (curl\|sh) | **Refused (correct)** | Blind `curl \| sh` from a network-blocked host is the wrong install method for anything, vetted or not. Refusal stands. |
| `rtk-ai/rtk` (source, reviewed) | **Legit — install via cargo/brew** | Rust CLI proxy that filters command output. `build.rs` benign; telemetry opt-in (defaults off, endpoint compile-time only, sends anonymized command-name+savings stats — not output/paths/content), disable+erasure supported. Reddit "89%" is cherry-picked. Install: `cargo install rtk` or `brew` — NOT curl\|sh. |
| `Mibayy/token-savior` | **Legit** | Python (not npm). Structural code indexer + memory. No exfil; telemetry local. Keep bash-rewriter OFF (`TS_BASH_REWRITE` unset). |
| `drona23/claude-token-efficient` | **Content OK; hook skipped** | Adopted 2 CLAUDE.md rules. Did NOT adopt its PreCompact `git add -A --no-verify` auto-commit (commits secrets/junk). |
| `ooples/token-optimizer-mcp` | **Not malicious; caution** | npm. Global install auto-`curl`s hooks from GitHub raw and wires them into Claude Code — avoid. If used: local `npm install` (NOT `-g`), `npm run build`, point MCP at `dist/server/index.js`. Poor repo hygiene. |
| `alexgreensh/token-optimizer` | **Best-vetted of the set** | Not pip (`requirements.txt`/`analyze.py` don't exist). Installs via verified `install.sh` (signed releases + SHA256 checksums). Local-only, no telemetry, credential-redacted session cache. Reads `~/.claude/projects/*.jsonl`. Read `HOOKS.md`/`SECURITY.md` first. |
| `zilliztech/claude-context` | **Legit; sends code off-machine** | Reputable (Zilliz/Milvus), npm/pnpm (not pip — no `index.py`). Semantic code search. By design sends your code to an external embedding API (OpenAI/Voyage/Gemini) + stores vectors in Zilliz Cloud, unless you use local Ollama + self-hosted Milvus. Needs API keys. |
| `mksglu/context-mode` (npm) | **Install clean; runtime unaudited** | postinstall is benign install-plumbing (no exfil). But runtime ships as 742KB/674KB minified bundles — cannot audit a tool that does "sandboxed code execution" + reads sessions. Single maintainer, rapid churn. |

Note: every third-party install snippet handed to me so far (npm/pip/node
paths) was **wrong for its repo** — generated without reading the code. Always
verify the real entrypoint before running.

## Rule of thumb

Third-party MCP servers only help on **large codebases** and only on Claude
Code / Cowork surfaces — never claude.ai chat. Install them on your real
machine against real code, never in an ephemeral sandbox. Always review the
install-time scripts (`postinstall`, `install-hooks.*`) before running.
