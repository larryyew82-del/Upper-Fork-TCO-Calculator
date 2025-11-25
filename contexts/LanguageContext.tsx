
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from '../translations';

type Language = 'en' | 'zh';

// Define a type for the translation object to allow for nested keys
type TranslationObject = { [key: string]: string | TranslationObject };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children?: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    const keys = key.split('.');
    
    const findTranslation = (lang: Language): string | undefined => {
        let result: string | TranslationObject = translations[lang];
        for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                return undefined;
            }
        }
        return result as string;
    };

    const translation = findTranslation(language);
    if (translation !== undefined) {
        return translation;
    }

    // Fallback to English if the translation is missing in the current language
    const fallbackTranslation = findTranslation('en');
    if (fallbackTranslation !== undefined) {
        return fallbackTranslation;
    }

    // Return the key itself if not found in English either
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
