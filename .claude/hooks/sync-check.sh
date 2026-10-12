#!/bin/sh
# Runs on every prompt: this repo is worked on from several Claude Code sessions on
# different machines, so a checkout can fall behind main mid-session.
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
GIT_TERMINAL_PROMPT=0 git fetch -q origin 2>/dev/null || exit 0
behind=$(git rev-list --count HEAD..@{upstream} 2>/dev/null) || exit 0
[ "$behind" -gt 0 ] || exit 0
echo "This checkout is $behind commit(s) behind $(git rev-parse --abbrev-ref @{upstream}). Pull (git pull --ff-only, or stash first) before reading or changing code:"
git log --oneline HEAD..@{upstream} | head -20
