@AGENTS.md

## Claude Code specifics

- Project skills are in `.claude/skills/`. Invoke the matching one (e.g. `feature-flags`, `new-feature`) before starting that kind of task.
- Nested `CLAUDE.md` files in `src/framework/`, `src/features/` and `src/brands/` load local rules when you work there.
- Before editing a framework module, read its `README.md` (public API + extension points).
- To see the app, use `npm run ios` with the iOS simulator; the Dev tab shows live flag sources.
