import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { adminGetStats, adminGetTariffs, adminGetOverchargeStats } from '../../api/index.js'
import Badge from '../../components/ui/Badge.jsx'
import Spinner from '../../components/ui/Spinner.jsx'

function StatCard({ label, value, color = 'green', icon }) {
  const colorMap = {
    green: 'border-emerald-700 text-brand-green',
    amber: 'border-amber-700 text-brand-amber',
    red: 'border-red-700 text-brand-red',
    blue: 'border-blue-700 text-blue-400',
  }
  return (
    <div className={`bg-navy-800 rounded-xl border ${colorMap[color]} px-5 py-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`font-bebas text-4xl ${colorMap[color].split(' ')[1]}`}>{value ?? '—'}</div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function Dashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState(null)
  const [pendingTariffs, setPendingTariffs] = useState([])
  const [overchargeStats, setOverchargeStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminGetStats().then((r) => setStats(r.data)).catch(() => {}),
      adminGetTariffs('PENDING').then((r) => setPendingTariffs(Array.isArray(r.data) ? r.data.slice(0, 5) : [])).catch(() => {}),
      adminGetOverchargeStats().then((r) => setOverchargeStats(Array.isArray(r.data) ? r.data.slice(0, 8) : [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" className="text-brand-green" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bebas tracking-widest text-white">{t('admin.dashboard')}</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('admin.totalCities')} value={stats?.totalCities ?? 0} color="blue" icon="🏙" />
        <StatCard label={t('admin.totalRoutes')} value={stats?.totalRoutes ?? 0} color="green" icon="🗺" />
        <StatCard
          label={t('admin.pendingTariffs')}
          value={stats?.pendingTariffs ?? pendingTariffs.length}
          color="amber"
          icon="⏳"
        />
        <StatCard label={t('admin.recentReports')} value={stats?.recentReports ?? 0} color="red" icon="🚨" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending tariffs */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-navy-700">
            <h2 className="text-white font-semibold text-sm">Recent Pending Tariffs</h2>
            <Link
              to="/admin/tariffs"
              className="text-xs text-brand-green hover:underline"
            >
              View all →
            </Link>
          </div>
          {pendingTariffs.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">No pending tariffs</div>
          ) : (
            <div className="divide-y divide-navy-700">
              {pendingTariffs.map((tariff) => (
                <div key={tariff.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm">
                      {tariff.route?.originStop?.name || '?'} → {tariff.route?.destinationStop?.name || '?'}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {tariff.vehicleType?.name} · {parseFloat(tariff.baseFare || 0).toFixed(2)} ETB
                    </p>
                  </div>
                  <Badge variant="pending" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overcharge heatmap */}
        <div className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-navy-700">
            <h2 className="text-white font-semibold text-sm">Overcharge Reports by Route</h2>
            <Link
              to="/admin/reports"
              className="text-xs text-brand-green hover:underline"
            >
              View all →
            </Link>
          </div>
          {overchargeStats.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">No overcharge reports</div>
          ) : (
            <div className="divide-y divide-navy-700">
              {overchargeStats.map((stat, i) => {
                const maxCount = overchargeStats[0]?.count || 1
                const pct = Math.max(8, Math.round((stat.count / maxCount) * 100))
                return (
                  <div key={i} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-xs">
                        {stat.route || `Route ${stat.routeId}`}
                      </span>
                      <span className="text-brand-red text-xs font-bold">{stat.count}</span>
                    </div>
                    <div className="h-1.5 bg-navy-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-red rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
