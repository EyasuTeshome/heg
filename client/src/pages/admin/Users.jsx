import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { adminGetUsers, adminUpdateUser } from '../../api/index.js'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString() } catch { return d }
}

export default function Users() {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    adminGetUsers()
      .then((r) => setUsers(r.data))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleToggleRole = async (user) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
    setActionLoading((p) => ({ ...p, [`role_${user.id}`]: true }))
    try {
      await adminUpdateUser(user.id, { role: newRole })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role')
    } finally {
      setActionLoading((p) => ({ ...p, [`role_${user.id}`]: false }))
    }
  }

  const handleToggleActive = async (user) => {
    setActionLoading((p) => ({ ...p, [`active_${user.id}`]: true }))
    try {
      await adminUpdateUser(user.id, { active: !user.active })
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status')
    } finally {
      setActionLoading((p) => ({ ...p, [`active_${user.id}`]: false }))
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bebas tracking-widest text-white">{t('admin.users')}</h1>

      {error && <p className="text-brand-red text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" className="text-brand-green" /></div>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Joined</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-navy-700 hover:bg-navy-700/20">
                      <td className="px-4 py-3 text-white">{user.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-block px-2 py-0.5 rounded-full text-xs font-bold',
                            user.role === 'ADMIN'
                              ? 'bg-brand-amber/20 text-brand-amber'
                              : 'bg-navy-700 text-slate-400',
                          ].join(' ')}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex items-center gap-1 text-xs font-semibold',
                            user.active !== false ? 'text-brand-green' : 'text-slate-500',
                          ].join(' ')}
                        >
                          <span
                            className={[
                              'w-1.5 h-1.5 rounded-full',
                              user.active !== false ? 'bg-brand-green' : 'bg-slate-600',
                            ].join(' ')}
                          />
                          {user.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <Button
                            variant={user.role === 'ADMIN' ? 'secondary' : 'amber'}
                            size="sm"
                            loading={actionLoading[`role_${user.id}`]}
                            onClick={() => handleToggleRole(user)}
                          >
                            {user.role === 'ADMIN' ? '→ User' : '→ Admin'}
                          </Button>
                          <Button
                            variant={user.active !== false ? 'danger' : 'primary'}
                            size="sm"
                            loading={actionLoading[`active_${user.id}`]}
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.active !== false ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
