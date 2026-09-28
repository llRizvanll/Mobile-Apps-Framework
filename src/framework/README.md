# Built-in framework

Product-agnostic infrastructure for this app, imported as `@framework/<module>`. Rules: [`AGENTS.md`](AGENTS.md).
Layer graph: [`layers.json`](layers.json). Docs: [Architecture](../../docs/architecture.md).

| Module                                   | Purpose                                                |
| ---------------------------------------- | ------------------------------------------------------ |
| [foundation](foundation/README.md)       | Result, AppError, Emitter, ObservableStore, utilities  |
| [di](di/README.md)                       | Typed dependency injection                             |
| [observability](observability/README.md) | Logger, crash reporter, analytics, tracing             |
| [storage](storage/README.md)             | Key-value, secure storage, SQLite                      |
| [network](network/README.md)             | REST, GraphQL, WebSocket                               |
| [state](state/README.md)                 | Redux store, persistence, shell slices                 |
| [i18n](i18n/README.md)                   | Translations, plurals, RTL                             |
| [theme](theme/README.md)                 | Design tokens, light/dark                              |
| [presentation](presentation/README.md)   | MVVM and MVI                                           |
| [ui](ui/README.md)                       | Atomic components, brand overrides                     |
| [ai](ai/README.md)                       | AI client, tools, agent loop                           |
| [core](core/README.md)                   | Brand config, modules, kernel, feature flags, provider |
| [testing](testing/README.md)             | Test harness                                           |
