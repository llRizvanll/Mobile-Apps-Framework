import acme from '@brands/acme';
import globex from '@brands/globex';
import type { BrandDefinition } from '@org/core';

/** Brands this binary can be built as. `npm run gen:brand` registers new ones here. */
export const brands = { acme, globex } satisfies Record<string, BrandDefinition>;
export type BrandId = keyof typeof brands;

export const isBrandId = (id: string): id is BrandId => id in brands;
