import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mediconnect_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', readOnly = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      style={{
        width: '100%', padding: '10px 12px', fontSize: '14px',
        border: '1.5px solid #e5e7eb', borderRadius: '8px',
        background: readOnly ? '#f9fafb' : '#fff', color: '#111827',
        outline: 'none', boxSizing: 'border-box',
        cursor: readOnly ? 'default' : 'text',
        transition: 'border 0.15s',
      }}
      onFocus={e => { if (!readOnly) e.target.style.border = '1.5px solid #2563eb' }}
      onBlur={e => { e.target.style.border = '1.5px solid #e5e7eb' }}
    />
  )
}

function SaveBtn({ loading, label = 'Save Changes' }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        padding: '10px 24px', background: loading ? '#93c5fd' : '#2563eb',
        color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px',
        fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
      }}
    >
      {loading ? 'Saving…' : label}
    </button>
  )
}

function AlertMsg({ type, message }) {
  if (!message) return null
  const colors = {
    success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
    error:   { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
  }
  const c = colors[type] || colors.error
  return (
    <div style={{ padding: '10px 14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '8px', color: c.text, fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>
      {message}
    </div>
  )
}

function Section({ title, subtitle, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px', marginBottom: '24px' }}>
      <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { user, setUser } = useAuth()
  const role = user?.role

  const [profile, setProfile]       = useState({ fullName: '', phone: '', dateOfBirth: '', specialization: '', hospital: '', licenseNumber: '' })
  const [profileLoading, setPL]     = useState(false)
  const [profileMsg, setProfileMsg] = useState(null)

  const [pwd, setPwd]         = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwdLoading, setPWL]  = useState(false)
  const [pwdMsg, setPwdMsg]   = useState(null)

  useEffect(() => {
    api.get('/settings').then(res => {
      const u = res.data.user
      setProfile({
        fullName:       u.fullName       || '',
        phone:          u.phone          || '',
        dateOfBirth:    u.dateOfBirth    ? u.dateOfBirth.split('T')[0] : '',
        specialization: u.specialization || '',
        hospital:       u.hospital       || '',
        licenseNumber:  u.licenseNumber  || '',
      })
    }).catch(() => {})
  }, [])

  const submitProfile = async (e) => {
    e.preventDefault()
    setProfileMsg(null)
    setPL(true)
    try {
      const res = await api.put('/settings/profile', profile)
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' })
      if (setUser) setUser(prev => ({ ...prev, fullName: res.data.user.fullName }))
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' })
    } finally {
      setPL(false)
    }
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    setPwdMsg(null)
    if (pwd.newPassword !== pwd.confirmPassword) {
      return setPwdMsg({ type: 'error', text: 'New passwords do not match.' })
    }
    setPWL(true)
    try {
      await api.put('/settings/password', pwd)
      setPwdMsg({ type: 'success', text: 'Password changed successfully.' })
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' })
    } finally {
      setPWL(false)
    }
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 24px' }}>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#111827', margin: 0 }}>Settings</h1>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>Manage your account profile and password.</p>
      </div>

      <Section title="Account Information" subtitle="Your account details — these cannot be changed.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User ID</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb', fontFamily: 'monospace' }}>{user?.userId}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
            <div style={{ fontSize: '14px', color: '#374151' }}>{user?.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member Since</div>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Profile" subtitle="Update your personal information.">
        <form onSubmit={submitProfile}>
          <AlertMsg type={profileMsg?.type} message={profileMsg?.text} />

          <Field label="Full Name">
            <TextInput value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} placeholder="Your full name" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="Phone Number">
              <TextInput value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+234 800 000 0000" />
            </Field>
            {role !== 'admin' && (
              <Field label="Date of Birth">
                <TextInput type="date" value={profile.dateOfBirth} onChange={e => setProfile(p => ({ ...p, dateOfBirth: e.target.value }))} />
              </Field>
            )}
          </div>

          {role === 'doctor' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field label="Specialization">
                  <TextInput value={profile.specialization} onChange={e => setProfile(p => ({ ...p, specialization: e.target.value }))} placeholder="e.g. Cardiology" />
                </Field>
                <Field label="Hospital / Clinic">
                  <TextInput value={profile.hospital} onChange={e => setProfile(p => ({ ...p, hospital: e.target.value }))} placeholder="e.g. LUTH" />
                </Field>
              </div>
              <Field label="License Number">
                <TextInput value={profile.licenseNumber} onChange={e => setProfile(p => ({ ...p, licenseNumber: e.target.value }))} placeholder="Medical license number" />
              </Field>
            </>
          )}

          <SaveBtn loading={profileLoading} />
        </form>
      </Section>

      <Section title="Change Password" subtitle="Use a strong password with letters, numbers, and symbols.">
        <form onSubmit={submitPassword}>
          <AlertMsg type={pwdMsg?.type} message={pwdMsg?.text} />

          <Field label="Current Password">
            <TextInput type="password" value={pwd.currentPassword} onChange={e => setPwd(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Enter your current password" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="New Password">
              <TextInput type="password" value={pwd.newPassword} onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min. 8 characters" />
            </Field>
            <Field label="Confirm New Password">
              <TextInput type="password" value={pwd.confirmPassword} onChange={e => setPwd(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
            </Field>
          </div>
          <SaveBtn loading={pwdLoading} label="Change Password" />
        </form>
      </Section>

    </div>
  )
}
