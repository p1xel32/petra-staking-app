import enTranslations from './en.json';
import ruTranslations from './ru.json';
import jaTranslations from './ja.json'; 
import koTranslations from './ko.json'; 
import viTranslations from './vi.json';
import esTranslations from './es.json';


const translations = {
  en: enTranslations,
  ru: ruTranslations,
  ja: jaTranslations,
  ko: koTranslations,
  vi: viTranslations,
  es: esTranslations,
};

export const getTranslations = (locale: string) => {
  if (locale && translations[locale]) {
    return translations[locale];
  }
  return translations.en;
};