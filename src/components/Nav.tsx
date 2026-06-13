import { Link } from 'react-router-dom'
import { InstagramIcon, FacebookIcon } from './icons'

// TODO: replace with Sam's real social handles when available.
const INSTAGRAM_URL = 'https://instagram.com/'
const FACEBOOK_URL = 'https://facebook.com/'
const LOGO = `${import.meta.env.BASE_URL}images/sams-logo.png`

// Floating "Dynamic Island"-style pill nav, fixed at the top-center.
export default function Nav() {
  return (
    <nav className="fixed inset-x-0 top-3 z-50 flex justify-center px-3">
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-cocoa/95 px-3 py-2 text-cream shadow-xl shadow-cocoa/30 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 rounded-full pl-1 pr-1">
          <img
            src={LOGO}
            alt="Sam's Sweet Treats & Coffee"
            className="h-9 w-9 rounded-full bg-cream object-contain p-0.5"
          />
          <span className="hidden text-sm font-bold tracking-wide sm:inline">Sam's Sweet</span>
        </Link>

        <span className="mx-1 h-5 w-px bg-cream/20" />

        <div className="flex items-center gap-1">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="grid h-9 w-9 place-items-center rounded-full text-cream/90 transition hover:bg-cream/10 hover:text-cream"
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
            className="grid h-9 w-9 place-items-center rounded-full text-cream/90 transition hover:bg-cream/10 hover:text-cream"
          >
            <FacebookIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </nav>
  )
}
