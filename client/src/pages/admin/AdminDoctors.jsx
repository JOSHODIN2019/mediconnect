import { useState, useEffect } from 'react'
import { adminService } from '@/services/adminService'
import { Button, Input, Alert, Avatar, Badge, StatusBadge, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Card, CardBody } from '@/components/ui'
import { useForm } from 'react-hook-form'

export default function AdminDoctors() {
  const [doctors,  setDoctors]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [search,   setSearch]   = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting,   setSubmitting]   = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = async () => {
    try {
      const data = await adminService.getDoctors()
      setDoctors(data.doctors)
    } catch {
      setError('Could not load doctors — start the backend server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = doctors.filter(d =>
    `${d.fullName} ${d.email} ${d.specialization} ${d.hospital}`.toLowerCase().includes(search.toLowerCase())
  )

  const onRegister = async (data) => {
    setSubmitting(true)
    setError('')
    try {
      const res = await adminService.registerDoctor(data)
      setDoctors(prev => [res.doctor, ...prev])
      setSuccess(`Dr. ${res.doctor.fullName} registered successfully.`)
      setModalOpen(false)
      reset()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register doctor.')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleVerify = async (doc) => {
    try {
      const res = await adminService.updateDoctor(doc._id, { isVerified: !doc.isVerified })
      setDoctors(prev => prev.map(d => d._id === doc._id ? res.doctor : d))
    } catch { setError('Update failed.') }
  }

  const toggleActive = async (doc) => {
    try {
      const res = await adminService.updateDoctor(doc._id, { isActive: !doc.isActive })
      setDoctors(prev => prev.map(d => d._id === doc._id ? res.doctor : d))
    } catch { setError('Update failed.') }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await adminService.deleteDoctor(deleteTarget._id)
      setDoctors(prev => prev.filter(d => d._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch { setError('Delete failed.') }
  }

  if (loading) return <Loading />

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Manage Doctors</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{doctors.length} doctor{doctors.length !== 1 ? 's' : ''} registered</p>
        </div>
        <Button variant="primary" onClick={() => { setModalOpen(true); reset(); setError('') }}>
          <PlusIcon /> Register Doctor
        </Button>
      </div>

      {error   && <Alert variant="error"   dismissible>{error}</Alert>}
      {success && <Alert variant="success" dismissible>{success}</Alert>}

      {/* Search */}
      <div className="max-w-sm">
        <Input placeholder="Search by name, email, specialty…" value={search} onChange={e => setSearch(e.target.value)} icon={SearchIcon} />
      </div>

      {/* Table */}
      <Card>
        <CardBody padded={false}>
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="7" r="3"/><path d="M4 17c0-3 2.7-5 6-5s6 2 6 5"/><path d="M8 7h4M10 5v4"/></svg>
              </div>
              <p className="text-sm font-medium text-neutral-600">No doctors found</p>
              <p className="text-xs text-neutral-400 mt-1">Register a doctor to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-neutral-100">
                    {['Doctor', 'Specialty', 'Hospital', 'License', 'Verified', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc => (
                    <tr key={doc._id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={doc.fullName} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">{doc.fullName}</p>
                            <p className="text-xs text-neutral-400">{doc.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-neutral-600">{doc.specialization || '—'}</td>
                      <td className="px-5 py-4 text-sm text-neutral-500 max-w-[160px] truncate">{doc.hospital || '—'}</td>
                      <td className="px-5 py-4"><span className="font-mono text-xs text-neutral-500">{doc.licenseNumber || '—'}</span></td>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleVerify(doc)} title="Toggle verification">
                          <StatusBadge status={doc.isVerified ? 'verified' : 'pending'} />
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <button onClick={() => toggleActive(doc)} title="Toggle active">
                          <StatusBadge status={doc.isActive ? 'active' : 'inactive'} />
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="xs" variant="outline" onClick={() => toggleVerify(doc)}>
                            {doc.isVerified ? 'Unverify' : 'Verify'}
                          </Button>
                          <Button size="xs" variant="danger" onClick={() => setDeleteTarget(doc)}>
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Register Doctor Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <ModalHeader title="Register New Doctor" subtitle="Create a verified doctor account" onClose={() => setModalOpen(false)} />
        <form onSubmit={handleSubmit(onRegister)}>
          <ModalBody className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            <div className="grid grid-cols-2 gap-4">
              <Input label="Full Name" placeholder="Dr. Adaeze Nwosu" required error={errors.fullName?.message}
                {...register('fullName', { required: 'Required' })} />
              <Input label="Email" type="email" placeholder="doctor@hospital.com" required error={errors.email?.message}
                {...register('email', { required: 'Required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Password" type="password" placeholder="Min. 8 characters" required error={errors.password?.message}
                {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })} />
              <Input label="Phone" type="tel" placeholder="+234 800 000 0000"
                {...register('phone')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Specialization" placeholder="e.g. Cardiology"
                {...register('specialization')} />
              <Input label="Hospital / Clinic" placeholder="e.g. LUTH, Lagos"
                {...register('hospital')} />
            </div>
            <Input label="License Number" placeholder="e.g. MDC-2020-045"
              {...register('licenseNumber')} />
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" isLoading={submitting}>Register Doctor</Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
        <ModalHeader title="Remove Doctor" onClose={() => setDeleteTarget(null)} />
        <ModalBody>
          <Alert variant="error">
            Are you sure you want to remove <strong>{deleteTarget?.fullName}</strong>? This cannot be undone.
          </Alert>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Yes, Remove</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

function Loading() {
  return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>
}
function SearchIcon({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
}
