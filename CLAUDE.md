# Working in this repo

`cuttavo` is a small static website (`index.html` + `CNAME`, GitHub Pages).
There is no build step, package manager, or test suite.

## Token / cost discipline (terminal-heavy sessions)

Most token cost in agent sessions comes from **verbose command output** getting
pulled into context and then re-sent on every subsequent turn. Keep output small:

- **Read/search with the structured tools, not the shell.** Use `Read` instead
  of `cat`, `Grep` instead of `grep`/`rg`, `Glob` instead of `find`. They are
  more token-efficient, paginate, and the harness avoids re-reading unchanged files.
- **Add quiet flags** to anything chatty: `npm install --silent`, `pip install -q`,
  `pytest -q`, `git --no-pager ...`, `make -s`.
- **Bound unbounded commands:** `git log --oneline -n 20`, avoid `ls -R` on large
  trees, avoid dumping whole files.
- **Send noise to a file, read back only what matters:**
  `cmd > /tmp/out.log 2>&1; tail -n 30 /tmp/out.log`.
- **Manage context lifecycle:** `/clear` between unrelated tasks; `/compact` when a
  session gets long but you need continuity.

## What is configured here (`.claude/`)

- `settings.json` → `env` caps (`BASH_MAX_OUTPUT_LENGTH`, `MAX_MCP_OUTPUT_TOKENS`)
  truncate oversized tool output at the source. Tune the numbers if they clip
  output you actually need.
- `settings.json` → a `PreToolUse` **Bash** hook running
  `.claude/hooks/reduce-output.sh`. It is **advisory only**: it never rewrites or
  blocks a command, it just prints a one-line "use a quiet flag" reminder when it
  sees a known-noisy command, and stays silent otherwise.

Review or disable the hook anytime via `/hooks`.
