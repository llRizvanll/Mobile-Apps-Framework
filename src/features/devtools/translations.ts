/** Developer tooling copy — English only (other locales fall back to en). */
export const en = {
  devtools: {
    tab: 'Dev',
    title: 'Feature flags',
    subtitle: 'Overrides are stored on this device only and are disabled in production builds.',
    restartBanner: 'Module flags changed: {{flags}}. Restart to apply.',
    restart: 'Restart now',
    resetAll: 'Reset all overrides',
    reset: 'Reset',
    overridesDisabled: 'Overrides are disabled in this build.',
    kind: { module: 'module · restart', runtime: 'runtime · live' },
    source: {
      default: 'default',
      brand: 'brand',
      remote: 'remote',
      override: 'override',
      unknown: 'unregistered',
    },
    build: 'Build',
  },
} as const;

export type DevtoolsResources = typeof en;
