import { useState } from 'react'
import {
  Button, Spinner, Input, Card, CardHeader, CardBody, CardFooter,
  Badge, RoleBadge, StatusBadge, Alert, Avatar, Modal, ModalHeader,
  ModalBody, ModalFooter, Divider,
} from '@/components/ui'

export default function DesignSystem() {
  const [modalOpen, setModalOpen] = useState(false)
  const [emailVal, setEmailVal] = useState('')
  const [passVal, setPassVal] = useState('')

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 px-8 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5h2v4H7V5zm0 5h2v2H7v-2z" />
              </svg>
            </div>
            <span className="font-semibold text-neutral-900">MedRec</span>
            <span className="text-neutral-300">/</span>
            <span className="text-sm text-neutral-500">Design System</span>
          </div>
          <Badge variant="primary">Stage 2</Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12 space-y-16">

        {/* ── COLOR PALETTE ── */}
        <Section title="Color Palette" description="Brand tokens used across every component">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Primary 600', hex: '#2563eb', cls: 'bg-blue-600' },
              { label: 'Primary 500', hex: '#3b82f6', cls: 'bg-blue-500' },
              { label: 'Primary 100', hex: '#dbeafe', cls: 'bg-blue-100' },
              { label: 'Accent 600',  hex: '#059669', cls: 'bg-emerald-600' },
              { label: 'Accent 500',  hex: '#10b981', cls: 'bg-emerald-500' },
              { label: 'Accent 100',  hex: '#d1fae5', cls: 'bg-emerald-100' },
              { label: 'Danger 600',  hex: '#dc2626', cls: 'bg-red-600' },
              { label: 'Warning 500', hex: '#f59e0b', cls: 'bg-amber-500' },
              { label: 'Neutral 900', hex: '#0f172a', cls: 'bg-neutral-900' },
              { label: 'Neutral 600', hex: '#475569', cls: 'bg-neutral-600' },
              { label: 'Neutral 200', hex: '#e2e8f0', cls: 'bg-neutral-200 border border-neutral-300' },
              { label: 'Neutral 50',  hex: '#f8fafc', cls: 'bg-neutral-50 border border-neutral-200' },
            ].map(({ label, hex, cls }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex-shrink-0 ${cls}`} />
                <div>
                  <p className="text-xs font-medium text-neutral-800">{label}</p>
                  <p className="text-xs text-neutral-400 font-mono">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── TYPOGRAPHY ── */}
        <Section title="Typography" description="Inter font family — all weights and sizes">
          <div className="space-y-4">
            <div><p className="text-3xl font-bold text-neutral-900">Display / 30px Bold</p><p className="text-xs text-neutral-400 mt-1">text-3xl font-bold</p></div>
            <Divider />
            <div><p className="text-2xl font-semibold text-neutral-900">Heading 1 / 24px Semibold</p><p className="text-xs text-neutral-400 mt-1">text-2xl font-semibold</p></div>
            <div><p className="text-xl font-semibold text-neutral-900">Heading 2 / 20px Semibold</p><p className="text-xs text-neutral-400 mt-1">text-xl font-semibold</p></div>
            <div><p className="text-lg font-medium text-neutral-900">Heading 3 / 18px Medium</p><p className="text-xs text-neutral-400 mt-1">text-lg font-medium</p></div>
            <Divider />
            <div><p className="text-base text-neutral-700">Body / 16px Regular — The patient record was uploaded successfully and hash verified on-chain.</p><p className="text-xs text-neutral-400 mt-1">text-base</p></div>
            <div><p className="text-sm text-neutral-600">Small / 14px — Used for labels, descriptions, and secondary content.</p><p className="text-xs text-neutral-400 mt-1">text-sm</p></div>
            <div><p className="text-xs text-neutral-400">Caption / 12px — Used for hints, timestamps, and metadata.</p><p className="text-xs text-neutral-400 mt-1">text-xs</p></div>
            <div><p className="text-sm font-mono text-neutral-700 bg-neutral-100 px-2 py-1 rounded inline-block">0x3f4A...e8c2 — Monospace for hashes and addresses</p></div>
          </div>
        </Section>

        {/* ── BUTTONS ── */}
        <Section title="Buttons" description="All variants, sizes, and states">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Variants</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="outline-primary">Outline Primary</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Sizes</p>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">States</p>
              <div className="flex flex-wrap gap-3">
                <Button isLoading>Uploading…</Button>
                <Button disabled>Disabled</Button>
                <Button variant="outline" isLoading>Processing</Button>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Full Width</p>
              <Button fullWidth>Full Width Button</Button>
            </div>
          </div>
        </Section>

        {/* ── INPUTS ── */}
        <Section title="Inputs" description="Text fields with all states and variants">
          <div className="grid md:grid-cols-2 gap-5">
            <Input label="Full Name" placeholder="John Doe" required />
            <Input label="Email Address" type="email" placeholder="john@example.com" hint="We'll never share your email." />
            <Input label="Password" type="password" placeholder="Min. 8 characters" required />
            <Input label="Error State" placeholder="Invalid input" error="This field is required." />
            <Input label="Disabled" placeholder="Cannot edit" disabled />
            <Input label="Patient ID" placeholder="PAT-000001" hint="Auto-generated after registration." />
          </div>
        </Section>

        {/* ── CARDS ── */}
        <Section title="Cards" description="Container components for grouping content">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader title="Default Card" subtitle="Standard elevation" />
              <CardBody><p className="text-sm text-neutral-600">Card content goes here. Used for patient records, forms, and data sections.</p></CardBody>
              <CardFooter><Button size="sm" variant="outline">Action</Button></CardFooter>
            </Card>
            <Card variant="elevated">
              <CardHeader title="Elevated Card" subtitle="Higher shadow depth" />
              <CardBody><p className="text-sm text-neutral-600">Used for featured sections, dashboards, and primary call-to-action areas.</p></CardBody>
              <CardFooter><Button size="sm">Primary</Button></CardFooter>
            </Card>
            <Card variant="flat">
              <CardHeader title="Flat Card" subtitle="Minimal style" />
              <CardBody><p className="text-sm text-neutral-600">Used inside other cards or for secondary grouping.</p></CardBody>
              <CardFooter><Button size="sm" variant="ghost">Learn more</Button></CardFooter>
            </Card>
          </div>
        </Section>

        {/* ── BADGES ── */}
        <Section title="Badges" description="Status and role indicators">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Color Variants</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="neutral">Neutral</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="purple">Purple</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">With Dot Indicator</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success" withDot>Active</Badge>
                <Badge variant="warning" withDot>Pending</Badge>
                <Badge variant="danger" withDot>Revoked</Badge>
                <Badge variant="neutral" withDot>Inactive</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Role Badges</p>
              <div className="flex flex-wrap gap-2">
                <RoleBadge role="admin" />
                <RoleBadge role="doctor" />
                <RoleBadge role="patient" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Status Badges</p>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="active" />
                <StatusBadge status="inactive" />
                <StatusBadge status="pending" />
                <StatusBadge status="revoked" />
                <StatusBadge status="verified" />
                <StatusBadge status="tampered" />
              </div>
            </div>
          </div>
        </Section>

        {/* ── ALERTS ── */}
        <Section title="Alerts" description="Feedback messages for all system states">
          <div className="space-y-3">
            <Alert variant="info" title="Information">MetaMask wallet detected. Connect your wallet to continue.</Alert>
            <Alert variant="success" title="Record Uploaded">Medical record uploaded and SHA-256 hash stored successfully.</Alert>
            <Alert variant="warning" title="Access Expiring">Dr. Adaeze's access to your records expires in 3 days.</Alert>
            <Alert variant="error" title="Tamper Detected" dismissible>Hash mismatch — this record may have been modified after upload.</Alert>
          </div>
        </Section>

        {/* ── AVATARS ── */}
        <Section title="Avatars" description="User identity indicators">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Sizes</p>
              <div className="flex items-center gap-4">
                <Avatar name="Chukwuemeka Obi" size="xs" />
                <Avatar name="Adaeze Nwosu" size="sm" />
                <Avatar name="Tunde Bello" size="md" />
                <Avatar name="Ngozi Eze" size="lg" />
                <Avatar name="Emeka Dike" size="xl" />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wide">Color Variants (auto from name)</p>
              <div className="flex items-center gap-3">
                {['Dr. Amara', 'Patient Olu', 'Admin K', 'Dr. Fatima', 'Bola A'].map(n => (
                  <Avatar key={n} name={n} size="md" />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── MODAL ── */}
        <Section title="Modal" description="Overlay dialogs for confirmations and forms">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="md">
            <ModalHeader
              title="Confirm Access Grant"
              subtitle="Review before granting access to your records"
              onClose={() => setModalOpen(false)}
            />
            <ModalBody>
              <Alert variant="warning" title="You are about to share medical records">
                Dr. Chukwuemeka Obi will be able to view your records until access is revoked.
              </Alert>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                  <Avatar name="Chukwuemeka Obi" size="md" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Dr. Chukwuemeka Obi</p>
                    <p className="text-xs text-neutral-500">Cardiologist • Lagos University Teaching Hospital</p>
                  </div>
                  <RoleBadge role="doctor" />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="success" onClick={() => setModalOpen(false)}>Grant Access</Button>
            </ModalFooter>
          </Modal>
        </Section>

        {/* ── SPINNER ── */}
        <Section title="Spinners" description="Loading state indicators">
          <div className="flex items-center gap-6">
            {['xs', 'sm', 'md', 'lg', 'xl'].map(s => (
              <div key={s} className="flex flex-col items-center gap-2">
                <Spinner size={s} />
                <span className="text-xs text-neutral-400">{s}</span>
              </div>
            ))}
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Spinner size="md" color="white" />
              </div>
              <span className="text-xs text-neutral-400">on dark</span>
            </div>
          </div>
        </Section>

        {/* ── DIVIDERS ── */}
        <Section title="Dividers" description="Section separators">
          <div className="space-y-4">
            <Divider />
            <Divider label="OR" />
            <Divider label="Continue with wallet" />
          </div>
        </Section>

      </main>
    </div>
  )
}

function Section({ title, description, children }) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        <p className="text-sm text-neutral-500 mt-0.5">{description}</p>
      </div>
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]">
        {children}
      </div>
    </section>
  )
}
