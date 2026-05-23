import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  adminGetCities,
  adminCreateCity,
  adminUpdateCity,
  adminDeleteCity,
} from '../../api/index.js'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

function CityRow({ city, onEdit, onDelete }) {
  const { t } = useTranslation()
  return (
    <tr className="border-b border-navy-700 hover:bg-navy-700/30 transition-colors">
      <td className="px-4 py-3 text-white text-sm font-medium">{city.name}</td>
      <td className="px-4 py-3 text-slate-400 text-sm">{city.region || '—'}</td>
      <td className="px-4 py-3">
        <span
          className={[
            'inline-block w-2 h-2 rounded-full',
            city.active !== false ? 'bg-brand-green' : 'bg-slate-600',
          ].join(' ')}
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => onEdit(city)}>
            {t('admin.edit')}
          </Button>
          <Button variant="danger" size="sm" onClick={() => onDelete(city.id)}>
            {t('admin.delete')}
          </Button>
        </div>
      </td>
    </tr>
  )
}

function CityForm({ initial, onSubmit, onCancel, loading }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', region: '', active: true, ...initial })

  const handle = (f) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((p) => ({ ...p, [f]: val }))
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
      className="bg-navy-700 rounded-xl p-4 space-y-3 mb-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">City Name *</label>
          <input
            value={form.name}
            onChange={handle('name')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 focus:outline-none focus:border-brand-green text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Region</label>
          <input
            value={form.region || ''}
            onChange={handle('region')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 focus:outline-none focus:border-brand-green text-sm"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
        <input type="checkbox" checked={form.active} onChange={handle('active')} className="accent-brand-green" />
        Active
      </label>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" loading={loading}>
          {t('admin.save')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {t('admin.cancel')}
        </Button>
      </div>
    </form>
  )
}

export default function Cities() {
  const { t } = useTranslation()
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editCity, setEditCity] = useState(null)

  const load = () => {
    setLoading(true)
    adminGetCities()
      .then((r) => setCities(r.data))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (form) => {
    setFormLoading(true)
    try {
      await adminCreateCity(form)
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
      await adminUpdateCity(editCity.id, form)
      setEditCity(null)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this city?')) return
    try {
      await adminDeleteCity(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bebas tracking-widest text-white">{t('admin.cities')}</h1>
        <Button variant="primary" size="sm" onClick={() => { setShowAdd(true); setEditCity(null) }}>
          + {t('admin.add')}
        </Button>
      </div>

      {error && <p className="text-brand-red text-sm">{error}</p>}

      {showAdd && !editCity && (
        <CityForm
          initial={{ name: '', region: '', active: true }}
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
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Region</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Active</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-500">No cities yet</td>
                  </tr>
                ) : (
                  cities.map((city) =>
                    editCity?.id === city.id ? (
                      <tr key={city.id} className="bg-navy-700/40">
                        <td colSpan={4} className="px-4 py-3">
                          <CityForm
                            initial={editCity}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditCity(null)}
                            loading={formLoading}
                          />
                        </td>
                      </tr>
                    ) : (
                      <CityRow
                        key={city.id}
                        city={city}
                        onEdit={(c) => { setEditCity(c); setShowAdd(false) }}
                        onDelete={handleDelete}
                      />
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
