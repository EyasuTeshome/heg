import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getRouteComments, postComment, updateComment, deleteComment } from '../api/index.js'
import Button from './ui/Button.jsx'
import Spinner from './ui/Spinner.jsx'

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function truncateEmail(email = '') {
  if (!email) return 'User'
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 3)}***@${domain}`
}

export default function CommentSection({ routeId }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newBody, setNewBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [editId, setEditId] = useState(null)
  const [editBody, setEditBody] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    if (!routeId) return
    setLoading(true)
    setError('')
    getRouteComments(routeId)
      .then((res) => setComments(res.data))
      .catch(() => setError('Failed to load comments'))
      .finally(() => setLoading(false))
  }, [routeId])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newBody.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await postComment(routeId, { body: newBody })
      setComments((prev) => [res.data, ...prev])
      setNewBody('')
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditStart = (comment) => {
    setEditId(comment.id)
    setEditBody(comment.body)
  }

  const handleEditSave = async (id) => {
    if (!editBody.trim()) return
    setEditLoading(true)
    try {
      const res = await updateComment(id, { body: editBody })
      setComments((prev) => prev.map((c) => (c.id === id ? res.data : c)))
      setEditId(null)
    } catch {
      // keep edit open on error
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await deleteComment(id)
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-white font-semibold text-base">{t('comments.title')}</h3>

      {/* New comment form */}
      {user ? (
        <form onSubmit={handlePost} className="space-y-2">
          <textarea
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={3}
            placeholder={t('comments.placeholder')}
            className="w-full bg-navy-800 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green resize-none text-sm placeholder-slate-500"
          />
          {submitError && <p className="text-brand-red text-xs">{submitError}</p>}
          <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={!newBody.trim()}>
            {t('comments.submit')}
          </Button>
        </form>
      ) : (
        <div className="bg-navy-800 rounded-xl border border-navy-700 px-4 py-3 text-sm text-slate-400">
          <Link to="/login" className="text-brand-green hover:underline font-semibold">
            {t('comments.loginToComment')}
          </Link>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Spinner size="md" className="text-brand-green" />
        </div>
      ) : error ? (
        <p className="text-brand-red text-sm text-center py-4">{error}</p>
      ) : comments.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-4">{t('comments.noComments')}</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const isOwn = user && (user.id === comment.userId || user.email === comment.user?.email)
            return (
              <div key={comment.id} className="bg-navy-800 rounded-xl border border-navy-700 px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-slate-400 text-xs font-semibold">
                    {truncateEmail(comment.user?.email)}
                  </span>
                  <span className="text-slate-600 text-xs">{formatDate(comment.createdAt)}</span>
                </div>

                {editId === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      className="w-full bg-navy-900 text-white rounded-lg px-3 py-2 border border-navy-600 focus:outline-none focus:border-brand-green resize-none text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        loading={editLoading}
                        onClick={() => handleEditSave(comment.id)}
                      >
                        {t('admin.save')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditId(null)}
                      >
                        {t('admin.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-200 text-sm leading-relaxed">{comment.body}</p>
                    {isOwn && (
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => handleEditStart(comment)}
                          className="text-xs text-slate-400 hover:text-brand-green transition-colors"
                        >
                          {t('comments.edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-slate-400 hover:text-brand-red transition-colors"
                        >
                          {t('comments.delete')}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
