import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import TvMenu from './pages/TvMenu'
import Admin from './pages/Admin'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tv" element={<TvMenu />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </HashRouter>
  )
}
