import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/ui/Button.jsx'

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center px-4">
      <div className="w-full max-w-mobile">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bebas tracking-widest text-white mb-1">TariffCheck</h1>
          <p className="text-slate-400 text-sm">{t('auth.registerTitle')}</p>
        </div>

        <div className="bg-navy-800 rounded-2xl border border-navy-700 p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full bg-navy-900 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm placeholder-slate-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-navy-900 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm placeholder-slate-500"
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
              <p className="text-slate-500 text-xs mt-1">At least 8 characters</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3">
                <p className="text-brand-red text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              {t('auth.register')}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-400">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-brand-green hover:underline font-semibold">
              {t('auth.signIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
