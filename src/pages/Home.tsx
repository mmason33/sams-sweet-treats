import { useMenu } from '../hooks/useMenu'
import MenuList from '../components/MenuList'
import Nav from '../components/Nav'
import { MapPinIcon, ClockIcon } from '../components/icons'

const LOGO = `${import.meta.env.BASE_URL}images/sams-logo-icons.png`
const ADDRESS = '19660 CA-88, Pine Grove, CA 95665'
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`
const ORDER_URL = 'https://order.toasttab.com/online/sam-s-sweet-treats-and-coffee-19660-ca-88'

const galleryPhotos = [
  'sam-cinnamon-rolls.jpg',
  'sam-treat-1.jpg',
  'sam-treat-2.jpg',
  'sam-treat-3.jpg',
  'sam-treat-4.jpg',
  'sam-treat-6.jpg',
]

export default function Home() {
  const { items, loading } = useMenu()

  return (
    <div className="min-h-full">
      <Nav />

      {/* Brand intro */}
      <header className="brand-gradient px-6 pb-12 pt-24 text-center">
        <img
          src={LOGO}
          alt="Sam's Sweet Treats & Coffee logo"
          className="mx-auto h-40 w-40 object-contain sm:h-48 sm:w-48"
        />
        <h1 className="mt-2 font-display text-4xl text-cocoa sm:text-5xl">
          Sam's Sweet Treats &amp; Coffee
        </h1>
        <p className="mx-auto mt-3 max-w-md text-cocoa/70">
          Fresh coffee and handmade treats, served from our little pink trailer.
        </p>

        {/* Info chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-cocoa shadow-sm ring-1 ring-cocoa/5 transition hover:bg-white"
          >
            <MapPinIcon className="h-4 w-4 text-berry" />
            Pine Grove, CA
          </a>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-cocoa shadow-sm ring-1 ring-cocoa/5">
            <ClockIcon className="h-4 w-4 text-berry" />
            Open 7 days · 5am–3pm
          </span>
        </div>

        {/* Primary call to action */}
        <div className="mt-7">
          <a
            href={ORDER_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full bg-berry px-8 py-3 text-base font-bold text-cream shadow-md shadow-berry/30 transition hover:bg-berry/90"
          >
            Order Online
          </a>
        </div>
      </header>

      {/* Story */}
      <section className="mx-auto max-w-2xl px-6 py-12 text-center">
        <h2 className="font-display text-3xl text-berry">Our Story</h2>
        <p className="mt-4 text-lg leading-relaxed text-cocoa/80">
          Sam has always loved baking. What started as treats for friends and
          family grew into a small business on wheels — and a whole lot of happy
          regulars. Every cinnamon roll, muffin, and cup of coffee is made fresh
          with care, right here in Pine Grove.
        </p>
      </section>

      {/* Menu */}
      <section className="mx-auto max-w-2xl px-6 pb-12">
        <h2 className="mb-6 text-center font-display text-4xl text-cocoa">Menu</h2>
        {loading ? (
          <p className="text-center italic text-cocoa/60">Loading menu…</p>
        ) : (
          <MenuList items={items} />
        )}
      </section>

      {/* Gallery */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {galleryPhotos.map((p) => (
            <img
              key={p}
              src={`${import.meta.env.BASE_URL}images/${p}`}
              alt=""
              loading="lazy"
              className="aspect-square w-full rounded-2xl object-cover shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md"
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-cocoa px-6 py-10 text-center text-cream">
        <p className="font-display text-2xl">Sam's Sweet Treats &amp; Coffee</p>
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm text-cream/80 underline-offset-2 hover:underline"
        >
          {ADDRESS}
        </a>
        <p className="mt-1 text-sm text-cream/80">Open 7 days a week, 5am–3pm</p>
      </footer>
    </div>
  )
}
