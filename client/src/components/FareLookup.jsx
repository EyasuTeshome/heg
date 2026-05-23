import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { getCities, getCityRoutes, getRouteTariffs } from '../api/index.js'
import FareCard from './FareCard.jsx'
import Button from './ui/Button.jsx'
import Spinner from './ui/Spinner.jsx'

function getStopsFromRoutes(routes) {
  const stopMap = new Map()
  routes.forEach((r) => {
    if (r.originStop) stopMap.set(r.originStop.id, r.originStop)
    if (r.destinationStop) stopMap.set(r.destinationStop.id, r.destinationStop)
  })
  return Array.from(stopMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export default function FareLookup() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()

  const [cities, setCities] = useState([])
  const [routes, setRoutes] = useState([])
  const [stops, setStops] = useState([])
  const [destStops, setDestStops] = useState([])
  const [tariffs, setTariffs] = useState([])
  const [selectedRoute, setSelectedRoute] = useState(null)

  const [cityId, setCityId] = useState(searchParams.get('city') || '')
  const [fromId, setFromId] = useState(searchParams.get('from') || '')
  const [toId, setToId] = useState(searchParams.get('to') || '')

  const [citiesLoading, setCitiesLoading] = useState(false)
  const [routesLoading, setRoutesLoading] = useState(false)
  const [tariffsLoading, setTariffsLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [noRoute, setNoRoute] = useState(false)
  const [compareMode, setCompareMode] = useState(false)

  // Load cities
  useEffect(() => {
    setCitiesLoading(true)
    getCities()
      .then((res) => setCities(res.data))
      .catch(() => {})
      .finally(() => setCitiesLoading(false))
  }, [])

  // Load routes when city changes
  useEffect(() => {
    if (!cityId) {
      setRoutes([])
      setStops([])
      setDestStops([])
      setFromId('')
      setToId('')
      setTariffs([])
      setSearched(false)
      return
    }
    setRoutesLoading(true)
    getCityRoutes(cityId)
      .then((res) => {
        const cityRoutes = res.data
        setRoutes(cityRoutes)
        setStops(getStopsFromRoutes(cityRoutes))
      })
      .catch(() => {
        setRoutes([])
        setStops([])
      })
      .finally(() => setRoutesLoading(false))
  }, [cityId])

  // Update destination stops when origin changes
  useEffect(() => {
    if (!fromId) {
      setDestStops(stops.filter((s) => s.id.toString() !== fromId))
      return
    }
    const reachable = routes
      .filter((r) => r.originStop?.id.toString() === fromId.toString())
      .map((r) => r.destinationStop)
      .filter(Boolean)
    const reachableIds = new Set(reachable.map((s) => s.id))
    // Also include routes going the other direction
    const reverse = routes
      .filter((r) => r.destinationStop?.id.toString() === fromId.toString())
      .map((r) => r.originStop)
      .filter(Boolean)
    reverse.forEach((s) => reachableIds.add(s.id))

    const all = [...reachable, ...reverse.filter((s) => !new Set(reachable.map((r) => r.id)).has(s.id))]
    const unique = Array.from(new Map(all.map((s) => [s.id, s])).values())
    setDestStops(unique.sort((a, b) => a.name.localeCompare(b.name)))
    if (toId && !unique.find((s) => s.id.toString() === toId.toString())) {
      setToId('')
    }
  }, [fromId, routes, stops])

  // Update URL params
  useEffect(() => {
    const params = {}
    if (cityId) params.city = cityId
    if (fromId) params.from = fromId
    if (toId) params.to = toId
    setSearchParams(params, { replace: true })
  }, [cityId, fromId, toId])

  // Auto-search if all 3 params are in URL on mount
  const [autoSearched, setAutoSearched] = useState(false)
  useEffect(() => {
    if (!autoSearched && cityId && fromId && toId && routes.length > 0) {
      setAutoSearched(true)
      handleSearch()
    }
  }, [routes, autoSearched])

  const handleSearch = useCallback(async () => {
    if (!cityId || !fromId || !toId) return
    setTariffsLoading(true)
    setSearched(true)
    setNoRoute(false)
    setTariffs([])
    setSelectedRoute(null)

    // Find matching route
    const matchedRoute = routes.find(
      (r) =>
        (r.originStop?.id.toString() === fromId.toString() &&
          r.destinationStop?.id.toString() === toId.toString()) ||
        (r.originStop?.id.toString() === toId.toString() &&
          r.destinationStop?.id.toString() === fromId.toString())
    )

    if (!matchedRoute) {
      setNoRoute(true)
      setTariffsLoading(false)
      return
    }

    setSelectedRoute(matchedRoute)

    try {
      const res = await getRouteTariffs(matchedRoute.id)
      const active = res.data.filter((t) => t.status === 'APPROVED' || t.status === 'VERIFIED' || t.status === 'PENDING')
      setTariffs(active)
      if (active.length === 0) setNoRoute(true)
    } catch {
      setNoRoute(true)
    } finally {
      setTariffsLoading(false)
    }
  }, [cityId, fromId, toId, routes])

  const verifiedTariffs = tariffs.filter((t) => t.status === 'APPROVED' || t.status === 'VERIFIED')
  const pendingTariffs = tariffs.filter((t) => t.status === 'PENDING')

  return (
    <div className="space-y-4">
      {/* City selector */}
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">
          {t('home.selectCity')}
        </label>
        <select
          value={cityId}
          onChange={(e) => {
            setCityId(e.target.value)
            setFromId('')
            setToId('')
            setTariffs([])
            setSearched(false)
          }}
          disabled={citiesLoading}
          className="w-full bg-navy-800 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm appearance-none cursor-pointer disabled:opacity-50"
        >
          <option value="">{citiesLoading ? t('home.loading') : t('home.selectCity')}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>{city.name}</option>
          ))}
        </select>
      </div>

      {/* Origin selector */}
      {cityId && (
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            {t('home.selectOrigin')}
          </label>
          <select
            value={fromId}
            onChange={(e) => { setFromId(e.target.value); setToId(''); setTariffs([]); setSearched(false) }}
            disabled={routesLoading}
            className="w-full bg-navy-800 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm appearance-none cursor-pointer disabled:opacity-50"
          >
            <option value="">{routesLoading ? t('home.loading') : t('home.selectOrigin')}</option>
            {stops.map((stop) => (
              <option key={stop.id} value={stop.id}>{stop.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Destination selector */}
      {fromId && (
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">
            {t('home.selectDestination')}
          </label>
          <select
            value={toId}
            onChange={(e) => { setToId(e.target.value); setTariffs([]); setSearched(false) }}
            className="w-full bg-navy-800 text-white rounded-xl px-4 py-3 border border-navy-600 focus:outline-none focus:border-brand-green text-sm appearance-none cursor-pointer"
          >
            <option value="">{t('home.selectDestination')}</option>
            {destStops
              .filter((s) => s.id.toString() !== fromId.toString())
              .map((stop) => (
                <option key={stop.id} value={stop.id}>{stop.name}</option>
              ))}
          </select>
        </div>
      )}

      {/* Search button */}
      {cityId && fromId && toId && (
        <Button
          variant="primary"
          size="lg"
          onClick={handleSearch}
          loading={tariffsLoading}
          className="w-full"
        >
          {t('home.searchFares')}
        </Button>
      )}

      {/* Loading */}
      {tariffsLoading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" className="text-brand-green" />
        </div>
      )}

      {/* Results */}
      {!tariffsLoading && searched && (
        <>
          {noRoute && tariffs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <div className="text-3xl mb-2">🔍</div>
              {t('home.noRouteFound')}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Compare toggle */}
              {tariffs.length > 1 && (
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold text-sm">
                    {selectedRoute?.originStop?.name} → {selectedRoute?.destinationStop?.name}
                  </h2>
                  <button
                    onClick={() => setCompareMode((v) => !v)}
                    className={[
                      'text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors',
                      compareMode
                        ? 'bg-brand-green text-white border-brand-green'
                        : 'text-slate-400 border-navy-600 hover:text-white',
                    ].join(' ')}
                  >
                    {t('fare.compareFares')}
                  </button>
                </div>
              )}

              {/* Compare table mode */}
              {compareMode && tariffs.length > 1 ? (
                <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-navy-700">
                          <th className="text-left px-4 py-3 text-slate-400 font-medium">Vehicle</th>
                          <th className="text-right px-4 py-3 text-slate-400 font-medium">Base</th>
                          <th className="text-right px-4 py-3 text-slate-400 font-medium">Night</th>
                          <th className="text-right px-4 py-3 text-slate-400 font-medium">Peak</th>
                          <th className="text-center px-4 py-3 text-slate-400 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tariffs.map((tariff) => {
                          const statusVariant =
                            tariff.status === 'APPROVED' || tariff.status === 'VERIFIED'
                              ? 'verified'
                              : tariff.status === 'REJECTED'
                              ? 'rejected'
                              : 'pending'
                          return (
                            <tr key={tariff.id} className="border-b border-navy-700 last:border-0">
                              <td className="px-4 py-3 text-white font-medium">
                                {tariff.vehicleType?.name || 'Unknown'}
                              </td>
                              <td className="px-4 py-3 text-right font-bebas text-xl text-white">
                                {tariff.baseFare?.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-400">
                                {tariff.nightFare != null ? tariff.nightFare.toFixed(2) : '—'}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-400">
                                {tariff.peakFare != null ? tariff.peakFare.toFixed(2) : '—'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={[
                                    'inline-block w-2 h-2 rounded-full',
                                    statusVariant === 'verified' ? 'bg-brand-green' : 'bg-brand-amber',
                                  ].join(' ')}
                                />
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {verifiedTariffs.length > 0 && (
                    <>
                      {verifiedTariffs.map((tariff) => (
                        <FareCard key={tariff.id} tariff={tariff} route={selectedRoute} />
                      ))}
                    </>
                  )}
                  {pendingTariffs.length > 0 && (
                    <>
                      <p className="text-xs text-slate-500 uppercase tracking-wide mt-4">
                        User-submitted (under review)
                      </p>
                      {pendingTariffs.map((tariff) => (
                        <FareCard key={tariff.id} tariff={tariff} route={selectedRoute} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
