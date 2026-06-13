import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { MenuItem } from './lib/menuTypes'

const items: MenuItem[] = [
  { id: '1', name: 'Latte', description: '', price: 4.5, category: 'Coffee', available: true, sortOrder: 0 },
]
vi.mock('./hooks/useMenu', () => ({ useMenu: () => ({ items, loading: false }) }))
// Signed-in so /admin renders the editor (not the login form)
vi.mock('./hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'u1' }, loading: false }) }))

import App from './App'

function navigate(path: string) {
  window.history.pushState({}, '', path)
}

describe('App routing', () => {
  it('renders Home at /', () => {
    navigate('/')
    render(<App />)
    expect(screen.getByText('Our Story')).toBeInTheDocument()
  })

  it('renders the TV menu at /tv — a distinct page from Home and Admin', () => {
    navigate('/tv')
    render(<App />)
    expect(screen.getByText('Latte')).toBeInTheDocument()
    // "Our Story" is Home-only; "Menu Admin" is Admin-only.
    expect(screen.queryByText('Our Story')).not.toBeInTheDocument()
    expect(screen.queryByText('Menu Admin')).not.toBeInTheDocument()
  })

  it('renders Admin at /admin', () => {
    navigate('/admin')
    render(<App />)
    expect(screen.getByText('Menu Admin')).toBeInTheDocument()
  })
})
