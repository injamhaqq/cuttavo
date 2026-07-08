#!/usr/bin/env bash
# reduce-output.sh — advisory PreToolUse hook for Bash commands.
#
# Goal: cut token usage in terminal-heavy Claude Code sessions by nudging
# toward quiet flags and the structured Read/Grep/Glob tools when a command
# is likely to flood context with output.
#
# Design (read before changing):
#   * NEVER rewrites or blocks a command — only injects a short reminder via
#     hookSpecificOutput.additionalContext. You stay fully in control.
#   * Stays silent for commands that don't match, so ~zero overhead normally.
#   * If jq is missing or input is unparseable, exits 0 and does nothing.
#
# Input : PreToolUse JSON on stdin, e.g. {"tool_input":{"command":"npm install"}}
# Output: nothing, OR a JSON object with a one-line additionalContext string.

set -euo pipefail
command -v jq >/dev/null 2>&1 || exit 0
cmd="$(jq -r '.tool_input.command // ""' 2>/dev/null || true)"
[ -z "$cmd" ] && exit 0

has() { printf '%s' "$cmd" | grep -Eq -- "$1"; }
tip=""
set_tip() { [ -z "$tip" ] && tip="$1"; }

# --- package installs (very noisy) -----------------------------------------
if has 'npm (install|ci|i )' && ! has '--silent|--quiet| -s( |$)'; then
  set_tip "npm is noisy: add --silent (pipe to 'tail -n 20' if you only need the result)."
elif has '(pip3?|uv pip) install' && ! has '-q|--quiet'; then
  set_tip "pip is noisy: add -q."
elif has '(yarn (install|add)|pnpm (install|add)|bun (install|add))'; then
  set_tip "package install: append '--silent' or pipe to 'tail -n 20'."
elif has 'apt(-get)? (install|update|upgrade)' && ! has '-qq|-q'; then
  set_tip "apt is noisy: add -qq."
fi

# --- test runners / builders -----------------------------------------------
[ -z "$tip" ] && if has '\b(pytest|py\.test)\b' && ! has '-q|--quiet'; then
  set_tip "pytest: add -q for compact output."
elif has '\b(jest|vitest)\b' && ! has '--reporter|--silent'; then
  set_tip "jest/vitest: use '--reporter=dot' or '--silent'."
elif has 'docker build' && ! has '-q|--quiet'; then
  set_tip "docker build: add -q, or it dumps every layer."
elif has '\bmake\b' && ! has ' -s| --silent'; then
  set_tip "make: add -s to silence recipe echoing."
fi

# --- read/search that has a token-cheaper structured tool -------------------
[ -z "$tip" ] && case "$cmd" in
  cat\ *|*"| cat "*) set_tip "use the Read tool instead of 'cat' — more token-efficient, paginated." ;;
esac
[ -z "$tip" ] && case "$cmd" in
  grep\ *|*"| grep "*|rg\ *) set_tip "prefer the Grep tool over shell grep/rg for searching code." ;;
esac
[ -z "$tip" ] && case "$cmd" in
  find\ *) set_tip "prefer the Glob tool over 'find' for locating files." ;;
esac

# --- unbounded / streaming (can flood context or hang the session) ---------
[ -z "$tip" ] && if has 'git log' && ! has '--oneline|-n |-[0-9]'; then
  set_tip "git log is unbounded: add --oneline and -n <N>."
elif has 'ls (-[a-zA-Z]*R|-R)'; then
  set_tip "recursive ls can be huge: prefer Glob or limit depth."
elif has '(tail|journalctl|kubectl logs).* -f\b|\bwatch \b'; then
  set_tip "streaming/-f/watch never terminates in a hook context — capture a bounded snapshot instead."
fi

[ -z "$tip" ] && exit 0
jq -cn --arg t "Token-saving tip: $tip" \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$t}}'
