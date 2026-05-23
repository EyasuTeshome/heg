import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Badge from './ui/Badge.jsx'
import Button from './ui/Button.jsx'
import ReportTariffModal from './ReportTariffModal.jsx'
import SubmitTariffModal from './SubmitTariffModal.jsx'
import OverchargeButton from './OverchargeButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const vehicleEmoji = {
  TAXI: '🚕',
  BAJAJ: '🛺',
  MINIBUS: '🚌',
}

function getVehicleEmoji(name = '') {
  const upper = name.toUpperCase()
  if (upper.includes('BAJAJ') || upper.includes('BAJAI')) return '🛺'
  if (upper.includes('MINIBUS') || upper.includes('BUS')) return '🚌'
  return '🚕'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

function pctDiff(base, other) {
  if (!base || !other) return null
  const diff = ((other - base) / base) * 100
  return diff > 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`
}

export default function FareCard({ tariff, route }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [fareMode, setFareMode] = useState('base') // 'base' | 'night' | 'peak'
  const [reportOpen, setReportOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)

  const vehicleName = tariff.vehicleType?.name || 'Vehicle'
  const emoji = getVehicleEmoji(vehicleName)
  const statusVariant =
    tariff.status === 'APPROVED' || tariff.status === 'VERIFIED'
      ? 'verified'
      : tariff.status === 'REJECTED'
      ? 'rejected'
      : 'pending'

  const displayFare =
    fareMode === 'night' && tariff.nightFare != null
      ? tariff.nightFare
      : fareMode === 'peak' && tariff.peakFare != null
      ? tariff.peakFare
      : tariff.baseFare

  return (
    <>
      <div className="bg-navy-800 rounded-2xl border border-navy-700 overflow-hidden shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <span className="text-white font-semibold text-sm">{vehicleName}</span>
          </div>
          <Badge variant={statusVariant} />
        </div>

        {/* Price display */}
        <div className="px-4 pb-2 flex items-end gap-2">
          <span className="font-bebas text-5xl text-white leading-none">
            {displayFare != null ? displayFare.toFixed(2) : '—'}
          </span>
          <span className="text-slate-400 text-base mb-1 font-inter">{t('fare.currency')}</span>
        </div>

        {/* Fare mode toggle */}
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          <button
            onClick={() => setFareMode('base')}
            className={[
              'text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors',
              fareMode === 'base'
                ? 'bg-brand-green text-white border-brand-green'
                : 'text-slate-400 border-navy-600 hover:text-white',
            ].join(' ')}
          >
            {t('fare.baseFare')}
          </button>
          {tariff.nightFare != null && (
            <button
              onClick={() => setFareMode('night')}
              className={[
                'text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors',
                fareMode === 'night'
                  ? 'bg-navy-600 text-white border-navy-500'
                  : 'text-slate-400 border-navy-600 hover:text-white',
              ].join(' ')}
            >
              {t('fare.nightFare')}
              {pctDiff(tariff.baseFare, tariff.nightFare) && (
                <span className="ml-1 opacity-70">{pctDiff(tariff.baseFare, tariff.nightFare)}</span>
              )}
            </button>
          )}
          {tariff.peakFare != null && (
            <button
              onClick={() => setFareMode('peak')}
              className={[
                'text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors',
                fareMode === 'peak'
                  ? 'bg-brand-amber/80 text-white border-brand-amber'
                  : 'text-slate-400 border-navy-600 hover:text-white',
              ].join(' ')}
            >
              {t('fare.peakFare')}
              {pctDiff(tariff.baseFare, tariff.peakFare) && (
                <span className="ml-1 opacity-70">{pctDiff(tariff.baseFare, tariff.peakFare)}</span>
              )}
            </button>
          )}
        </div>

        {/* Meta */}
        <div className="px-4 pb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          {tariff.effectiveDate && (
            <span className="text-slate-500 text-xs">
              Effective {formatDate(tariff.effectiveDate)}
            </span>
          )}
          {tariff.sourceUrl && (
            <a
              href={tariff.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-green hover:underline"
            >
              Source ↗
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex flex-wrap gap-2 items-center border-t border-navy-700 pt-3">
          <button
            onClick={() => setReportOpen(true)}
            className="text-xs text-slate-400 hover:text-brand-red transition-colors font-semibold"
          >
            Report Incorrect
          </button>
          {user && (
            <button
              onClick={() => setSubmitOpen(true)}
              className="text-xs text-slate-400 hover:text-brand-green transition-colors font-semibold"
            >
              Submit Update
            </button>
          )}
          <div className="ml-auto">
            <OverchargeButton tariff={tariff} route={route} />
          </div>
        </div>
      </div>

      <ReportTariffModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        tariff={tariff}
      />
      <SubmitTariffModal
        isOpen={submitOpen}
        onClose={() => setSubmitOpen(false)}
        route={route}
      />
    </>
  )
}
