import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Native app config (Expo). White-label: one codebase, many store apps —
 *   EXPO_PUBLIC_BRAND=<brand> npx expo run:ios
 *   EXPO_PUBLIC_BRAND=<brand> eas build --profile production --platform all
 * Identity comes from src/brands/<id>/native.json — the same file the brand's runtime config
 * imports, so bundle ids / versions can never drift between native and JS.
 */
interface NativeIdentity {
  readonly id: string;
  readonly displayName: string;
  readonly app: { readonly bundleId: string; readonly scheme: string; readonly version: string };
  readonly primaryColor: string;
}

const loadBrand = (id: string): NativeIdentity =>
  // Dynamic path by brand id — Expo evaluates this file in Node (CommonJS).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require(`./src/brands/${id}/native.json`) as NativeIdentity;

export default ({ config }: ConfigContext): ExpoConfig => {
  const brand = loadBrand((process.env['EXPO_PUBLIC_BRAND'] as string | undefined) ?? 'main');
  return {
    ...config,
    name: brand.displayName,
    slug: brand.id,
    scheme: brand.app.scheme,
    version: brand.app.version,
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    primaryColor: brand.primaryColor,
    ios: { bundleIdentifier: brand.app.bundleId, supportsTablet: true },
    android: { package: brand.app.bundleId.replace(/-/g, '_') },
    plugins: ['expo-localization', 'expo-secure-store'],
    extra: { brand: brand.id },
  };
};
