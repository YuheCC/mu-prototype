/** Stroke icons for demo options — 24×24 viewBox */
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function DemoRoleIcon({ id, className }) {
  const c = className || ''
  switch (id) {
    case 'researcher':
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden {...stroke}>
          <path d="M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
          <path d="M12 9v3" />
          <path d="M9 21h6M9 18c0-2 1.5-3 3-3s3 1 3 3" />
        </svg>
      )
    case 'engineer':
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden {...stroke}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01M12 9v6" />
          <path d="M7 12h10" />
        </svg>
      )
    case 'student':
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden {...stroke}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      )
    default:
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden {...stroke}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
  }
}

export function DemoInterestIcon({ id, className }) {
  const c = className || ''
  switch (id) {
    case 'sse':
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden {...stroke}>
          <path d="M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z" />
          <path d="M7 10h10" />
          <path d="M12 7V4M10 2h4" />
        </svg>
      )
    case 'md':
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden {...stroke}>
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 5v2M12 17v2M5 12h2M17 12h2" />
          <path d="M7.5 7.5l1.4 1.4M15.1 15.1l1.4 1.4M7.5 16.5l1.4-1.4M15.1 8.9l1.4-1.4" />
        </svg>
      )
    case 'life':
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden {...stroke}>
          <path d="M3 3v18h18" />
          <path d="M7 16l4-5 3 3 5-8" />
          <circle cx="7" cy="16" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="14" cy="14" r="1.25" fill="currentColor" stroke="none" />
          <circle cx="19" cy="6" r="1.25" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'formulation':
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden {...stroke}>
          <path d="M9 3h6l-1 7H10L9 3z" />
          <path d="M10 10h4v8a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-8z" />
          <path d="M8 21h8" />
        </svg>
      )
    case 'literature':
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden {...stroke}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8M8 11h8" />
        </svg>
      )
    default:
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden {...stroke}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      )
  }
}
