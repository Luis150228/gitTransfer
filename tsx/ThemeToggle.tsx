// micro-animación: fade + rotate sutil src/components/ThemeToggle.tsx
import { useTheme } from '../hooks/useTheme'
import { useState } from 'react'

export function ThemeToggle() {
  const { mode, toggle } = useTheme()
  const [spin, setSpin] = useState(false)

  return (
    <button
      onClick={() => {
        setSpin(true)
        toggle()
        // reset anim al final
        setTimeout(() => setSpin(false), 250)
      }}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border"
      // usa variables del tema
      style={{ borderColor: 'var(--border)', color: 'var(--fg)', background: 'transparent' }}
      title={mode === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
    >
      <span
        className={[
          'inline-flex',
          'transition-all duration-200 ease-out',
          spin ? 'opacity-0 rotate-180 scale-75' : 'opacity-100 rotate-0 scale-100',
        ].join(' ')}
        aria-hidden
      >
        {mode === 'dark' ? (
          // Sol
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.54 6.46-1.42-1.42M7.88 7.88 6.46 6.46m12.02 0-1.42 1.42M7.88 16.12 6.46 17.54" />
          </svg>
        ) : (
          // Luna
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </span>
      <span className="hidden sm:inline text-sm">{mode === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )
}
