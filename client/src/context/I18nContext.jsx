import { createContext, useContext, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

const I18nContext = createContext(null)

const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'am', name: 'አማርኛ' },
]

export function I18nProvider({ children }) {
  const { i18n } = useTranslation()
  const [language, setLanguage] = useState(
    localStorage.getItem('tariffcheck_lang') || 'en'
  )

  const changeLanguage = useCallback(
    (lang) => {
      i18n.changeLanguage(lang)
      setLanguage(lang)
      localStorage.setItem('tariffcheck_lang', lang)
    },
    [i18n]
  )

  return (
    <I18nContext.Provider value={{ language, changeLanguage, supportedLanguages }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export default I18nContext
