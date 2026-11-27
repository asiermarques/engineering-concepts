import { describe, expect, it } from 'vitest';
import { locales, ui, otherLocale } from './ui';

describe('interface strings', () => {
  it('have the same keys in every locale', () => {
    const [first, ...rest] = locales;
    for (const locale of rest) {
      expect(Object.keys(ui[locale]).sort()).toEqual(Object.keys(ui[first!]).sort());
    }
  });

  it('have the same simulator labels in every locale', () => {
    const [first, ...rest] = locales;
    for (const locale of rest) {
      expect(Object.keys(ui[locale].simulator).sort()).toEqual(Object.keys(ui[first!].simulator).sort());
    }
  });

  it('never use banned aliases for the Result', () => {
    const text = JSON.stringify(ui).toLowerCase();
    expect(text).not.toMatch(/puntuaci|score|\bxp\b/);
  });

  it('computes the other locale', () => {
    expect(otherLocale('en')).toBe('es');
    expect(otherLocale('es')).toBe('en');
  });
});
