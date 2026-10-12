# mozi

## Always start from the latest main

This repo is worked on from several Claude Code sessions at once, on different machines
(the Mac, the AoE sandbox on claude-remote-orchestrator), and every push to `main`
auto-deploys. A checkout can fall behind while a session is open.

- **Before starting any task**, run `git pull --ff-only`, even mid-session. If the working
  tree is dirty, stash, pull, then reapply. Don't build on code you read before the pull.
- **Before pushing**, run `git pull --rebase` and rerun `npm run check` and `npm test` if
  anything came in.
- `.claude/hooks/sync-check.sh` runs on every prompt and warns when the checkout is behind
  `origin`; act on that warning before doing anything else.
