export const en = {
  settings: {
    tab: 'Settings',
    theme: 'Theme',
    themes: { system: 'System', light: 'Light', dark: 'Dark' },
    language: 'Language',
    analytics: 'Analytics',
    optedIn: 'Opted in',
    optedOut: 'Opted out',
  },
} as const;

type Shape<T> = { readonly [K in keyof T]: T[K] extends string ? string : Shape<T[K]> };

export const ar: Shape<typeof en> = {
  settings: {
    tab: 'الإعدادات',
    theme: 'المظهر',
    themes: { system: 'النظام', light: 'فاتح', dark: 'داكن' },
    language: 'اللغة',
    analytics: 'التحليلات',
    optedIn: 'مفعّل',
    optedOut: 'غير مفعّل',
  },
};

export type SettingsResources = typeof en;
