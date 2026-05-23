import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  adminGetCities,
  adminGetStops,
  adminCreateStop,
  adminUpdateStop,
  adminDeleteStop,
} from '../../api/index.js'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

function StopForm({ initial, cities, onSubmit, onCancel, loading }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', cityId: '', lat: '', lng: '', ...initial })

  const handle = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
      className="bg-navy-700 rounded-xl p-4 space-y-3 mb-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Stop Name *</label>
          <input
            value={form.name}
            onChange={handle('name')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 focus:outline-none focus:border-brand-green text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">City *</label>
          <select
            value={form.cityId}
            onChange={handle('cityId')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 focus:outline-none focus:border-brand-green text-sm"
            required
          >
            <option value="">Select city</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Latitude</label>
          <input
            type="number"
            step="any"
            value={form.lat || ''}
            onChange={handle('lat')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 focus:outline-none focus:border-brand-green text-sm"
            placeholder="9.0000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Longitude</label>
          <input
            type="number"
            step="any"
            value={form.lng || ''}
            onChange={handle('lng')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 focus:outline-none focus:border-brand-green text-sm"
            placeholder="38.7000"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" loading={loading}>{t('admin.save')}</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>{t('admin.cancel')}</Button>
      </div>
    </form>
  )
}

export default function Stops() {
  const { t } = useTranslation()
  const [cities, setCities] = useState([])
  const [filterCityId, setFilterCityId] = useState('')
  const [stops, setStops] = useState([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editStop, setEditStop] = useState(null)

  useEffect(() => {
    adminGetCities().then((r) => setCities(r.data)).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    adminGetStops(filterCityId || undefined)
      .then((r) => setStops(r.data))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterCityId])

  const handleAdd = async (form) => {
    setFormLoading(true)
    try {
      await adminCreateStop({ ...form, cityId: Number(form.cityId), lat: form.lat ? Number(form.lat) : undefined, lng: form.lng ? Number(form.lng) : undefined })
      setShowAdd(false)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create')
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdate = async (form) => {
    setFormLoading(true)
    try {
      await adminUpdateStop(editStop.id, { ...form, cityId: Number(form.cityId) })
      setEditStop(null)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this stop?')) return
    try {
      await adminDeleteStop(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bebas tracking-widest text-white">{t('admin.stops')}</h1>
        <div className="flex gap-2 items-center">
          <select
            value={filterCityId}
            onChange={(e) => setFilterCityId(e.target.value)}
            className="bg-navy-800 text-white rounded-lg px-3 py-1.5 border border-navy-600 text-sm focus:outline-none"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <Button variant="primary" size="sm" onClick={() => { setShowAdd(true); setEditStop(null) }}>
            + {t('admin.add')}
          </Button>
        </div>
      </div>

      {error && <p className="text-brand-red text-sm">{error}</p>}

      {showAdd && !editStop && (
        <StopForm
          initial={{ name: '', cityId: filterCityId, lat: '', lng: '' }}
          cities={cities}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={formLoading}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" className="text-brand-green" /></div>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">City</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Coordinates</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stops.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-500">No stops found</td>
                  </tr>
                ) : (
                  stops.map((stop) =>
                    editStop?.id === stop.id ? (
                      <tr key={stop.id} className="bg-navy-700/40">
                        <td colSpan={4} className="px-4 py-3">
                          <StopForm
                            initial={{ ...editStop, cityId: editStop.cityId?.toString() || '' }}
                            cities={cities}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditStop(null)}
                            loading={formLoading}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr key={stop.id} className="border-b border-navy-700 hover:bg-navy-700/30">
                        <td className="px-4 py-3 text-white font-medium">{stop.name}</td>
                        <td className="px-4 py-3 text-slate-400">{stop.city?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                          {stop.lat && stop.lng ? `${stop.lat}, ${stop.lng}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => { setEditStop(stop); setShowAdd(false) }}>
                              {t('admin.edit')}
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(stop.id)}>
                              {t('admin.delete')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
