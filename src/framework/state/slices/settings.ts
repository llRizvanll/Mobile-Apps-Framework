import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface SettingsState {
  readonly themePreference: ThemePreference;
  /** null = follow device locale. */
  readonly locale: string | null;
  readonly analyticsConsent: boolean | null;
}

const initialState: SettingsState = {
  themePreference: 'system',
  locale: null,
  analyticsConsent: null,
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    themePreferenceChanged: (s, a: PayloadAction<ThemePreference>) => {
      s.themePreference = a.payload;
    },
    localeChanged: (s, a: PayloadAction<string | null>) => {
      s.locale = a.payload;
    },
    analyticsConsentChanged: (s, a: PayloadAction<boolean>) => {
      s.analyticsConsent = a.payload;
    },
  },
  selectors: {
    selectThemePreference: (s) => s.themePreference,
    selectLocale: (s) => s.locale,
  },
});

declare module '../registry' {
  interface RootStateRegistry {
    settings: SettingsState;
  }
}
