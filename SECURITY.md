# Security Policy

## Supported versions

The latest release on `main` receives security fixes.

## Reporting a vulnerability

**Please do not open public issues for security problems.**
Report privately via [GitHub Security Advisories](https://github.com/llRizvanll/Mobile-Apps-Framework/security/advisories/new).
Include affected packages or versions, reproduction steps, and the impact. We aim to acknowledge reports within 72 hours.

## Security design notes

- Secrets belong in `SecureStoreToken` (Keychain/Keystore), never in Redux, `KeyValueStore` or logs.
- The logger redacts common PII/secret keys before any sink.
- AI vendor keys never ship in the app. Calls go through your backend proxy ([ADR 0006](docs/adr/0006-ai-vendor-neutral.md)).
- Side-effecting AI tools require user confirmation.
- Runtime brand config is validated with zod and deep-frozen.
- CodeQL runs on every PR.
