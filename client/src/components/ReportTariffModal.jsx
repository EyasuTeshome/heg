import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { reportTariff } from '../api/index.js'
import Modal from './ui/Modal.jsx'
import Button from './ui/Button.jsx'

export default function ReportTariffModal({ isOpen, onClose, tariff }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setReason('')
    setSuccess(false)
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a reason')
      return
    }
    setLoading(true)
    setError('')
    try {
      await reportTariff(tariff.id, { reason })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('report.title')}>
      {!user ? (
        <div className="text-center py-6 space-y-3">
          <p className="text-slate-400 text-sm">{t('submit.loginRequired')}</p>
          <Link
            to="/login"
            onClick={handleClose}
            className="inline-block bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors"
          >
            {t('auth.login')}
          </Link>
        </div>
      ) : success ? (
        <div className="text-center py-6 space-y-3">
          <div className="text-4xl">✓</div>
          <p className="text-brand-green font-semibold">{t('report.success')}</p>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {tariff && (
            <div className="bg-navy-900 rounded-lg px-3 py-2 text-sm text-slate-400">
              Tariff #{tariff.id} — {tariff.vehicleType?.name || 'Unknown vehicle'}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('report.reason')}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full bg-navy-900 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green resize-none text-sm placeholder-slate-500"
              placeholder={t('report.reason')}
              required
            />
          </div>
          {error && <p className="text-brand-red text-sm">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" variant="primary" loading={loading} className="flex-1">
              {t('report.submit')}
            </Button>
            <Button type="button" variant="ghost" onClick={handleClose}>
              {t('admin.cancel')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
