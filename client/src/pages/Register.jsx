import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'
import { Button, Input, Alert } from '@/components/ui'

const EDO_LGAS = [
  'Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East',
  'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben',
  'Ikpoba-Okha', 'Oredo', 'Orhionmwon', 'Ovia North-East', 'Ovia South-West',
  'Owan East', 'Owan West', 'Uhunmwonde',
]

const IMG = 'https://images.pexels.com/photos/4989132/pexels-photo-4989132.jpeg?auto=compress&cs=tinysrgb&w=900&h=1200&fit=crop'

export default function Register() {
  const navigate                        = useNavigate()
  const { register: signup, isLoading } = useAuth()
  const [serverError, setServerError]   = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { state: 'Edo State' },
  })
  const password = watch('password')

  const onSubmit = async (data) => {
    setServerError('')
    const { confirmPassword, ...rest } = data
    const result = await signup(rest)
    if (result.success) {
      navigate('/patient')
    } else {
      setServerError(result.message)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[40%] relative flex-col">
        <img src={IMG} alt="Nigerian patient" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/92 via-blue-900/80 to-neutral-900/80" />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <HeartIcon />
            </div>
            <span className="font-bold text-white text-lg">Medi<span className="text-blue-300">Connect</span></span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-4">
              Patient Registration
            </p>
            <h2 className="text-3xl font-bold text-white leading-snug mb-4">
              Quality healthcare,<br />from wherever<br />you are.
            </h2>
            <p className="text-neutral-300 text-sm leading-relaxed max-w-xs">
              Create your free MediConnect account and book a consultation with a licensed Nigerian doctor — without ever leaving your community.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { icon: <VideoIcon />,      text: 'HD video consultations on 2G/3G'       },
                { icon: <ShieldIcon />,     text: 'Your health data is private and secure' },
                { icon: <PrescriptionIcon />,text: 'Digital prescriptions sent instantly'   },
                { icon: <MapPinIcon />,     text: 'Serving all 18 LGAs in Edo State'       },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <span className="text-sm text-neutral-300">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-neutral-500 text-xs">© 2025 MediConnect · Final Year Project · Telemedicine for Rural Edo State</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto space-y-6">

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <HeartIcon />
            </div>
            <span className="font-bold text-neutral-900">Medi<span className="text-blue-600">Connect</span></span>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Create your account</h1>
            <p className="text-sm text-neutral-500 mt-1">Patient registration — free, no approval needed</p>
          </div>

          {serverError && <Alert variant="error">{serverError}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {/* Full Name */}
            <Input
              label="Full Name"
              placeholder="e.g. Chukwuemeka Obi"
              required
              error={errors.fullName?.message}
              {...register('fullName', {
                required:  'Full name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
              })}
            />

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              required
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern:  { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
              })}
            />

            {/* Phone + DOB */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+234 800 000 0000"
                error={errors.phone?.message}
                {...register('phone', {
                  pattern: { value: /^[+\d\s\-()]{7,15}$/, message: 'Enter a valid phone number' },
                })}
              />
              <Input
                label="Date of Birth"
                type="date"
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth')}
              />
            </div>

            {/* State + LGA */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="State"
                value="Edo State"
                readOnly
                className="bg-neutral-50 text-neutral-500 cursor-not-allowed"
                {...register('state')}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">
                  Local Govt. Area
                </label>
                <select
                  className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  {...register('lga', { required: 'Please select your LGA' })}
                  defaultValue=""
                >
                  <option value="" disabled>Select LGA</option>
                  {EDO_LGAS.map(lga => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </select>
                {errors.lga && (
                  <p className="text-xs text-red-600">{errors.lga.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              required
              hint="Use a mix of uppercase, lowercase, and numbers"
              error={errors.password?.message}
              {...register('password', {
                required:  'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value:   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Must include uppercase, lowercase, and a number',
                },
              })}
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === password || 'Passwords do not match',
              })}
            />

            <Button type="submit" fullWidth size="lg" isLoading={isLoading} variant="primary">
              {isLoading ? 'Creating account…' : 'Create Account — Free'}
            </Button>
          </form>

          <p className="text-sm text-center text-neutral-500">
            Already have an account?{' '}
            <Link to="/login/patient" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </p>

          <p className="text-xs text-center text-neutral-400 leading-relaxed">
            By registering, you agree to use MediConnect for legitimate healthcare consultation.
            <br />Doctors and Admins are provisioned by the Administrator.
          </p>
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
function VideoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="3" width="8" height="8" rx="1.5" fill="white" fillOpacity="0.9"/>
      <path d="M9 5.5l4-2v7l-4-2V5.5z" fill="white" fillOpacity="0.9"/>
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 1L2 3v4c0 2.8 2 4.5 5 5.5 3-1 5-2.7 5-5.5V3L7 1z" fill="white" fillOpacity="0.9"/>
      <path d="M5 7l1.5 1.5L9.5 5.5" stroke="#bfdbfe" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
function PrescriptionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.9">
      <path d="M10 1H4a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V2a1 1 0 00-1-1z"/>
      <path d="M5 5h1v3M5 6.5h2"/>
    </svg>
  )
}
function MapPinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.9">
      <path d="M7 1a4 4 0 014 4c0 3-4 8-4 8S3 8 3 5a4 4 0 014-4z"/>
      <circle cx="7" cy="5" r="1.5"/>
    </svg>
  )
}
