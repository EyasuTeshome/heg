import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { adminGetComments, adminDeleteComment, adminGetCities } from '../../api/index.js'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return d }
}

function truncateEmail(email = '') {
  if (!email) return 'Unknown'
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 3)}***@${domain}`
}

export default function Comments() {
  const { t } = useTranslation()
  const [comments, setComments] = useState([])
  const [cities, setCities] = useState([])
  const [filterCityId, setFilterCityId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminGetCities().then((r) => setCities(r.data)).catch(() => {})
  }, [])

  const load = () => {
    setLoading(true)
    adminGetComments()
      .then((r) => setComments(r.data))
      .catch(() => setError('Failed to load comments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await adminDeleteComment(id)
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    }
  }

  const filtered = filterCityId
    ? comments.filter((c) => c.route?.city?.id?.toString() === filterCityId)
    : comments

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bebas tracking-widest text-white">{t('admin.comments')}</h1>
        <select
          value={filterCityId}
          onChange={(e) => setFilterCityId(e.target.value)}
          className="bg-navy-800 text-white rounded-lg px-3 py-1.5 border border-navy-600 text-sm focus:outline-none"
        >
          <option value="">All Cities</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {error && <p className="text-brand-red text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" className="text-brand-green" /></div>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700 bg-navy-900/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Author</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Route</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">City</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Comment</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">No comments found</td>
                  </tr>
                ) : (
                  filtered.map((comment) => (
                    <tr key={comment.id} className="border-b border-navy-700 hover:bg-navy-700/20">
                      <td className="px-4 py-3 text-slate-400 text-xs">{truncateEmail(comment.user?.email)}</td>
                      <td className="px-4 py-3 text-white text-sm">
                        {comment.route?.originStop?.name || '?'} → {comment.route?.destinationStop?.name || '?'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{comment.route?.city?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm max-w-xs">
                        <p className="truncate max-w-[200px]" title={comment.body}>{comment.body}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(comment.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button variant="danger" size="sm" onClick={() => handleDelete(comment.id)}>
                          {t('admin.delete')}
                        </Button>
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
