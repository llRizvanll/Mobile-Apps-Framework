import { createI18n, directionOf, matchLocale, syncLayoutDirection } from '../index';

const make = () =>
  createI18n({
    defaultLocale: 'en',
    supportedLocales: ['en', 'en-GB', 'ar', 'fr'],
    resources: {
      en: {
        common: {
          hello: 'Hello {{name}}',
          items: { zero: 'No items', one: '{{count}} item', other: '{{count}} items' },
        },
        only: { en: 'english only' },
      },
      'en-GB': { common: { hello: 'Hiya {{name}}' } },
    },
    loaders: { ar: () => Promise.resolve({ common: { hello: 'مرحبا {{name}}' } }) },
  });

describe('i18n', () => {
  it('interpolates and pluralises', () => {
    const i18n = make();
    expect(i18n.t('common.hello', { name: 'Ada' })).toBe('Hello Ada');
    expect(i18n.t('common.items', { count: 0 })).toBe('No items');
    expect(i18n.t('common.items', { count: 1 })).toBe('1 item');
    expect(i18n.t('common.items', { count: 1200 })).toBe('1,200 items');
  });

  it('falls back through region → language → fallback and reports missing keys', async () => {
    const missing = jest.fn();
    const i18n = createI18n({
      defaultLocale: 'en',
      supportedLocales: ['en', 'en-GB'],
      resources: { en: { a: 'A', b: 'B' }, 'en-GB': { a: 'GB' } },
      onMissingKey: missing,
    });
    await i18n.setLocale('en-GB');
    expect(i18n.t('a')).toBe('GB');
    expect(i18n.t('b')).toBe('B');
    expect(i18n.t('nope')).toBe('nope');
    expect(missing).toHaveBeenCalledWith('nope', 'en-GB');
  });

  it('lazy-loads locales, emits changes and reports RTL', async () => {
    const i18n = make();
    const changed = jest.fn();
    i18n.onChange(changed);
    await i18n.setLocale('ar');
    expect(i18n.t('common.hello', { name: 'X' })).toBe('مرحبا X');
    expect(i18n.t('only.en')).toBe('english only');
    expect(i18n.direction).toBe('rtl');
    expect(changed).toHaveBeenCalledWith('ar');
    await expect(i18n.setLocale('de')).rejects.toThrow(/Unsupported/);
  });

  it('matches device locales and syncs layout direction', () => {
    expect(matchLocale(['de-DE', 'en-US'], ['en', 'fr'], 'fr')).toBe('en');
    expect(matchLocale(['ja'], ['en'], 'en')).toBe('en');
    expect(directionOf('he-IL')).toBe('rtl');
    const adapter = {
      isRTL: false,
      allowRTL: jest.fn(),
      forceRTL: jest.fn(),
      requestReload: jest.fn(),
    };
    expect(syncLayoutDirection(adapter, 'ar')).toBe(true);
    expect(adapter.forceRTL).toHaveBeenCalledWith(true);
    expect(syncLayoutDirection({ ...adapter, isRTL: true }, 'ar')).toBe(false);
  });
});
