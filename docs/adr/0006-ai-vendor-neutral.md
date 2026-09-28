---
title: 'ADR 0006: Vendor-neutral AI'
description: Why AI calls go through a vendor-neutral client and a backend proxy, and why tools call use cases.
---

# 0006 — Vendor-neutral AI

**Decision**: Apps depend on the `AIClient` port (chat, stream, tool calls) and logical model tiers
(`fast`/`balanced`/`smart`). The production adapter calls **our backend**, which holds vendor keys,
enforces quotas/safety and maps tiers to concrete models. Vendor SDK adapters can be added behind the
same port.

Features expose **tools** that call their existing use cases, so agent actions obey the same
validation, analytics and permissions as the UI. Side-effecting tools require user confirmation.
AI calls are traced and usage is tracked; prompt content is never logged.

**Consequences**: switching vendors/models is a backend change; no API keys in app binaries.
