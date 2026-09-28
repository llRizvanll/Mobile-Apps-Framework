# Contributing

1. Follow [AGENTS.md](AGENTS.md) (it applies to humans too) and [docs/architecture.md](docs/architecture.md).
2. Scaffold with the generators (`npm run gen:feature`, `npm run gen:brand`) and gate risky work behind a flag.
3. Test at the right level ([docs/features.md#testing](docs/features.md#testing)).
4. Before pushing: `npm run format && npm run verify && npm run flags -- doctor`.
5. Commits: [Conventional Commits](https://www.conventionalcommits.org/) with the area as scope (`feat(orders): …`, `fix(network): …`).
6. Record decisions with lasting impact in [docs/decisions.md](docs/decisions.md).
