## What & why

<!-- What does this change and why? Link issues: Closes #123 -->

## Type

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] Tooling/CI
- [ ] Breaking change (describe the migration below)

## Checklist

- [ ] `npm run format && npm run verify && npm run flags -- doctor` passes locally
- [ ] New/changed flags registered (owner, expiry if temporary); risky features ship behind a flag
- [ ] Mock backend updated for new endpoints
- [ ] Tests added/updated at the right level (unit / data / integration)
- [ ] Layer boundaries respected; no new lint disables without a `-- reason`
- [ ] No hard-coded colours, spacing or copy; a11y props on interactive elements
- [ ] Docs / README / ADR / CHANGELOG updated if public APIs or conventions changed

## Screenshots / recordings (UI changes)
