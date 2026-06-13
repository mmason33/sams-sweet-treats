import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockUseAuth = vi.fn()
vi.mock('../hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }))
vi.mock('./Login', () => ({ default: () => <div>Login Form</div> }))

import ProtectedRoute from './ProtectedRoute'

describe('ProtectedRoute', () => {
  it('shows a loading state while auth resolves', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })
    render(<ProtectedRoute><div>Secret</div></ProtectedRoute>)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('shows the login form when signed out', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    render(<ProtectedRoute><div>Secret</div></ProtectedRoute>)
    expect(screen.getByText('Login Form')).toBeInTheDocument()
    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('renders children when signed in', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' }, loading: false })
    render(<ProtectedRoute><div>Secret</div></ProtectedRoute>)
    expect(screen.getByText('Secret')).toBeInTheDocument()
  })
})
