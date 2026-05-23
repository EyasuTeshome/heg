import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Response interceptor: handle 401 + token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        isRefreshing = false
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post('/api/auth/refresh', { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = response.data
        localStorage.setItem('accessToken', accessToken)
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken)
        }
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Public API ───────────────────────────────────────────────────────────────

export const getCities = () => api.get('/cities')

export const getCityRoutes = (cityId) => api.get(`/cities/${cityId}/routes`)

export const getRouteTariffs = (routeId) => api.get(`/routes/${routeId}/tariffs`)

export const getRouteComments = (routeId) => api.get(`/routes/${routeId}/comments`)

export const postComment = (routeId, data) => api.post(`/routes/${routeId}/comments`, data)

export const updateComment = (id, data) => api.put(`/comments/${id}`, data)

export const deleteComment = (id) => api.delete(`/comments/${id}`)

export const submitTariff = (data) => api.post('/tariffs', data)

export const getMyTariffs = () => api.get('/tariffs/me')

export const reportTariff = (id, data) => api.post(`/tariffs/${id}/report`, data)

export const reportOvercharge = (data) => api.post('/overcharge', data)

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = (data) => api.post('/auth/login', data)

export const register = (data) => api.post('/auth/register', data)

export const logout = (data) => api.post('/auth/logout', data)

export const refreshToken = (data) => api.post('/auth/refresh', data)

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminGetStats = () => api.get('/admin/stats')

export const adminGetCities = () => api.get('/admin/cities')

export const adminCreateCity = (data) => api.post('/admin/cities', data)

export const adminUpdateCity = (id, data) => api.put(`/admin/cities/${id}`, data)

export const adminDeleteCity = (id) => api.delete(`/admin/cities/${id}`)

export const adminGetStops = (cityId) => api.get('/admin/stops', { params: { cityId } })

export const adminCreateStop = (data) => api.post('/admin/stops', data)

export const adminUpdateStop = (id, data) => api.put(`/admin/stops/${id}`, data)

export const adminDeleteStop = (id) => api.delete(`/admin/stops/${id}`)

export const adminGetRoutes = (cityId) => api.get('/admin/routes', { params: { cityId } })

export const adminCreateRoute = (data) => api.post('/admin/routes', data)

export const adminUpdateRoute = (id, data) => api.put(`/admin/routes/${id}`, data)

export const adminDeleteRoute = (id) => api.delete(`/admin/routes/${id}`)

export const adminGetVehicleTypes = () => api.get('/admin/vehicle-types')

export const adminCreateVehicleType = (data) => api.post('/admin/vehicle-types', data)

export const adminUpdateVehicleType = (id, data) => api.put(`/admin/vehicle-types/${id}`, data)

export const adminDeleteVehicleType = (id) => api.delete(`/admin/vehicle-types/${id}`)

export const adminGetTariffs = (status) =>
  api.get('/admin/tariffs', { params: status ? { status } : undefined })

export const adminCreateTariff = (data) => api.post('/admin/tariffs', data)

export const adminUpdateTariff = (id, data) => api.patch(`/admin/tariffs/${id}`, data)

export const adminDeleteTariff = (id) => api.delete(`/admin/tariffs/${id}`)

export const adminGetUsers = () => api.get('/admin/users')

export const adminUpdateUser = (id, data) => api.patch(`/admin/users/${id}`, data)

export const adminGetComments = () => api.get('/admin/comments')

export const adminDeleteComment = (id) => api.delete(`/admin/comments/${id}`)

export const adminGetTariffReports = () => api.get('/admin/tariff-reports')

export const adminDeleteTariffReport = (id) => api.delete(`/admin/tariff-reports/${id}`)

export const adminGetOverchargeStats = () => api.get('/admin/overcharge-stats')

export default api
