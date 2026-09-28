import main from '@brands/main';
import type { BrandDefinition } from '@framework/core';

/** Brands this binary can be built as (EXPO_PUBLIC_BRAND). `npm run gen:brand` registers new ones here. */
export const brands = { main } satisfies Record<string, BrandDefinition>;
export type BrandId = keyof typeof brands;

export const isBrandId = (id: string): id is BrandId => id in brands;
