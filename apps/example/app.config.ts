import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * White-label native identity. One codebase, many store apps:
 *   EXPO_PUBLIC_BRAND=globex npx expo run:ios
 * Identity comes from brands/<id>/src/native.json — the same file the brand's runtime config
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
  require(`../../brands/${id}/src/native.json`) as NativeIdentity;

export default ({ config }: ConfigContext): ExpoConfig => {
  const brand = loadBrand((process.env['EXPO_PUBLIC_BRAND'] as string | undefined) ?? 'acme');
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
