import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Input, Button, Alert } from '@/components/ui'
import { useForm } from 'react-hook-form'
import api from '@/services/authService'

const EDO_LGAS = [
  'Akoko-Edo','Egor','Esan Central','Esan North-East','Esan South-East','Esan West',
  'Etsako Central','Etsako East','Etsako West','Igueben','Ikpoba-Okha','Oredo',
  'Orhionmwon','Ovia North-East','Ovia South-West','Owan East','Owan West','Uhunmwonde',
]

export default function PatientSettings() {
  const { user, refreshUser } = useAuth()
  const [success, setSuccess] = useState('')
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      fullName: user?.fullName || '',
      phone:    user?.phone    || '',
      lga:      user?.lga      || '',
      state:    'Edo State',
    },
  })

  const onSubmit = async (data) => {
    setSuccess('')
    setError('')
    setSaving(true)
    try {
      await api.put('/auth/profile', data)
      setSuccess('Profile updated successfully.')
      refreshUser?.()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your account and profile information.</p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl divide-y divide-neutral-100">

        {/* Profile section */}
        <div className="px-6 py-6">
          <h2 className="font-semibold text-neutral-900 mb-1">Profile Information</h2>
          <p className="text-xs text-neutral-500 mb-5">Update your personal details.</p>

          {success && <Alert variant="success" className="mb-4">{success}</Alert>}
          {error   && <Alert variant="error"   className="mb-4">{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Full Name"
              placeholder="Your full name"
              error={errors.fullName?.message}
              {...register('fullName', { required: 'Name is required' })}
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+234 800 000 0000"
              {...register('phone')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="State" value="Edo State" readOnly className="bg-neutral-50 text-neutral-500 cursor-not-allowed" {...register('state')} />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">LGA</label>
                <select
                  className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-xl bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  {...register('lga')}
                >
                  <option value="">Select LGA</option>
                  {EDO_LGAS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <Button type="submit" variant="primary" isLoading={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </div>

        {/* Account Info read-only */}
        <div className="px-6 py-6">
          <h2 className="font-semibold text-neutral-900 mb-1">Account Details</h2>
          <p className="text-xs text-neutral-500 mb-4">These fields cannot be changed.</p>
          <div className="space-y-3 text-sm">
            <ReadRow label="Email"      value={user?.email} />
            <ReadRow label="Patient ID" value={user?.userId} mono />
            <ReadRow label="Role"       value="Patient" />
          </div>
        </div>
      </div>
    </div>
  )
}

function ReadRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
      <span className="text-neutral-500 text-xs">{label}</span>
      <span className={`text-neutral-800 ${mono ? 'font-mono text-[12px]' : ''}`}>{value || '—'}</span>
    </div>
  )
}
