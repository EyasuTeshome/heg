import Spinner from './Spinner.jsx'

const variantClasses = {
  primary: 'bg-brand-green hover:bg-emerald-600 text-white border-transparent',
  secondary: 'bg-navy-700 hover:bg-navy-600 text-white border-transparent',
  danger: 'bg-brand-red hover:bg-red-600 text-white border-transparent',
  ghost: 'bg-transparent hover:bg-navy-700 text-white border border-navy-600',
  amber: 'bg-brand-amber hover:bg-yellow-500 text-white border-transparent',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-6 py-3 text-lg rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  children,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold font-inter transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-navy-900 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className,
      ].join(' ')}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
