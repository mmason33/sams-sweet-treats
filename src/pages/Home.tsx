import { useMenu } from '../hooks/useMenu'
import MenuList from '../components/MenuList'

// TODO: replace with Sam's real Toast online-ordering link when available
const TOAST_ORDER_URL = 'https://www.toasttab.com/'

const links = [
  { label: 'Order Ahead', href: TOAST_ORDER_URL },
  { label: 'Instagram', href: 'https://instagram.com/' },
  { label: 'Facebook', href: 'https://facebook.com/' },
]

const photos = [
  'sams-trailer-1.jpg',
  'sam-cinnamon-rolls.jpg',
  'sam-treat-1.jpg',
  'sams-trail-2.jpg',
]

export default function Home() {
  const { items, loading } = useMenu()

  return (
    <main className="min-h-full">
      {/* Hero */}
      <header className="flex flex-col items-center text-center gap-4 py-12 px-6 bg-cocoa text-cream">
        <img
          src="./images/sams-logo.jpg"
          alt="Sam's Sweet Treats & Coffee logo"
          className="w-40 h-40 rounded-full object-cover shadow-lg"
        />
        <h1 className="text-4xl font-extrabold">Sam's Sweet Treats &amp; Coffee</h1>
        <p className="max-w-xl text-cream/90">
          Fresh coffee and handmade treats from our trailer. Find us on the trail!
        </p>
        <nav className="flex flex-wrap justify-center gap-3 pt-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2 rounded-full bg-berry text-white font-semibold hover:opacity-90"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </header>

      {/* Menu */}
      <section className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-cocoa mb-6">Menu</h2>
        {loading ? (
          <p className="text-cocoa/70 italic">Loading menu…</p>
        ) : (
          <MenuList items={items} />
        )}
      </section>

      {/* Gallery */}
      <section className="max-w-4xl mx-auto px-6 pb-16 grid grid-cols-2 md:grid-cols-4 gap-3">
        {photos.map((p) => (
          <img
            key={p}
            src={`./images/${p}`}
            alt=""
            className="aspect-square w-full object-cover rounded-lg"
          />
        ))}
      </section>
    </main>
  )
}
