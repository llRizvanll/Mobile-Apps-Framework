import { z } from 'zod';

export const environmentSchema = z.enum(['development', 'staging', 'production']);
export type Environment = z.infer<typeof environmentSchema>;

const slug = z.string().regex(/^[a-z][a-z0-9-]*$/, 'lowercase letters, digits and dashes');

/**
 * Runtime brand configuration: pure, JSON-serialisable data (so it can also be served remotely).
 * Code-level customisation (theme, components, translations, modules) lives in `BrandDefinition`.
 */
export const brandConfigSchema = z.object({
  id: slug,
  displayName: z.string().min(1),
  environment: environmentSchema,
  app: z.object({
    bundleId: z.string().regex(/^[a-zA-Z][\w-]*(\.[a-zA-Z][\w-]*)+$/, 'reverse-DNS id'),
    scheme: slug,
    version: z.string().default('0.0.0'),
  }),
  api: z.object({
    rest: z.object({ baseUrl: z.url(), timeoutMs: z.number().int().positive().default(30_000) }),
    graphql: z.object({ url: z.url(), wsUrl: z.url().optional() }).optional(),
    websocket: z.object({ url: z.url() }).optional(),
    /** Extra static headers for every request (API keys that are *public*, tenant ids). */
    headers: z.record(z.string(), z.string()).default({}),
  }),
  i18n: z
    .object({
      defaultLocale: z.string(),
      supportedLocales: z.array(z.string()).min(1),
      fallbackLocale: z.string().optional(),
    })
    .refine(
      (v) => v.supportedLocales.includes(v.defaultLocale),
      'defaultLocale must be in supportedLocales',
    ),
  features: z.record(z.string(), z.boolean()).default({}),
  observability: z
    .object({
      logLevel: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
      analyticsEnabled: z.boolean().default(true),
      /** When true, analytics stays off until the user grants consent (GDPR). */
      requireConsent: z.boolean().default(false),
    })
    .prefault({}),
  ai: z
    .object({
      enabled: z.boolean().default(false),
      path: z.string().default('/ai/chat'),
      streamUrl: z.url().optional(),
      defaultModel: z.string().default('balanced'),
    })
    .prefault({}),
  storage: z
    .object({ namespace: slug.optional(), persistKey: z.string().default('state') })
    .prefault({}),
  /** Free-form brand-specific settings, validated by the modules that read them. */
  extra: z.record(z.string(), z.unknown()).default({}),
});

export type BrandConfig = Readonly<z.output<typeof brandConfigSchema>>;
export type BrandConfigInput = z.input<typeof brandConfigSchema>;
