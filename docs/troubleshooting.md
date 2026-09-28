# Troubleshooting & FAQ

## Troubleshooting

**"App configuration error" on launch.** Composition failed before the UI started: unknown `EXPO_PUBLIC_BRAND`,
invalid brand config (every bad field is listed), an invalid flag registry, or a module rejecting its config (e.g.
`assistant` on while `ai.enabled` is false).

**A flag change did nothing.** Module flags apply on the next launch (the Dev tab offers _Restart now_). Overrides are
ignored with `EXPO_PUBLIC_ENV=production`. `requires` may keep a flag off. Check its source in the Dev tab or run `npm run flags`.

**ESLint: `framework/x may not depend on framework/y`.** That's an architecture boundary. Move the code, or add the edge to
`src/framework/layers.json` if it's genuinely right.

**ESLint: `Features must not depend on the app shell` / `Don't reach into another feature's internals`.** Read brand
data with `useBrandConfig()`, depend on the other feature's tokens, or move shared code into the framework.

**ESLint: `domain/ must stay framework-free`.** Put the React, HTTP or storage code in `data/` or `presentation/`, and keep a port in `domain/`.

**`… not assignable … with exactOptionalPropertyTypes`.** Don't pass `undefined` to optional props. Spread them instead:
`{ ...(testID ? { testID } : {}) }`.

**Tests: `render function has not been called` / empty screen.** RNTL v14 is async: `await render(...)`,
`await fireEvent.press(...)`. Wrap flag changes in `await act(...)`.

**`Unable to resolve module @framework/...`.** Check the alias and folder name, then `npx expo start -c`. `npm run bundle:check` reproduces it.

**Native build out of sync after adding a dependency.** `npx expo prebuild --clean`, then `npm run ios|android`.

**Arabic doesn't flip the layout.** Native layout direction changes after a reload (`syncLayoutDirection` requests one).

**`flags doctor` fails in CI.** It lists each problem: unknown or mistyped brand values, a broken `requires`, or a flag used in code but not registered.

## FAQ

**Is this a boilerplate or a framework?** A boilerplate: one Expo app you clone. The framework inside it (`src/framework`)
keeps the integrated suite maintainable. There's nothing to install or publish.

**Do I have to use brands?** You already are: `main`. Single-brand apps just edit it.

**Which navigation library?** Modules declare `tabs` and a minimal shell renders them. For stacks and deep links, map
`useModuleTabs()` to expo-router or React Navigation. Flags keep working.

**Can I remove the example features?** Yes. See [Getting started](getting-started.md#make-it-your-app-30-minutes).

**Can I share the framework between apps later?** Extract `src/framework` into a package with a build step when a second app needs it.

**Does it support web?** Not configured. Expo web can be added, but the UI kit targets native.
