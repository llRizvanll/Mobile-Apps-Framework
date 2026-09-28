# @org/ui

Atomic design components with a brand override registry.

| Level     | Components                                                         |
| --------- | ------------------------------------------------------------------ |
| Atoms     | `Box`, `Text` (`tx` keys), `Button`, `Input`, `Spinner`, `Divider` |
| Molecules | `FormField`, `ListItem`                                            |
| Organisms | `EmptyState`, `ErrorState`, `ErrorBoundary`                        |
| Templates | `Screen` (safe-area insets, keyboard avoidance, scroll, footer)    |

All styling comes from theme tokens; all components are accessible (roles, states, live regions).

**Overrides**: `<UIProvider components={{ Button: BrandButton }}>` (brands set `components` in
`defineBrand`). Decorate the default with `DefaultButton` — using `Button` inside an override recurses.
Add slots by augmenting `UIComponentMap`.
