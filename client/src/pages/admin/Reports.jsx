import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  adminGetTariffReports,
  adminDeleteTariffReport,
  adminGetOverchargeStats,
} from '../../api/index.js'
import Button from '../../components/ui/Button.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return d }
}

function truncateEmail(email = '') {
  if (!email) return 'Anonymous'
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 3)}***@${domain}`
}

export default function Reports() {
  const { t } = useTranslation()
  const [tariffReports, setTariffReports] = useState([])
  const [overchargeStats, setOverchargeStats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      adminGetTariffReports().then((r) => setTariffReports(r.data)).catch(() => {}),
      adminGetOverchargeStats().then((r) => setOverchargeStats(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  const handleDismissReport = async (id) => {
    if (!window.confirm('Dismiss this report?')) return
    try {
      await adminDeleteTariffReport(id)
      setTariffReports((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dismiss')
    }
  }

  const maxOvercharge = overchargeStats[0]?.count || 1

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bebas tracking-widest text-white">{t('admin.reports')}</h1>

      {error && <p className="text-brand-red text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="lg" className="text-brand-green" /></div>
      ) : (
        <>
          {/* Overcharge stats */}
          <section>
            <h2 className="text-white font-semibold mb-3 text-base">Overcharge Reports Summary</h2>
            {overchargeStats.length === 0 ? (
              <div className="bg-navy-800 rounded-xl border border-navy-700 px-5 py-8 text-center text-slate-500 text-sm">
                No overcharge reports
              </div>
            ) : (
              <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
                <div className="grid grid-cols-3 px-5 py-2.5 bg-navy-900/50 border-b border-navy-700 text-xs text-slate-400 font-medium uppercase tracking-wide">
                  <span>Route</span>
                  <span>Vehicle</span>
                  <span className="text-right">Reports</span>
                </div>
                {overchargeStats.map((stat, i) => {
                  const pct = Math.max(6, Math.round((stat.count / maxOvercharge) * 100))
                  return (
                    <div key={i} className="border-b border-navy-700 last:border-0 px-5 py-3">
                      <div className="grid grid-cols-3 items-center mb-1.5">
                        <span className="text-white text-sm">
                          {stat.route || `Route ${stat.routeId}`}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {stat.vehicleType || '—'}
                        </span>
                        <span className="text-brand-red font-bold text-sm text-right">
                          {stat.count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-red rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Tariff reports */}
          <section>
            <h2 className="text-white font-semibold mb-3 text-base">Flagged Tariff Reports</h2>
            {tariffReports.length === 0 ? (
              <div className="bg-navy-800 rounded-xl border border-navy-700 px-5 py-8 text-center text-slate-500 text-sm">
                No tariff reports
              </div>
            ) : (
              <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-navy-700 bg-navy-900/50">
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Reporter</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Tariff</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Reason</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                        <th className="text-left px-4 py-3 text-slate-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tariffReports.map((report) => (
                        <tr key={report.id} className="border-b border-navy-700 hover:bg-navy-700/20">
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {truncateEmail(report.user?.email)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-white text-xs">
                              {report.tariff?.route?.originStop?.name || '?'} →{' '}
                              {report.tariff?.route?.destinationStop?.name || '?'}
                            </p>
                            <p className="text-slate-500 text-xs">
                              {report.tariff?.vehicleType?.name || '—'} ·{' '}
                              {report.tariff?.baseFare?.toFixed(2)} ETB
                            </p>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm max-w-xs">
                            <p className="truncate max-w-[200px]" title={report.reason}>{report.reason}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {formatDate(report.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDismissReport(report.id)}
                            >
                              Dismiss
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
