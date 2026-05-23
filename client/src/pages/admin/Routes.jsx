import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  adminGetCities,
  adminGetStops,
  adminGetRoutes,
  adminCreateRoute,
  adminUpdateRoute,
  adminDeleteRoute,
} from '../../api/index.js'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

function RouteForm({ initial, cities, stops, onSubmit, onCancel, loading, onCityChange }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    cityId: '',
    originStopId: '',
    destinationStopId: '',
    distanceKm: '',
    ...initial,
  })

  const handle = (f) => (e) => {
    const val = e.target.value
    setForm((p) => ({ ...p, [f]: val }))
    if (f === 'cityId') onCityChange(val)
  }

  const filteredStops = stops.filter((s) => s.cityId?.toString() === form.cityId?.toString())

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
      className="bg-navy-700 rounded-xl p-4 space-y-3 mb-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-slate-300 mb-1">City *</label>
          <select
            value={form.cityId}
            onChange={handle('cityId')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none focus:border-brand-green"
            required
          >
            <option value="">Select city</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Origin Stop *</label>
          <select
            value={form.originStopId}
            onChange={handle('originStopId')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none focus:border-brand-green"
            required
          >
            <option value="">Select origin</option>
            {filteredStops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Destination Stop *</label>
          <select
            value={form.destinationStopId}
            onChange={handle('destinationStopId')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none focus:border-brand-green"
            required
          >
            <option value="">Select destination</option>
            {filteredStops
              .filter((s) => s.id?.toString() !== form.originStopId?.toString())
              .map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Distance (km)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.distanceKm || ''}
            onChange={handle('distanceKm')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none focus:border-brand-green"
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

export default function Routes() {
  const { t } = useTranslation()
  const [cities, setCities] = useState([])
  const [allStops, setAllStops] = useState([])
  const [filterCityId, setFilterCityId] = useState('')
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editRoute, setEditRoute] = useState(null)

  useEffect(() => {
    adminGetCities().then((r) => setCities(r.data)).catch(() => {})
    adminGetStops().then((r) => setAllStops(r.data)).catch(() => {})
  }, [])

  const loadStopsForCity = (cityId) => {
    if (!cityId) return
    adminGetStops(cityId).then((r) => {
      setAllStops((prev) => {
        const ids = new Set(r.data.map((s) => s.id))
        return [...prev.filter((s) => !ids.has(s.id)), ...r.data]
      })
    }).catch(() => {})
  }

  const load = () => {
    setLoading(true)
    adminGetRoutes(filterCityId || undefined)
      .then((r) => setRoutes(r.data))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filterCityId])

  const handleAdd = async (form) => {
    setFormLoading(true)
    try {
      await adminCreateRoute({
        cityId: Number(form.cityId),
        originStopId: Number(form.originStopId),
        destinationStopId: Number(form.destinationStopId),
        distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
      })
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
      await adminUpdateRoute(editRoute.id, {
        cityId: Number(form.cityId),
        originStopId: Number(form.originStopId),
        destinationStopId: Number(form.destinationStopId),
        distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
      })
      setEditRoute(null)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this route?')) return
    try {
      await adminDeleteRoute(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bebas tracking-widest text-white">{t('admin.routes')}</h1>
        <div className="flex gap-2 items-center">
          <select
            value={filterCityId}
            onChange={(e) => setFilterCityId(e.target.value)}
            className="bg-navy-800 text-white rounded-lg px-3 py-1.5 border border-navy-600 text-sm focus:outline-none"
          >
            <option value="">All Cities</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Button variant="primary" size="sm" onClick={() => { setShowAdd(true); setEditRoute(null) }}>
            + {t('admin.add')}
          </Button>
        </div>
      </div>

      {error && <p className="text-brand-red text-sm">{error}</p>}

      {showAdd && !editRoute && (
        <RouteForm
          initial={{ cityId: filterCityId, originStopId: '', destinationStopId: '', distanceKm: '' }}
          cities={cities}
          stops={allStops}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={formLoading}
          onCityChange={loadStopsForCity}
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
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Route</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">City</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Distance</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {routes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-500">No routes found</td>
                  </tr>
                ) : (
                  routes.map((route) =>
                    editRoute?.id === route.id ? (
                      <tr key={route.id} className="bg-navy-700/40">
                        <td colSpan={4} className="px-4 py-3">
                          <RouteForm
                            initial={{
                              cityId: route.cityId?.toString() || '',
                              originStopId: route.originStopId?.toString() || '',
                              destinationStopId: route.destinationStopId?.toString() || '',
                              distanceKm: route.distanceKm || '',
                            }}
                            cities={cities}
                            stops={allStops}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditRoute(null)}
                            loading={formLoading}
                            onCityChange={loadStopsForCity}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr key={route.id} className="border-b border-navy-700 hover:bg-navy-700/30">
                        <td className="px-4 py-3 text-white font-medium">
                          {route.originStop?.name} → {route.destinationStop?.name}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{route.city?.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {route.distanceKm ? `${route.distanceKm} km` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => { setEditRoute(route); setShowAdd(false) }}>
                              {t('admin.edit')}
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(route.id)}>
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
