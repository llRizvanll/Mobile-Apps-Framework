/** A translation tree. Leaves are strings or plural forms keyed by `Intl.PluralRules` category. */
export type PluralForms = { readonly other: string } & Partial<
  Record<'zero' | 'one' | 'two' | 'few' | 'many', string>
>;
export type TranslationLeaf = string | PluralForms;
export interface TranslationTree {
  readonly [key: string]: TranslationLeaf | TranslationTree;
}

type IsPlural<T> = T extends { other: string } ? true : false;
type Join<K extends string, P extends string> = `${K}.${P}`;
export type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : IsPlural<T[K]> extends true
      ? K
      : Join<K, LeafPaths<T[K]>>;
}[keyof T & string];

/** Untyped key used at package boundaries (framework components accept any key). */
export type TranslationKey = string;

/**
 * Compile-time checked keys for a resource tree. Apps opt in locally (no global augmentation, so
 * multiple apps/brands in one monorepo never conflict):
 *   const { t } = useTranslation<typeof en>();  t('todos.empty.title') // ✓ checked
 */
export type TranslationKeyOf<R> = [R] extends [never] ? TranslationKey : LeafPaths<R>;

export type TranslateParams = Readonly<Record<string, string | number | Date>> & {
  readonly count?: number;
};

export type Direction = 'ltr' | 'rtl';
