/**
 * SmartEducate Internationalization Context & Hook
 * Canonical context for multi-language and RTL direction handling.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { DEFAULT_LANGUAGE, isRTL, SupportedLanguage, TextDirection, SUPPORTED_LANGUAGES } from '../types/i18n';
import { TRANSLATIONS } from './translations';

interface I18nContextType {
  language: SupportedLanguage;
  direction: TextDirection;
  isRTL: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const STORAGE_LANG_KEY = 'smarteducate_language';

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved && saved in SUPPORTED_LANGUAGES) {
        return saved as SupportedLanguage;
      }
    } catch {
      // Fallback if storage access is restricted
    }
    return DEFAULT_LANGUAGE;
  });

  const direction: TextDirection = useMemo(() => {
    return isRTL(language) ? 'rtl' : 'ltr';
  }, [language]);

  // Synchronize HTML element attributes with active language & direction
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = direction;
    }
    try {
      localStorage.setItem(STORAGE_LANG_KEY, language);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [language, direction]);

  const setLanguage = (newLang: SupportedLanguage) => {
    if (newLang in SUPPORTED_LANGUAGES) {
      setLanguageState(newLang);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    let text = langDict[key] || TRANSLATIONS.en[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }

    return text;
  };

  const value = useMemo(
    () => ({
      language,
      direction,
      isRTL: direction === 'rtl',
      setLanguage,
      t,
    }),
    [language, direction]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
