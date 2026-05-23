import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { I18nProvider } from './context/I18nContext.jsx'
import Navbar from './components/Navbar.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Submissions from './pages/Submissions.jsx'

import AdminLayout from './pages/admin/AdminLayout.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Cities from './pages/admin/Cities.jsx'
import Stops from './pages/admin/Stops.jsx'
import Routes_ from './pages/admin/Routes.jsx'
import VehicleTypes from './pages/admin/VehicleTypes.jsx'
import Tariffs from './pages/admin/Tariffs.jsx'
import Users from './pages/admin/Users.jsx'
import Comments from './pages/admin/Comments.jsx'
import Reports from './pages/admin/Reports.jsx'

function PublicLayout({ children }) {
  return (
    <div className="font-inter bg-navy-900 min-h-screen">
      <Navbar />
      {children}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <Routes>
          {/* Public routes with Navbar */}
          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/submissions"
            element={
              <PublicLayout>
                <Submissions />
              </PublicLayout>
            }
          />

          {/* Admin routes (full-width, own layout) */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cities" element={<Cities />} />
            <Route path="stops" element={<Stops />} />
            <Route path="routes" element={<Routes_ />} />
            <Route path="vehicle-types" element={<VehicleTypes />} />
            <Route path="tariffs" element={<Tariffs />} />
            <Route path="users" element={<Users />} />
            <Route path="comments" element={<Comments />} />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </I18nProvider>
    </AuthProvider>
  )
}
