import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Alert } from '@/components/ui'

const ROLE_CONFIG = {
  patient: {
    label:      'Patient Portal',
    heading:    'Welcome back',
    sub:        'Sign in to book consultations and access your health records',
    gradient:   'from-blue-900/90 via-blue-900/80 to-neutral-900/80',
    accent:     'text-blue-300',
    accentBg:   'bg-blue-600',
    statAccent: 'text-blue-300',
    image:      '/hero-consultation.jpeg',
    stats: [
      { v: '2,000+', l: 'Consultations'    },
      { v: '150+',   l: 'Licensed Doctors' },
      { v: '85%',    l: 'Cost Savings'     },
      { v: '24/7',   l: 'Access to Care'   },
    ],
    pitch:   'Healthcare without the long journey.',
    pitchSub:'Connect with licensed doctors from anywhere in Edo State — no travel required.',
    switchLinks: [
      { href: '/login/doctor', label: 'Doctor login' },
      { href: '/login/admin',  label: 'Admin login'  },
    ],
    registerLink: true,
    emailPlaceholder: 'patient@email.com',
    hint: null,
  },
  doctor: {
    label:      'Doctor Portal',
    heading:    'Doctor sign in',
    sub:        'Access your consultations, patients, and appointments',
    gradient:   'from-emerald-900/90 via-emerald-900/70 to-neutral-900/80',
    accent:     'text-emerald-300',
    accentBg:   'bg-emerald-600',
    statAccent: 'text-emerald-300',
    image:      'https://images.pexels.com/photos/5452224/pexels-photo-5452224.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    stats: [
      { v: '5,000+', l: 'Rural Patients'    },
      { v: '18',     l: 'Edo State LGAs'    },
      { v: '4h+',    l: 'Travel Saved/Visit' },
      { v: '100%',   l: 'Digital Records'    },
    ],
    pitch:   'Reach rural patients across Edo State.',
    pitchSub:'Conduct secure HD video consultations, issue digital prescriptions, and manage your schedule.',
    switchLinks: [
      { href: '/login/patient', label: 'Patient login' },
      { href: '/login/admin',   label: 'Admin login'   },
    ],
    registerLink: false,
    emailPlaceholder: 'doctor@hospital.com',
    hint: 'Doctor accounts are created by the Platform Administrator.',
  },
  admin: {
    label:      'Admin Portal',
    heading:    'Administrator sign in',
    sub:        'Manage doctors, patients, and platform settings',
    gradient:   'from-purple-900/90 via-purple-900/70 to-neutral-900/80',
    accent:     'text-purple-300',
    accentBg:   'bg-purple-600',
    statAccent: 'text-purple-300',
    image:      'https://images.pexels.com/photos/5452298/pexels-photo-5452298.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop',
    stats: [
      { v: 'RBAC',  l: 'Role-Based Access' },
      { v: '100%',  l: 'Audit Logged'      },
      { v: 'JWT',   l: 'Secured Sessions'  },
      { v: 'Live',  l: 'Platform Status'   },
    ],
    pitch:   'MediConnect platform administration.',
    pitchSub:'Verify doctors, manage users, monitor consultations, and oversee platform operations.',
    switchLinks: [
      { href: '/login/patient', label: 'Patient login' },
      { href: '/login/doctor',  label: 'Doctor login'  },
    ],
    registerLink: false,
    emailPlaceholder: 'admin@mediconnect.com',
    hint: 'Default: Admin@12345',
  },
}

export default function Login({ role = 'patient' }) {
  const cfg                   = ROLE_CONFIG[role]
  const navigate              = useNavigate()
  const { login, logout, isLoading } = useAuth()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setServerError('')
    const result = await login(data)
    if (!result.success) {
      setServerError(result.message)
      return
    }
    if (result.user.role !== role) {
      logout()
      const labels = { patient: 'Patient', doctor: 'Doctor', admin: 'Administrator' }
      setServerError(
        `This account is registered as a ${labels[result.user.role]}. Please use the ${labels[result.user.role]} login.`
      )
      return
    }
    const routes = { patient: '/patient', doctor: '/doctor', admin: '/admin' }
    navigate(routes[result.user.role] || '/')
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col">
        <img
          src={cfg.image}
          alt={cfg.label}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient}`} />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <HeartIcon />
            </div>
            <span className="font-bold text-white text-lg">Medi<span className={cfg.accent}>Connect</span></span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <p className={`text-xs font-semibold ${cfg.accent} uppercase tracking-widest mb-4`}>
              {cfg.label}
            </p>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              {cfg.pitch}
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed max-w-xs">
              {cfg.pitchSub}
            </p>

            <div className="grid grid-cols-2 gap-4 mt-10">
              {cfg.stats.map(({ v, l }) => (
                <div key={l} className="bg-white/10 border border-white/10 rounded-xl px-4 py-3">
                  <p className={`font-bold text-lg ${cfg.statAccent}`}>{v}</p>
                  <p className="text-neutral-400 text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-neutral-500 text-xs">© 2025 MediConnect · Final Year Project · Edo State Telemedicine</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-7">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <HeartIcon />
            </div>
            <span className="font-bold text-neutral-900">Medi<span className="text-blue-600">Connect</span></span>
          </Link>

          {/* Portal badge */}
          {(() => {
            const cls = role === 'patient'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : role === 'doctor'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-purple-50 text-purple-700 border-purple-200'
            return (
              <div className={`inline-flex items-center gap-2 border text-sm font-medium px-3 py-1.5 rounded-full ${cls}`}>
                <RoleIcon role={role} />
                {cfg.label}
              </div>
            )
          })()}

          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{cfg.heading}</h1>
            <p className="text-sm text-neutral-500 mt-1">{cfg.sub}</p>
          </div>

          {serverError && <Alert variant="error">{serverError}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email Address"
              type="email"
              placeholder={cfg.emailPlaceholder}
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern:  { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              required
              hint={cfg.hint}
              error={errors.password?.message}
              {...register('password', {
                required:  'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />

            <div className="flex items-center justify-end">
              <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Forgot password?
              </button>
            </div>

            <Button type="submit" fullWidth size="lg" isLoading={isLoading} variant="primary">
              {isLoading ? 'Signing in…' : `Sign In — ${cfg.label}`}
            </Button>
          </form>

          {cfg.registerLink && (
            <p className="text-sm text-center text-neutral-500">
              New patient?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                Create a free account
              </Link>
            </p>
          )}
          {!cfg.registerLink && (
            <p className="text-xs text-center text-neutral-400 leading-relaxed">
              {role === 'doctor'
                ? 'Doctor accounts are provisioned by the Platform Administrator.'
                : 'Admin credentials are pre-configured. Contact the system administrator.'}
            </p>
          )}

          {/* Portal switcher */}
          <div className="border-t border-neutral-100 pt-5">
            <p className="text-xs text-neutral-400 text-center mb-3">Other portals</p>
            <div className="flex gap-2 justify-center">
              {cfg.switchLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  to={href}
                  className="text-xs border border-neutral-200 text-neutral-500 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {label}
                </Link>
              ))}
              <Link to="/" className="text-xs border border-neutral-200 text-neutral-500 hover:border-blue-300 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 13.5C8 13.5 2 9.5 2 5.5a3.5 3.5 0 016-2.45A3.5 3.5 0 0114 5.5c0 4-6 8-6 8z" fill="white" fillOpacity="0.9"/>
    </svg>
  )
}

function RoleIcon({ role }) {
  if (role === 'patient') return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="8" cy="5.5" r="2.5"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
    </svg>
  )
  if (role === 'doctor') return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="8" cy="5" r="2.5"/><path d="M3 14c0-2.5 2-4 5-4s5 1.5 5 4"/>
      <path d="M6 10.5h4M8 8.5v4"/>
    </svg>
  )
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 1.5L2.5 4v4c0 3 2.5 4.5 5.5 5.5 3-1 5.5-2.5 5.5-5.5V4L8 1.5z"/>
      <path d="M5.5 8l2 2 3-3"/>
    </svg>
  )
}
