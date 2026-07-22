import { Link } from 'react-router-dom'

const columns = [
  {
    heading: 'Platform',
    links: [
      { label: 'Features',      href: '#features' },
      { label: 'How It Works',  href: '#how'      },
      { label: 'Security',      href: '#features' },
      { label: 'Doctor Network',href: '#roles'    },
    ],
  },
  {
    heading: 'Portals',
    links: [
      { label: 'Patient Portal', href: '/register' },
      { label: 'Doctor Login',   href: '/login'    },
      { label: 'Admin Access',   href: '/login'    },
    ],
  },
  {
    heading: 'Technology',
    links: [
      { label: 'Secure Video Calls',    href: '#features' },
      { label: 'End-to-End Encryption', href: '#features' },
      { label: 'JWT Authentication',    href: '#features' },
      { label: 'Role-Based Access',     href: '#features' },
    ],
  },
]

export default function Footer() {
  const scrollTo = (href) => {
    if (href.startsWith('#')) document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="bg-neutral-900 text-neutral-400">
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-neutral-800">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 13.5C8 13.5 2 9.5 2 5.5a3.5 3.5 0 016-2.45A3.5 3.5 0 0114 5.5c0 4-6 8-6 8z" fill="white" fillOpacity="0.9"/>
                </svg>
              </div>
              <span className="font-bold text-white text-base">
                Medi<span className="text-blue-400">Connect</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-neutral-500">
              A secure telemedicine platform connecting Nigerian patients with licensed doctors through HD video consultations and digital health records.
            </p>
          </div>

          {/* Link columns */}
          {columns.map(({ heading, links }) => (
            <div key={heading}>
              <p className="text-xs font-semibold text-neutral-300 uppercase tracking-widest mb-4">{heading}</p>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('#') ? (
                      <button
                        onClick={() => scrollTo(href)}
                        className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors"
                      >
                        {label}
                      </button>
                    ) : (
                      <Link to={href} className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-600">
            © 2025 MediConnect. Final Year Project — Telemedicine Platform for Rural Healthcare Access.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-neutral-500">Platform Online</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
