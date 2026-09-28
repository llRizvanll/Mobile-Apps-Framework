# Architecture Decision Records

| #                                           | Decision                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| [0001](0001-ports-and-adapters.md)          | Ports & adapters with structural adapter types; no hard native deps in the framework |
| [0002](0002-typed-di-without-decorators.md) | Typed token DI container; no decorators / reflect-metadata                           |
| [0003](0003-result-over-exceptions.md)      | `Result` at data boundaries; `AppError` taxonomy                                     |
| [0004](0004-source-packages.md)             | Packages ship TypeScript source in the monorepo                                      |
| [0005](0005-state-placement.md)             | Redux for shell/global state; VMs/MVI for screen state; own persistence              |
| [0006](0006-ai-vendor-neutral.md)           | Vendor-neutral AI via backend proxy; tools call use cases                            |
| [0007](0007-local-typed-i18n-keys.md)       | Local generic translation keys instead of global augmentation                        |
