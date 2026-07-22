import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'

const links = [
  { label: 'Home',         href: '#hero'     },
  { label: 'Features',     href: '#features' },
  { label: 'How It Works', href: '#how'      },
  { label: 'Portals',      href: '#roles'    },
]

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (href) => {
    setMenuOpen(false)
    if (href.startsWith('#')) {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-neutral-200 shadow-[0_1px_3px_rgb(0,0,0,0.06)]'
          : 'bg-transparent',
      ].join(' ')}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 select-none">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <HeartIcon />
          </div>
          <span className="font-bold text-neutral-900 text-base tracking-tight">
            Medi<span className="text-blue-600">Connect</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => scrollTo(href)}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all duration-150 font-medium"
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Get Started
              <ArrowIcon />
            </Button>
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 transition-colors"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <CloseIcon /> : <BurgerIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-100 px-6 py-4 space-y-1">
          {links.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => scrollTo(href)}
              className="w-full text-left px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg font-medium transition-colors"
            >
              {label}
            </button>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-neutral-100 mt-3">
            <Link to="/login"    onClick={() => setMenuOpen(false)}><Button variant="outline" fullWidth>Log In</Button></Link>
            <Link to="/register" onClick={() => setMenuOpen(false)}><Button variant="primary" fullWidth>Get Started</Button></Link>
          </div>
        </div>
      )}
    </header>
  )
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 13.5C8 13.5 2 9.5 2 5.5a3.5 3.5 0 016-2.45A3.5 3.5 0 0114 5.5c0 4-6 8-6 8z" fill="white" fillOpacity="0.9"/>
    </svg>
  )
}
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 7h10M8 4l4 3-4 3" />
    </svg>
  )
}
function BurgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M2 5h14M2 9h14M2 13h14" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 4l10 10M14 4L4 14" />
    </svg>
  )
}
