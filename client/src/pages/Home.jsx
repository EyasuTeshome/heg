import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FareLookup from '../components/FareLookup.jsx'
import CommentSection from '../components/CommentSection.jsx'
import { getCityRoutes } from '../api/index.js'

function FareLookupConnected({ onRouteSelected }) {
  const [searchParams] = useSearchParams()
  const cityId = searchParams.get('city')
  const fromId = searchParams.get('from')
  const toId = searchParams.get('to')
  const prevKey = useRef(null)

  useEffect(() => {
    const key = `${cityId}-${fromId}-${toId}`
    if (prevKey.current === key) return
    prevKey.current = key

    if (cityId && fromId && toId) {
      getCityRoutes(cityId)
        .then((res) => {
          const routes = res.data
          const matched = routes.find(
            (r) =>
              (r.originStop?.id.toString() === fromId.toString() &&
                r.destinationStop?.id.toString() === toId.toString()) ||
              (r.originStop?.id.toString() === toId.toString() &&
                r.destinationStop?.id.toString() === fromId.toString())
          )
          onRouteSelected(matched ? matched.id : null)
        })
        .catch(() => onRouteSelected(null))
    } else {
      onRouteSelected(null)
    }
  }, [cityId, fromId, toId, onRouteSelected])

  return <FareLookup />
}

export default function Home() {
  const { t } = useTranslation()
  const [activeRouteId, setActiveRouteId] = useState(null)

  return (
    <div className="min-h-screen bg-navy-900">
      <div className="max-w-mobile mx-auto px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-8 pt-2">
          <h1 className="text-3xl font-bebas tracking-widest text-white mb-2 leading-tight">
            {t('home.title')}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Fare lookup */}
        <FareLookupConnected onRouteSelected={setActiveRouteId} />

        {/* Comment section appears once a route is selected */}
        {activeRouteId && (
          <div className="mt-2 pb-10">
            <CommentSection routeId={activeRouteId} />
          </div>
        )}
      </div>
    </div>
  )
}
