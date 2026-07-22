import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, RoleBadge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'

// ── Badge ──────────────────────────────────────────────────────────────────
describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders a dot when withDot is true', () => {
    const { container } = render(<Badge withDot variant="success">Online</Badge>)
    const dot = container.querySelector('.rounded-full.bg-emerald-500')
    expect(dot).toBeInTheDocument()
  })

  it('applies primary variant classes', () => {
    const { container } = render(<Badge variant="primary">Primary</Badge>)
    expect(container.firstChild.className).toContain('text-blue-700')
  })

  it('applies danger variant classes', () => {
    const { container } = render(<Badge variant="danger">Error</Badge>)
    expect(container.firstChild.className).toContain('text-red-700')
  })
})

describe('RoleBadge', () => {
  it('renders Admin label for admin role', () => {
    render(<RoleBadge role="admin" />)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('renders Doctor label for doctor role', () => {
    render(<RoleBadge role="doctor" />)
    expect(screen.getByText('Doctor')).toBeInTheDocument()
  })

  it('renders Patient label for patient role', () => {
    render(<RoleBadge role="patient" />)
    expect(screen.getByText('Patient')).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it('renders Active for active status', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders Pending for pending status', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })
})

// ── Avatar ─────────────────────────────────────────────────────────────────
describe('Avatar', () => {
  it('renders initials from full name', () => {
    render(<Avatar name="Tunde Bakare" />)
    expect(screen.getByText('TB')).toBeInTheDocument()
  })

  it('renders single initial for one-word name', () => {
    render(<Avatar name="Amaka" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders ? for empty name', () => {
    render(<Avatar name="" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders image when src is provided', () => {
    render(<Avatar name="Test User" src="/avatar.jpg" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/avatar.jpg')
  })

  it('has correct aria-label', () => {
    render(<Avatar name="Dr. Emeka Okafor" />)
    expect(screen.getByLabelText('Dr. Emeka Okafor')).toBeInTheDocument()
  })
})

// ── Spinner ────────────────────────────────────────────────────────────────
describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with size prop', () => {
    const { container } = render(<Spinner size="lg" />)
    expect(container.firstChild).toBeTruthy()
  })
})
