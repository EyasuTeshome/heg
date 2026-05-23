import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import am from './am.json'

const savedLang = localStorage.getItem('tariffcheck_lang') || 'en'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
    },
    lng: savedLang,
    fallbackLng: 'en',
    supportedLngs: ['en', 'am'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
