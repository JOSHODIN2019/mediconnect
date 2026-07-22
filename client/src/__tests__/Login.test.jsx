import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/Login'

// Mock useAuth so Login doesn't need real auth context
const mockLogin = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, isAuthenticated: false }),
}))

// Mock useNavigate so navigation doesn't throw
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

function renderLogin(role = 'patient') {
  return render(
    <MemoryRouter>
      <Login role={role} />
    </MemoryRouter>
  )
}

describe('Login page — patient role', () => {
  beforeEach(() => {
    mockLogin.mockReset()
  })

  it('renders email and password fields', () => {
    renderLogin('patient')
    expect(screen.getByPlaceholderText(/patient@email\.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
  })

  it('shows submit button', () => {
    renderLogin('patient')
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation error when submitting empty email', async () => {
    const user = userEvent.setup()
    renderLogin('patient')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
  })

  it('shows validation error for invalid email format', async () => {
    const user = userEvent.setup()
    renderLogin('patient')
    await user.type(screen.getByPlaceholderText(/patient@email\.com/i), 'notanemail')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('shows validation error when password is empty', async () => {
    const user = userEvent.setup()
    renderLogin('patient')
    await user.type(screen.getByPlaceholderText(/patient@email\.com/i), 'test@email.com')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('calls login() with email and password on valid submit', async () => {
    mockLogin.mockResolvedValue({ success: true, user: { role: 'patient' } })
    const user = userEvent.setup()
    renderLogin('patient')
    await user.type(screen.getByPlaceholderText(/patient@email\.com/i), 'tunde@email.com')
    await user.type(screen.getByPlaceholderText(/password/i), 'Patient@123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'tunde@email.com', password: 'Patient@123' })
    })
  })
})

describe('Login page — admin role', () => {
  it('shows Admin Portal heading', () => {
    renderLogin('admin')
    expect(screen.getByText(/administrator sign in/i)).toBeInTheDocument()
  })

  it('uses admin email placeholder', () => {
    renderLogin('admin')
    expect(screen.getByPlaceholderText(/admin@mediconnect\.com/i)).toBeInTheDocument()
  })

  it('does not render a Register link', () => {
    renderLogin('admin')
    expect(screen.queryByText(/register/i)).not.toBeInTheDocument()
  })
})

describe('Login page — doctor role', () => {
  it('shows Doctor sign in heading', () => {
    renderLogin('doctor')
    expect(screen.getByText(/doctor sign in/i)).toBeInTheDocument()
  })

  it('shows doctor-created-by-admin hint', () => {
    renderLogin('doctor')
    expect(screen.getByText(/created by the platform administrator/i)).toBeInTheDocument()
  })
})
