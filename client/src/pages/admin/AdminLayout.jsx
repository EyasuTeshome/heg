import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext.jsx'
import { adminGetTariffs } from '../../api/index.js'
import Spinner from '../../components/ui/Spinner.jsx'

const navItems = [
  { path: '/admin/dashboard', labelKey: 'admin.dashboard', icon: '⊞' },
  { path: '/admin/cities', labelKey: 'admin.cities', icon: '🏙' },
  { path: '/admin/stops', labelKey: 'admin.stops', icon: '📍' },
  { path: '/admin/routes', labelKey: 'admin.routes', icon: '🗺' },
  { path: '/admin/vehicle-types', labelKey: 'admin.vehicleTypes', icon: '🚌' },
  { path: '/admin/tariffs', labelKey: 'admin.tariffs', icon: '💰', badge: true },
  { path: '/admin/users', labelKey: 'admin.users', icon: '👥' },
  { path: '/admin/comments', labelKey: 'admin.comments', icon: '💬' },
  { path: '/admin/reports', labelKey: 'admin.reports', icon: '🚨' },
]

export default function AdminLayout() {
  const { t } = useTranslation()
  const { user, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      navigate('/')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      adminGetTariffs('PENDING')
        .then((res) => setPendingCount(Array.isArray(res.data) ? res.data.length : 0))
        .catch(() => {})
    }
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Spinner size="lg" className="text-brand-green" />
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') return null

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-56 bg-navy-900 border-r border-navy-700 flex flex-col transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b border-navy-700">
          <Link to="/" className="text-white font-bebas text-xl tracking-widest hover:text-brand-green transition-colors">
            TariffCheck
          </Link>
          <p className="text-slate-500 text-xs mt-0.5">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors font-medium',
                  isActive
                    ? 'bg-brand-green/20 text-brand-green'
                    : 'text-slate-400 hover:text-white hover:bg-navy-700',
                ].join(' ')
              }
            >
              <span className="text-base">{item.icon}</span>
              {t(item.labelKey)}
              {item.badge && pendingCount > 0 && (
                <span className="ml-auto bg-brand-amber text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-navy-700">
          <p className="text-slate-500 text-xs truncate mb-2">{user.email}</p>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-brand-red transition-colors font-semibold"
          >
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-navy-900 border-b border-navy-700 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded"
            onClick={() => setSidebarOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-slate-400 text-sm hidden sm:inline">Admin</span>
          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Public site
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
