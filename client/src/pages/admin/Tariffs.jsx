import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  adminGetTariffs,
  adminUpdateTariff,
  adminDeleteTariff,
  adminCreateTariff,
  adminGetCities,
  adminGetRoutes,
  adminGetVehicleTypes,
} from '../../api/index.js'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'
import Modal from '../../components/ui/Modal.jsx'

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString() } catch { return d }
}

function AddTariffForm({ onSubmit, onCancel, loading }) {
  const { t } = useTranslation()
  const [cities, setCities] = useState([])
  const [routes, setRoutes] = useState([])
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [form, setForm] = useState({
    cityId: '', routeId: '', vehicleTypeId: '',
    baseFare: '', nightFare: '', peakFare: '',
    effectiveDate: '', sourceUrl: '',
  })

  useEffect(() => {
    adminGetCities().then((r) => setCities(r.data)).catch(() => {})
    adminGetVehicleTypes().then((r) => setVehicleTypes(r.data)).catch(() => {})
  }, [])

  const handle = (f) => (e) => {
    const val = e.target.value
    setForm((p) => ({ ...p, [f]: val }))
    if (f === 'cityId') {
      setForm((p) => ({ ...p, cityId: val, routeId: '' }))
      adminGetRoutes(val).then((r) => setRoutes(r.data)).catch(() => setRoutes([]))
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">City *</label>
          <select value={form.cityId} onChange={handle('cityId')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none" required>
            <option value="">Select city</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Route *</label>
          <select value={form.routeId} onChange={handle('routeId')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none" required>
            <option value="">Select route</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.originStop?.name} → {r.destinationStop?.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Vehicle Type *</label>
          <select value={form.vehicleTypeId} onChange={handle('vehicleTypeId')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none" required>
            <option value="">Select type</option>
            {vehicleTypes.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Base Fare *</label>
          <input type="number" min="0" step="0.5" value={form.baseFare} onChange={handle('baseFare')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Night Fare</label>
          <input type="number" min="0" step="0.5" value={form.nightFare} onChange={handle('nightFare')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Peak Fare</label>
          <input type="number" min="0" step="0.5" value={form.peakFare} onChange={handle('peakFare')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Effective Date *</label>
          <input type="date" value={form.effectiveDate} onChange={handle('effectiveDate')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Source URL</label>
          <input type="url" value={form.sourceUrl} onChange={handle('sourceUrl')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" loading={loading}>{t('admin.save')}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>{t('admin.cancel')}</Button>
      </div>
    </form>
  )
}

export default function Tariffs() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('pending')
  const [tariffs, setTariffs] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [error, setError] = useState('')
  const [rejectId, setRejectId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)

  const load = () => {
    setLoading(true)
    const status = tab === 'pending' ? 'PENDING' : (filterStatus || undefined)
    adminGetTariffs(status)
      .then((r) => setTariffs(Array.isArray(r.data) ? r.data : []))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab, filterStatus])

  const handleApprove = async (id) => {
    setActionLoading((p) => ({ ...p, [id]: 'approve' }))
    try {
      await adminUpdateTariff(id, { status: 'APPROVED' })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve')
    } finally {
      setActionLoading((p) => ({ ...p, [id]: null }))
    }
  }

  const handleRejectSubmit = async () => {
    if (!rejectId) return
    setActionLoading((p) => ({ ...p, [rejectId]: 'reject' }))
    try {
      await adminUpdateTariff(rejectId, { status: 'REJECTED', rejectionNote: rejectNote })
      setRejectId(null)
      setRejectNote('')
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject')
    } finally {
      setActionLoading((p) => ({ ...p, [rejectId]: null }))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tariff?')) return
    try {
      await adminDeleteTariff(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    }
  }

  const handleAddTariff = async (form) => {
    setAddLoading(true)
    try {
      await adminCreateTariff({
        routeId: Number(form.routeId),
        vehicleTypeId: Number(form.vehicleTypeId),
        baseFare: Number(form.baseFare),
        nightFare: form.nightFare ? Number(form.nightFare) : undefined,
        peakFare: form.peakFare ? Number(form.peakFare) : undefined,
        effectiveDate: form.effectiveDate,
        sourceUrl: form.sourceUrl || undefined,
        status: 'APPROVED',
      })
      setShowAdd(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tariff')
    } finally {
      setAddLoading(false)
    }
  }

  const getStatusVariant = (s) => {
    if (s === 'APPROVED' || s === 'VERIFIED') return 'approved'
    if (s === 'REJECTED') return 'rejected'
    return 'pending'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bebas tracking-widest text-white">{t('admin.tariffs')}</h1>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
          + {t('admin.add')}
        </Button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-navy-800 rounded-xl p-1 w-fit border border-navy-700">
        {['pending', 'all'].map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={[
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors',
              tab === tabKey ? 'bg-brand-green text-white' : 'text-slate-400 hover:text-white',
            ].join(' ')}
          >
            {tabKey === 'pending' ? 'Pending Review' : 'All Tariffs'}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-navy-800 text-white rounded-lg px-3 py-1.5 border border-navy-600 text-sm focus:outline-none"
          >
            <option value="">All statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      )}

      {error && <p className="text-brand-red text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" className="text-brand-green" /></div>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Route</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Vehicle</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Base</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tariffs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      {tab === 'pending' ? 'No pending tariffs' : 'No tariffs found'}
                    </td>
                  </tr>
                ) : (
                  tariffs.map((tariff) => (
                    <tr key={tariff.id} className="border-b border-navy-700 hover:bg-navy-700/20">
                      <td className="px-4 py-3 text-white text-sm">
                        {tariff.route?.originStop?.name || '?'} → {tariff.route?.destinationStop?.name || '?'}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{tariff.vehicleType?.name || '—'}</td>
                      <td className="px-4 py-3 text-right font-bebas text-lg text-white">
                        {tariff.baseFare?.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(tariff.effectiveDate)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusVariant(tariff.status)} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {tariff.status === 'PENDING' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                loading={actionLoading[tariff.id] === 'approve'}
                                onClick={() => handleApprove(tariff.id)}
                              >
                                {t('admin.approve')}
                              </Button>
                              <Button
                                variant="amber"
                                size="sm"
                                loading={actionLoading[tariff.id] === 'reject'}
                                onClick={() => { setRejectId(tariff.id); setRejectNote('') }}
                              >
                                {t('admin.reject')}
                              </Button>
                            </>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(tariff.id)}
                          >
                            {t('admin.delete')}
                          </Button>
                        </div>
                        {/* Inline rejection form */}
                        {rejectId === tariff.id && (
                          <div className="mt-2 space-y-1.5">
                            <textarea
                              value={rejectNote}
                              onChange={(e) => setRejectNote(e.target.value)}
                              rows={2}
                              placeholder="Rejection reason..."
                              className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-amber-700 text-xs resize-none focus:outline-none"
                            />
                            <div className="flex gap-1.5">
                              <Button
                                variant="amber"
                                size="sm"
                                loading={actionLoading[tariff.id] === 'reject'}
                                onClick={handleRejectSubmit}
                              >
                                Confirm Reject
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRejectId(null)}
                              >
                                {t('admin.cancel')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Tariff Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Verified Tariff">
        <AddTariffForm
          onSubmit={handleAddTariff}
          onCancel={() => setShowAdd(false)}
          loading={addLoading}
        />
      </Modal>
    </div>
  )
}
