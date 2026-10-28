/**
 * SmartEducate Internationalization (i18n) Foundation Types
 */

export type SupportedLanguage = 'en' | 'so' | 'ar' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'tr' | 'zh';
export type TextDirection = 'ltr' | 'rtl';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;        // Name in English
  nativeName: string;  // Name in native script
  direction: TextDirection;
  flagSymbol: string;
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flagSymbol: 'GB',
  },
  so: {
    code: 'so',
    name: 'Somali',
    nativeName: 'Af-Soomaali',
    direction: 'ltr',
    flagSymbol: 'SO',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    flagSymbol: 'AR',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    flagSymbol: 'FR',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    flagSymbol: 'ES',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    flagSymbol: 'DE',
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    direction: 'ltr',
    flagSymbol: 'IT',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    flagSymbol: 'PT',
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    direction: 'ltr',
    flagSymbol: 'TR',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    flagSymbol: 'CN',
  },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const isRTL = (lang: SupportedLanguage): boolean => {
  return SUPPORTED_LANGUAGES[lang].direction === 'rtl';
};
