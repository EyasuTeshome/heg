import { useTranslation } from 'react-i18next'

const variantConfig = {
  verified: {
    classes: 'bg-emerald-900/60 text-brand-green border border-emerald-700',
    icon: '✓',
    labelKey: 'fare.verified',
  },
  pending: {
    classes: 'bg-amber-900/60 text-brand-amber border border-amber-700',
    icon: '⏳',
    labelKey: 'fare.pending',
  },
  rejected: {
    classes: 'bg-red-900/60 text-brand-red border border-red-700',
    icon: '✕',
    labelKey: null,
    label: 'Rejected',
  },
  approved: {
    classes: 'bg-emerald-900/60 text-brand-green border border-emerald-700',
    icon: '✓',
    labelKey: 'fare.approved',
  },
}

export default function Badge({ variant = 'pending', className = '' }) {
  const { t } = useTranslation()
  const config = variantConfig[variant] || variantConfig.pending
  const label = config.labelKey ? t(config.labelKey) : config.label

  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold font-inter',
        config.classes,
        className,
      ].join(' ')}
    >
      <span>{config.icon}</span>
      {label}
    </span>
  )
}
