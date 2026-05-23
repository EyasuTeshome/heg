const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
}

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      className={[
        'inline-block rounded-full border-transparent border-t-current animate-spin',
        sizeClasses[size] || sizeClasses.md,
        className,
      ].join(' ')}
      role="status"
      aria-label="Loading"
    />
  )
}
