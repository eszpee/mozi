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

## Backfill new data right after the deploy

When a change adds or changes cached data (new TMDB fields in `MovieMeta`, a new shape for
an existing field, anything that existing rows lack), every existing row must be backfilled
once, right after the deploy. Don't leave it to the hourly or weekly refresh.

- Make the backfill part of the startup catch-up in `src/lib/server/jobs.ts`, which runs
  about 15 s after each boot. For movie metadata, add a "missing or old-shape" condition to
  `refreshStaleMeta` in `src/lib/server/movies.ts`, e.g.
  `json_type(meta, '$.newField') IS NULL`. For other data, add an equivalent one-off step
  there that skips rows already done.
- Read old rows safely until the backfill lands: the page must not break on rows that
  don't have the new data yet.
- After the deploy, check the live database (on selfhost, `docker exec -i -w /app mozi node -`
  with a small better-sqlite3 query on stdin) to confirm that every row has the new data.
  Check `docker logs mozi` for refresh failures.
