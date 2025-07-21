import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationEN from './locales/en.json';
import translationES from './locales/es.json';
import translationJA from './locales/ja.json';
import translationKO from './locales/ko.json';
import translationVI from './locales/vi.json';
import translationRU from './locales/ru.json';

export const locales = ['en', 'es', 'ja', 'ko', 'ru', 'vi'];
export const defaultLocale = 'en';

const resources = {
  en: { translation: translationEN },
  ru: { translation: translationRU },
  es: { translation: translationES },
  ko: { translation: translationKO },
  vi: { translation: translationVI },
  ja: { translation: translationJA },
};

export const createI18nInstance = async (locale) => {
  const instance = i18n.createInstance();
  await instance.use(initReactI18next).init({
    lng: locale,
    resources,
    fallbackLng: defaultLocale,
    supportedLngs: locales,
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });
  return instance;
};
