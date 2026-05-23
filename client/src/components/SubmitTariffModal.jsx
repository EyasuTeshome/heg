import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { submitTariff, adminGetVehicleTypes } from '../api/index.js'
import Modal from './ui/Modal.jsx'
import Button from './ui/Button.jsx'

export default function SubmitTariffModal({ isOpen, onClose, route }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [vehicleTypes, setVehicleTypes] = useState([])
  const [form, setForm] = useState({
    vehicleTypeId: '',
    baseFare: '',
    nightFare: '',
    peakFare: '',
    effectiveDate: '',
    sourceUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && user) {
      adminGetVehicleTypes()
        .then((res) => setVehicleTypes(res.data))
        .catch(() => setVehicleTypes([]))
    }
  }, [isOpen, user])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleClose = () => {
    setForm({ vehicleTypeId: '', baseFare: '', nightFare: '', peakFare: '', effectiveDate: '', sourceUrl: '' })
    setSuccess(false)
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.vehicleTypeId || !form.baseFare || !form.effectiveDate) {
      setError('Vehicle type, base fare, and effective date are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      await submitTariff({
        routeId: route?.id,
        vehicleTypeId: Number(form.vehicleTypeId),
        baseFare: Number(form.baseFare),
        nightFare: form.nightFare ? Number(form.nightFare) : undefined,
        peakFare: form.peakFare ? Number(form.peakFare) : undefined,
        effectiveDate: form.effectiveDate,
        sourceUrl: form.sourceUrl || undefined,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit tariff')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('submit.title')}>
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
          <p className="text-brand-green font-semibold">{t('submit.success')}</p>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {route && (
            <div className="bg-navy-900 rounded-lg px-3 py-2 text-sm text-slate-400">
              {route.originStop?.name} → {route.destinationStop?.name}
            </div>
          )}

          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('submit.vehicleType')} <span className="text-brand-red">*</span>
            </label>
            <select
              value={form.vehicleTypeId}
              onChange={handleChange('vehicleTypeId')}
              className="w-full bg-navy-900 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm"
              required
            >
              <option value="">{t('home.selectCity')}</option>
              {vehicleTypes.map((vt) => (
                <option key={vt.id} value={vt.id}>{vt.name}</option>
              ))}
            </select>
          </div>

          {/* Base Fare */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('submit.baseFare')} <span className="text-brand-red">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.baseFare}
              onChange={handleChange('baseFare')}
              className="w-full bg-navy-900 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm placeholder-slate-500"
              placeholder="e.g. 5.50"
              required
            />
          </div>

          {/* Night Fare */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('submit.nightFare')}
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.nightFare}
              onChange={handleChange('nightFare')}
              className="w-full bg-navy-900 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm placeholder-slate-500"
              placeholder="Optional"
            />
          </div>

          {/* Peak Fare */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('submit.peakFare')}
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.peakFare}
              onChange={handleChange('peakFare')}
              className="w-full bg-navy-900 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm placeholder-slate-500"
              placeholder="Optional"
            />
          </div>

          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('submit.effectiveDate')} <span className="text-brand-red">*</span>
            </label>
            <input
              type="date"
              value={form.effectiveDate}
              onChange={handleChange('effectiveDate')}
              className="w-full bg-navy-900 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm"
              required
            />
          </div>

          {/* Source URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('submit.sourceUrl')}
            </label>
            <input
              type="url"
              value={form.sourceUrl}
              onChange={handleChange('sourceUrl')}
              className="w-full bg-navy-900 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm placeholder-slate-500"
              placeholder="https://..."
            />
          </div>

          {error && <p className="text-brand-red text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="submit" variant="primary" loading={loading} className="flex-1">
              {t('submit.submitBtn')}
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
