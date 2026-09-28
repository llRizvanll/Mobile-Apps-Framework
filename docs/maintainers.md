---
title: Maintainer guide
description: One-time GitHub and Google setup for the React Native framework repository — repo description and topics, GitHub Pages, social preview, Discussions, Search Console and release hygiene.
---

# Maintainer guide

Settings that live on GitHub or Google rather than in files. Do them once.

## 1. GitHub "About" box, topics and website

These drive GitHub search, topic pages and the Google snippet for the repo page.

```bash
gh repo edit llRizvanll/Mobile-Apps-Framework \
  --description "White-label, AI-native React Native framework in strict TypeScript: clean architecture, MVVM/MVI, DI, Redux Toolkit, REST/GraphQL/WebSocket, i18n/RTL, design tokens, observability & LLM tool calling." \
  --homepage "https://llrizvanll.github.io/Mobile-Apps-Framework/" \
  --add-topic react-native --add-topic typescript --add-topic expo --add-topic white-label \
  --add-topic mobile-app --add-topic clean-architecture --add-topic mvvm --add-topic mvi \
  --add-topic dependency-injection --add-topic redux-toolkit --add-topic graphql --add-topic websocket \
  --add-topic i18n --add-topic design-system --add-topic monorepo --add-topic boilerplate \
  --add-topic ai --add-topic llm --add-topic ai-agents --add-topic framework \
  --enable-discussions
```

GitHub allows up to 20 topics; the command above uses exactly 20.

## 2. GitHub Pages (docs site)

**Settings → Pages → Build and deployment → Source: GitHub Actions.** The `Docs` workflow then publishes on
every push to `main` that touches `docs/` or package READMEs.

## 3. Social preview

**Settings → General → Social preview → Upload** [`docs/public/og.png`](https://github.com/llRizvanll/Mobile-Apps-Framework/blob/main/docs/public/og.png) (1200×630).
It's used when the repo link is shared on X, LinkedIn, Slack and similar. The docs site already references it via `og:image`.

## 4. Google Search Console

1. Add the property `https://llrizvanll.github.io/Mobile-Apps-Framework/` (URL-prefix).
2. Verify with the HTML-tag method: add the tag to `head` in `docs/.vitepress/config.mts`:
   `['meta', { name: 'google-site-verification', content: '<token>' }]`.
3. Submit `sitemap.xml`. It's generated at build time and lists every page.

## 5. Repository hygiene

- Enable **Dependabot security updates** and **secret scanning** (Settings → Code security).
- Protect `main`: require the `CI / verify`, `CI / bundle` and `CodeQL` checks, plus one review.
- **Add a LICENSE.** Packages are currently `UNLICENSED`, which means others can't legally use the code. Choose a license, add `LICENSE`, and update each `package.json` `license` field.
- Cut releases with notes from [CHANGELOG.md](https://github.com/llRizvanll/Mobile-Apps-Framework/blob/main/CHANGELOG.md). GitHub Releases are indexed and show up on the repo page.

## SEO checklist for new docs pages

- Frontmatter `title` (≤ 60 chars) and `description` (≤ 160 chars, containing the page's key terms)
- One `#` heading, descriptive `##` sections, and links to related pages
- Diagrams in Mermaid (text is indexable, unlike images)
- Add the page to the sidebar in `docs/.vitepress/config.mts`
