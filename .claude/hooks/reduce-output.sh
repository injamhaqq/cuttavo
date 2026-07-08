#!/usr/bin/env bash
# reduce-output.sh — advisory PreToolUse hook for Bash commands.
#
# Goal: cut token usage in terminal-heavy Claude Code sessions by nudging
# toward quiet flags and the structured Read/Grep/Glob tools when it sees a
# command that is likely to dump a lot of output into context.
#
# Design choices (read these before changing anything):
#   * It NEVER rewrites or blocks your command. It only injects a short
#     reminder via hookSpecificOutput.additionalContext. You stay in control;
#     nothing runs differently because of this hook.
#   * It stays silent for commands that don't match a noisy pattern, so it
#     adds ~zero overhead on the common case.
#   * If jq is missing or input is unparseable, it exits 0 and does nothing.
#
# Input: PreToolUse JSON on stdin, e.g. {"tool_input":{"command":"npm install"}}
# Output: nothing, OR a JSON object with a tiny additionalContext string.

set -euo pipefail

command -v jq >/dev/null 2>&1 || exit 0

cmd="$(jq -r '.tool_input.command // ""' 2>/dev/null || true)"
[ -z "$cmd" ] && exit 0

tip=""

case "$cmd" in
  *"npm install"*|*"npm ci"*|*"npm i "*)
    echo "$cmd" | grep -Eq -- '--silent|--quiet| -s( |$)' || \
      tip="npm is noisy: add --silent (and pipe to 'tail -n 20' if you only need the result)." ;;
esac
[ -z "$tip" ] && case "$cmd" in
  *"pip install"*|*"pip3 install"*)
    echo "$cmd" | grep -Eq -- '-q|--quiet' || \
      tip="pip is noisy: add -q." ;;
esac
[ -z "$tip" ] && case "$cmd" in
  *"yarn install"*|*"yarn "*add*|*"pnpm install"*)
    tip="package installs are noisy: append '--silent' or pipe to 'tail -n 20'." ;;
esac
[ -z "$tip" ] && case "$cmd" in
  cat\ *|*"| cat "*)
    tip="use the Read tool instead of 'cat' — it is more token-efficient and paginates." ;;
esac
[ -z "$tip" ] && case "$cmd" in
  grep\ *|*"| grep "*|rg\ *)
    tip="prefer the Grep tool over shell grep/rg for searching the codebase." ;;
esac
[ -z "$tip" ] && case "$cmd" in
  find\ *)
    tip="prefer the Glob tool over 'find' for locating files." ;;
esac
[ -z "$tip" ] && case "$cmd" in
  *"git log"*)
    echo "$cmd" | grep -Eq -- '--oneline|-n |-[0-9]' || \
      tip="git log is unbounded: add --oneline and -n <N>." ;;
esac
[ -z "$tip" ] && case "$cmd" in
  *"ls -R"*|*"ls -laR"*|*"ls -alR"*)
    tip="recursive ls can be huge: prefer the Glob tool or add a depth limit." ;;
esac

[ -z "$tip" ] && exit 0

jq -cn --arg t "Token-saving tip: $tip" \
  '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$t}}'
