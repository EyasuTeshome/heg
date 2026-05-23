import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  adminGetVehicleTypes,
  adminCreateVehicleType,
  adminUpdateVehicleType,
  adminDeleteVehicleType,
} from '../../api/index.js'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

function VehicleTypeForm({ initial, onSubmit, onCancel, loading }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', description: '', ...initial })

  const handle = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
      className="bg-navy-700 rounded-xl p-4 space-y-3 mb-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Name *</label>
          <input
            value={form.name}
            onChange={handle('name')}
            className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 text-sm focus:outline-none focus:border-brand-green"
            placeholder="e.g. Minibus"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
          <input
            value={form.description || ''}
            onChange={handle('description')}
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

export default function VehicleTypes() {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)

  const load = () => {
    setLoading(true)
    adminGetVehicleTypes()
      .then((r) => setItems(r.data))
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (form) => {
    setFormLoading(true)
    try {
      await adminCreateVehicleType(form)
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
      await adminUpdateVehicleType(editItem.id, form)
      setEditItem(null)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle type?')) return
    try {
      await adminDeleteVehicleType(id)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bebas tracking-widest text-white">{t('admin.vehicleTypes')}</h1>
        <Button variant="primary" size="sm" onClick={() => { setShowAdd(true); setEditItem(null) }}>
          + {t('admin.add')}
        </Button>
      </div>

      {error && <p className="text-brand-red text-sm">{error}</p>}

      {showAdd && !editItem && (
        <VehicleTypeForm
          initial={{ name: '', description: '' }}
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
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Description</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-slate-500">No vehicle types found</td>
                  </tr>
                ) : (
                  items.map((item) =>
                    editItem?.id === item.id ? (
                      <tr key={item.id} className="bg-navy-700/40">
                        <td colSpan={3} className="px-4 py-3">
                          <VehicleTypeForm
                            initial={editItem}
                            onSubmit={handleUpdate}
                            onCancel={() => setEditItem(null)}
                            loading={formLoading}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr key={item.id} className="border-b border-navy-700 hover:bg-navy-700/30">
                        <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-slate-400">{item.description || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" onClick={() => { setEditItem(item); setShowAdd(false) }}>
                              {t('admin.edit')}
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(item.id)}>
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
