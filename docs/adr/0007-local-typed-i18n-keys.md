---
title: 'ADR 0007: Local typed i18n keys'
description: Why translation keys are typed locally with generics instead of global module augmentation.
---

# 0007 — Local typed translation keys

**Context**: A global `TranslationRegistry` augmentation retypes every package in the monorepo, so two
apps (or the framework's own keys) conflict.

**Decision**: Keys are `string` at package boundaries; consumers opt into compile-time checking locally
with `useTranslation<typeof en>()`. Non-base locales are typed with `Shape<typeof en>` so missing keys
fail to compile.
