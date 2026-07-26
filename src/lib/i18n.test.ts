import { describe, expect, it } from 'vitest';
import { LANGUAGES, TRANSLATION_KEYS, asLanguage, translate } from './i18n';
import { PRESETS } from './presets';
import { newRule, ruleProblem } from './rule';

describe('translate', () => {
  it('returns the string for the language asked for', () => {
    expect(translate('ru', 'nav.rules')).toBe('Правила');
    expect(translate('en', 'nav.rules')).toBe('Rules');
  });

  it('substitutes placeholders', () => {
    expect(translate('en', 'toast.imported', { count: 3 })).toBe('Imported 3 rules');
    expect(translate('ru', 'toast.imported', { count: 3 })).toBe('Загружено правил: 3');
  });

  it('leaves an unsupplied placeholder visible rather than printing undefined', () => {
    expect(translate('en', 'toast.imported')).toContain('{count}');
  });
});

describe('asLanguage', () => {
  it('defaults to Russian and only accepts what exists', () => {
    expect(asLanguage('ru')).toBe('ru');
    expect(asLanguage('en')).toBe('en');
    expect(asLanguage('fr')).toBe('ru');
    expect(asLanguage(undefined)).toBe('ru');
    expect(asLanguage(null)).toBe('ru');
  });
});

describe('dictionaries', () => {
  it('offers every language it can translate', () => {
    for (const { value } of LANGUAGES) {
      expect(translate(value, 'nav.settings')).not.toBe('nav.settings');
    }
  });

  it('translates every key in both languages', () => {
    // Catches a key that exists but was left as an empty string, and a key that
    // falls through to itself. The typed `en` dictionary already catches a
    // missing key at compile time; this covers the rest.
    for (const key of TRANSLATION_KEYS) {
      for (const language of ['ru', 'en'] as const) {
        const value = translate(language, key);
        expect(value, `${language}:${key}`).not.toBe(key);
        expect(value.trim(), `${language}:${key}`).not.toBe('');
      }
    }
  });

  it('uses the same placeholders in both languages', () => {
    const placeholders = (text: string) => (text.match(/\{(\w+)\}/g) ?? []).sort().join(',');

    for (const key of TRANSLATION_KEYS) {
      expect(placeholders(translate('en', key)), key).toBe(placeholders(translate('ru', key)));
    }
  });
});

describe('presets', () => {
  it('are all valid rules, in both languages', () => {
    for (const language of ['ru', 'en'] as const) {
      for (const preset of PRESETS) {
        const name = translate(language, preset.nameKey);
        expect(name).not.toBe(preset.nameKey);
        expect(translate(language, preset.descKey)).not.toBe(preset.descKey);

        const rule = { ...newRule(0), name, ...preset.build() };
        expect(ruleProblem(rule)).toBeNull();
      }
    }
  });

  it('have distinct ids', () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
