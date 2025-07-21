import { createI18nInstance } from '../src/i18n.js';

export default async function onBeforeRender(pageContext) {
    const { locale } = pageContext;
    if (!locale) return {};

    const i18n = await createI18nInstance(locale);
    const initialI18nStore = {};
    initialI18nStore[locale] = i18n.getResourceBundle(locale, 'translation');

    return {
        pageContext: {
            i18n,
            initialI18nStore
        }
    };
}