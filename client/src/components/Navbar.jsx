import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import { useI18n } from '../context/I18nContext.jsx'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const { language, changeLanguage, supportedLanguages } = useI18n()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setMenuOpen(false)
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <nav className="bg-navy-900 border-b border-navy-700 sticky top-0 z-40">
      <div className="max-w-mobile mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <Link
          to="/"
          className="text-white font-bebas text-2xl tracking-widest hover:text-brand-green transition-colors"
          onClick={() => setMenuOpen(false)}
        >
          TariffCheck
        </Link>

        {/* Desktop right section */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Language switcher */}
          <div className="flex items-center gap-1 bg-navy-700 rounded-lg p-0.5">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={[
                  'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
                  language === lang.code
                    ? 'bg-brand-green text-white'
                    : 'text-slate-400 hover:text-white',
                ].join(' ')}
              >
                {lang.code === 'en' ? 'EN' : 'አማ'}
              </button>
            ))}
          </div>

          {/* Auth links */}
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="text-brand-amber text-sm font-semibold hover:text-yellow-400 transition-colors"
                >
                  {t('nav.admin')}
                </Link>
              )}
              <Link
                to="/submissions"
                className="text-slate-300 text-sm hover:text-white transition-colors"
              >
                {t('nav.mySubmissions')}
              </Link>
              <span className="text-slate-500 text-sm max-w-[140px] truncate">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-400 hover:text-brand-red transition-colors font-semibold"
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="text-sm bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden text-slate-400 hover:text-white p-1 rounded-lg focus:outline-none"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-navy-800 border-t border-navy-700 px-4 py-3 space-y-3">
          {/* Language */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs uppercase tracking-wide">{t('language')}:</span>
            <div className="flex items-center gap-1 bg-navy-700 rounded-lg p-0.5">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { changeLanguage(lang.code); }}
                  className={[
                    'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
                    language === lang.code
                      ? 'bg-brand-green text-white'
                      : 'text-slate-400 hover:text-white',
                  ].join(' ')}
                >
                  {lang.code === 'en' ? 'EN' : 'አማ'}
                </button>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div className="flex flex-col gap-2 pt-1 border-t border-navy-700">
            <Link
              to="/"
              className="text-slate-300 hover:text-white text-sm py-1"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.home')}
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="text-brand-amber text-sm font-semibold py-1"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                <Link
                  to="/submissions"
                  className="text-slate-300 hover:text-white text-sm py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('nav.mySubmissions')}
                </Link>
                <div className="text-slate-500 text-xs truncate">{user.email}</div>
                <button
                  onClick={handleLogout}
                  className="text-left text-sm text-brand-red font-semibold py-1"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white text-sm py-1"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors font-semibold inline-block w-max"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
