---
title: CI/CD pipeline
description: GitHub Actions workflows for the React Native framework — formatting, strict TypeScript, ESLint architecture boundaries, Jest, per-brand Metro bundle matrix, CodeQL security scanning and documentation deployment to GitHub Pages.
---

# CI/CD

**Source**: [`.github/workflows`](https://github.com/llRizvanll/Mobile-Apps-Framework/tree/main/.github/workflows)

```mermaid
flowchart LR
  PR([Push / Pull request]) --> V["ci.yml › verify<br/>npm ci · prettier · tsc · eslint (boundaries) · jest"]
  PR --> BM["ci.yml › bundle<br/>expo export × {acme, globex}"]
  PR --> CQ["codeql.yml<br/>security analysis"]
  M([Merge to main]) --> DOC["docs.yml<br/>VitePress build → GitHub Pages"]
  W([Weekly]) --> DB["dependabot<br/>npm + actions updates"]
```

| Workflow          | Trigger                                  | Gate                                                           |
| ----------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `ci.yml` › verify | push to `main`, every PR                 | formatting, strict types, lint (incl. architecture), all tests |
| `ci.yml` › bundle | same                                     | Metro can bundle the app for every brand                       |
| `codeql.yml`      | push, PR, weekly                         | JavaScript/TypeScript security queries                         |
| `docs.yml`        | push to `main` touching docs or packages | builds and deploys this site                                   |
| `dependabot.yml`  | weekly                                   | grouped dependency update PRs                                  |

## Local equivalent

```bash
npm run format:check && npm run verify
npm run docs:build
```

## Suggested next: native release

Add EAS Build/Submit jobs keyed by the same brand matrix (`EXPO_PUBLIC_BRAND`) to produce signed store builds per brand.
