import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TvMenu from './pages/TvMenu'
import Admin from './pages/Admin'

export default function App() {
  // basename follows Vite's base so /tv and /admin work both at the GitHub
  // Pages project path and (after switching BUILD_BASE to '/') a root domain.
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tv" element={<TvMenu />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}
