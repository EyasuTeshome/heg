import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyTariffs } from '../api/index.js'
import Badge from '../components/ui/Badge.jsx'
import Spinner from '../components/ui/Spinner.jsx'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function Submissions() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [tariffs, setTariffs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { state: { from: { pathname: '/submissions' } } })
      return
    }
    if (user) {
      setLoading(true)
      getMyTariffs()
        .then((res) => setTariffs(res.data))
        .catch(() => setError('Failed to load submissions'))
        .finally(() => setLoading(false))
    }
  }, [user, authLoading, navigate])

  if (authLoading || (!user && !error)) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <Spinner size="lg" className="text-brand-green" />
      </div>
    )
  }

  const getStatusVariant = (status) => {
    if (status === 'APPROVED' || status === 'VERIFIED') return 'approved'
    if (status === 'REJECTED') return 'rejected'
    return 'pending'
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <div className="max-w-mobile mx-auto px-4 py-6">
        <h1 className="text-2xl font-bebas tracking-widest text-white mb-6">
          {t('submissions.title')}
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" className="text-brand-green" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-brand-red text-sm">{error}</p>
          </div>
        ) : tariffs.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-slate-400 text-sm">{t('submissions.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tariffs.map((tariff) => (
              <div
                key={tariff.id}
                className="bg-navy-800 rounded-2xl border border-navy-700 px-4 py-4"
              >
                {/* Route */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {tariff.route?.originStop?.name || '?'} →{' '}
                      {tariff.route?.destinationStop?.name || '?'}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {tariff.vehicleType?.name || 'Unknown vehicle'}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(tariff.status)} />
                </div>

                {/* Fare */}
                <div className="flex items-end gap-1 mb-3">
                  <span className="font-bebas text-3xl text-white leading-none">
                    {parseFloat(tariff.baseFare || 0).toFixed(2)}
                  </span>
                  <span className="text-slate-400 text-sm mb-0.5">ETB</span>
                </div>

                {/* Rejection note */}
                {tariff.status === 'REJECTED' && tariff.rejectionNote && (
                  <div className="bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-red-300">
                      <span className="font-semibold">Rejection note:</span> {tariff.rejectionNote}
                    </p>
                  </div>
                )}

                {/* Date */}
                <p className="text-slate-500 text-xs">
                  {t('submissions.submittedAt')}: {formatDate(tariff.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
