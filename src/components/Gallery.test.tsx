import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Gallery from './Gallery'

const photos = ['a.jpg', 'b.jpg', 'c.jpg']

describe('Gallery', () => {
  it('renders a thumbnail button per photo and no lightbox initially', () => {
    render(<Gallery photos={photos} />)
    expect(screen.getAllByRole('button', { name: /open photo/i })).toHaveLength(3)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the lightbox on the clicked photo', async () => {
    const user = userEvent.setup()
    render(<Gallery photos={photos} />)
    await user.click(screen.getByRole('button', { name: 'Open photo 2' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAccessibleName('Photo 2 of 3')
  })

  it('navigates to the next photo and wraps around', async () => {
    const user = userEvent.setup()
    render(<Gallery photos={photos} />)
    await user.click(screen.getByRole('button', { name: 'Open photo 3' }))
    await user.click(screen.getByRole('button', { name: /next photo/i }))
    // 3 -> wraps to 1
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Photo 1 of 3')
  })

  it('closes the lightbox', async () => {
    const user = userEvent.setup()
    render(<Gallery photos={photos} />)
    await user.click(screen.getByRole('button', { name: 'Open photo 1' }))
    await user.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
