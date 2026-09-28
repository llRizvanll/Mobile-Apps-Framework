/**
 * Build-time environment. Literal `process.env.EXPO_PUBLIC_*` access is required: Expo inlines these
 * at build time. See `.env.example` and docs/configuration.md.
 */
export interface AppEnv {
  /** Brand id from src/brands (default `main`). */
  readonly brand: string;
  /** development | staging | production (default development). */
  readonly environment: string;
  /** `mock` = in-process fake API, `live` = brand endpoints. */
  readonly apiMode: 'mock' | 'live';
  /** Flag overrides, e.g. `assistant=off,todos.showCompleted=off`. */
  readonly features: string | undefined;
}

const read = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined;

export const appEnv: AppEnv = {
  brand: read(process.env.EXPO_PUBLIC_BRAND) ?? 'main',
  environment: read(process.env.EXPO_PUBLIC_ENV) ?? 'development',
  apiMode: read(process.env.EXPO_PUBLIC_API_MODE) === 'live' ? 'live' : 'mock',
  features: read(process.env.EXPO_PUBLIC_FEATURES),
};
