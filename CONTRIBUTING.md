# Contributing

Thanks for helping improve the Mobile App Framework! This guide gets a change from idea to merged PR.

## Setup

```bash
git clone https://github.com/llRizvanll/Mobile-Apps-Framework.git
cd Mobile-Apps-Framework
npm install
npm run verify
```

Node 20+ is required. For native runs, see the [quick start](docs/guide/getting-started.md).

## Workflow

1. **Open or find an issue** for anything non-trivial, so the design can be agreed before you write code.
2. **Branch** from `main`: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`.
3. **Follow the architecture** in [AGENTS.md](AGENTS.md) and [docs/architecture.md](docs/architecture.md). Use the generators (`npm run gen:feature`, `npm run gen:brand`) instead of copying files.
4. **Test** at the right level ([testing strategy](docs/workflows/testing.md)).
5. **Run the gate**: `npm run format && npm run verify`.
6. **Open a PR** using the template. CI must be green.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/): `feat(network): add request deduplication`, `fix(i18n): …`, `docs: …`.
Use the package name as the scope when a change targets one package.

## What we look for in review

- Layer boundaries respected (lint enforces most of them)
- `Result`/`AppError` at data boundaries; errors surfaced as i18n keys
- No hard-coded colours, spacing or copy; accessibility props on interactive elements
- Tests for new behaviour; docs updated when public APIs or conventions change
- Architecture decisions with lasting impact get an [ADR](docs/adr/README.md)

## Changing a framework package

Public APIs are used by brands and apps. Prefer additive changes, and call out breaking changes in the PR description and [CHANGELOG.md](CHANGELOG.md).

## Using AI coding agents

You're welcome to. Agents should read `AGENTS.md` (Claude Code picks it up via `CLAUDE.md`). You are responsible for reviewing everything the agent produces.
