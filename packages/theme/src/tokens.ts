/** Semantic colors — components use these, never raw hex values. */
export interface ColorTokens {
  readonly primary: string;
  readonly onPrimary: string;
  readonly primaryContainer: string;
  readonly onPrimaryContainer: string;
  readonly secondary: string;
  readonly onSecondary: string;
  readonly background: string;
  readonly onBackground: string;
  readonly surface: string;
  readonly surfaceVariant: string;
  readonly onSurface: string;
  readonly onSurfaceMuted: string;
  readonly border: string;
  readonly divider: string;
  readonly danger: string;
  readonly onDanger: string;
  readonly success: string;
  readonly warning: string;
  readonly info: string;
  readonly overlay: string;
  readonly focus: string;
}

export type FontWeight = '400' | '500' | '600' | '700' | '800';

export interface TextStyleToken {
  readonly fontFamily?: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: FontWeight;
  readonly letterSpacing?: number;
}

export type TypographyVariant =
  'display' | 'headline' | 'title' | 'body' | 'bodyStrong' | 'label' | 'caption';

export const spacingScale = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;
export type SpacingToken = keyof typeof spacingScale;

export interface ShadowToken {
  readonly shadowColor: string;
  readonly shadowOpacity: number;
  readonly shadowRadius: number;
  readonly shadowOffset: { readonly width: number; readonly height: number };
  readonly elevation: number;
}

/**
 * Component-level tokens. Brands tweak component look without forking components.
 * Extend via declaration merging for custom components.
 */
export interface ComponentTokens {
  readonly button: {
    readonly radius: RadiusToken;
    readonly height: { readonly sm: number; readonly md: number; readonly lg: number };
  };
  readonly input: {
    readonly radius: RadiusToken;
    readonly height: number;
    readonly borderWidth: number;
  };
  readonly card: {
    readonly radius: RadiusToken;
    readonly padding: SpacingToken;
    readonly elevation: ElevationToken;
  };
}

export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'pill';
export type ElevationToken = 'none' | 'sm' | 'md' | 'lg';

/** Scheme-independent tokens shared by light and dark. */
export interface BaseTokens {
  readonly spacing: Readonly<Record<SpacingToken, number>>;
  readonly radii: Readonly<Record<RadiusToken, number>>;
  readonly typography: Readonly<Record<TypographyVariant, TextStyleToken>>;
  readonly fonts: { readonly regular?: string; readonly medium?: string; readonly bold?: string };
  readonly elevation: Readonly<Record<ElevationToken, ShadowToken>>;
  readonly motion: { readonly fast: number; readonly normal: number; readonly slow: number };
  readonly opacity: { readonly disabled: number; readonly pressed: number };
  readonly sizes: {
    readonly touchTarget: number;
    readonly iconSm: number;
    readonly iconMd: number;
    readonly iconLg: number;
  };
  readonly components: ComponentTokens;
}

/** What a brand defines: base tokens + a palette for each scheme. */
export interface BrandTheme extends BaseTokens {
  readonly name: string;
  readonly colors: { readonly light: ColorTokens; readonly dark: ColorTokens };
}

export type ColorScheme = 'light' | 'dark';

/** What components consume: a brand theme resolved for one scheme. */
export interface Theme extends BaseTokens {
  readonly name: string;
  readonly scheme: ColorScheme;
  readonly isDark: boolean;
  readonly colors: ColorTokens;
}
