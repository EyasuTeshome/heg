import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import { reportOvercharge } from '../api/index.js'
import Button from './ui/Button.jsx'
import { Link } from 'react-router-dom'

export default function OverchargeButton({ tariff, route }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(Number(amount))) {
      setError('Please enter a valid amount')
      return
    }
    setLoading(true)
    setError('')
    try {
      await reportOvercharge({
        routeId: route?.id,
        tariffId: tariff?.id,
        vehicleTypeId: tariff?.vehicleTypeId,
        amountClaimed: Number(amount),
      })
      setSuccess(true)
      setAmount('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="text-xs text-brand-amber hover:underline font-semibold"
      >
        {t('fare.overcharged')}
      </Link>
    )
  }

  return (
    <div>
      {!open ? (
        <button
          onClick={() => { setOpen(true); setSuccess(false); setError('') }}
          className="text-xs text-brand-amber hover:text-yellow-400 font-semibold transition-colors underline underline-offset-2"
        >
          {t('fare.overcharged')}
        </button>
      ) : (
        <div className="mt-2 p-3 bg-navy-900 rounded-xl border border-amber-700/40">
          {success ? (
            <div className="text-brand-green text-sm font-semibold text-center py-1">
              {t('overcharge.success')}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <p className="text-xs font-semibold text-brand-amber">{t('overcharge.title')}</p>
              <input
                type="number"
                min="0"
                step="0.5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('overcharge.amountClaimed')}
                className="w-full bg-navy-700 text-white text-sm rounded-lg px-3 py-2 border border-navy-600 focus:outline-none focus:border-brand-amber placeholder-slate-500"
              />
              {error && <p className="text-brand-red text-xs">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" variant="amber" size="sm" loading={loading}>
                  {t('overcharge.submit')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setOpen(false); setError('') }}
                >
                  {t('admin.cancel')}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
