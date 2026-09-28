---
title: AI-native development
description: How the repository is optimised for AI coding agents like Claude Code, Cursor and Copilot — AGENTS.md, CLAUDE.md, llms.txt, project skills, generators and lint-enforced architecture — and how apps ship AI features safely.
---

# AI-native development

"AI-native" means two things here.

## 1. Built for AI coding agents

```mermaid
flowchart LR
  A([Agent receives task]) --> R["Reads AGENTS.md<br/>(CLAUDE.md imports it)"]
  R --> S{"Scaffolding?"}
  S -- yes --> G["Skill → npm run gen:feature / gen:brand"]
  S -- no --> E[Edit within the 'Where things go' map]
  G --> E
  E --> V["npm run verify"]
  V -- "lint: boundary violation" --> E
  V -- "tsc: invalid translation key" --> E
  V -- green --> PR([PR with tests])
```

| Asset                                                                                             | Purpose                                                                                                      |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`AGENTS.md`](https://github.com/llRizvanll/Mobile-Apps-Framework/blob/main/AGENTS.md)            | Commands, invariants, where code goes, definition of done                                                    |
| [`CLAUDE.md`](https://github.com/llRizvanll/Mobile-Apps-Framework/blob/main/CLAUDE.md)            | Imports AGENTS.md and adds Claude Code specifics                                                             |
| [`llms.txt`](https://github.com/llRizvanll/Mobile-Apps-Framework/blob/main/llms.txt)              | Index of docs for LLMs                                                                                       |
| [`.claude/skills/`](https://github.com/llRizvanll/Mobile-Apps-Framework/tree/main/.claude/skills) | `new-feature`, `new-brand` skills                                                                            |
| Generators                                                                                        | Agents scaffold correct structure instead of copying files                                                   |
| Package READMEs                                                                                   | Local API context next to the code                                                                           |
| Enforcement                                                                                       | Architecture lint, strict types, typed i18n keys and brand contract tests give agents fast, precise feedback |

Everything an agent could get wrong in a way that matters is caught by `npm run verify`.

## 2. Built for AI features in apps

See the [AI agent workflow](../workflows/ai-agent.md): a vendor-neutral client, tools on use cases, confirmation for side effects, observability without logging content, and a scripted client for tests.
