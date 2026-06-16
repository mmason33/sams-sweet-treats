import { useMenu } from '../hooks/useMenu'
import MenuList from '../components/MenuList'
import Gallery from '../components/Gallery'
import Nav from '../components/Nav'
import { MapPinIcon, ClockIcon } from '../components/icons'

const LOGO = `${import.meta.env.BASE_URL}images/sams-logo-icons.png`
const ADDRESS = '19660 CA-88, Pine Grove, CA 95665'
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`
const ORDER_URL = 'https://order.toasttab.com/online/sam-s-sweet-treats-and-coffee-19660-ca-88'

const galleryPhotos = [
  'sam-family.jpg',
  'sam-cinnamon-rolls.jpg',
  'IMG_7959.jpeg',
  'sam-treat-1.jpg',
  'sams-trail-2.jpg',
  'sam-treat-2.jpg',
  'sam-treat-3.jpg',
  'sam-treat-4.jpg',
  'IMG_7979.jpeg',
  'sam-treat-5.jpg',
  'sam-treat-6.jpg',
  'IMG_7981.jpeg',
  '80287474360__6AC78E06-E869-484A-9D7E-170B2E10A394.fullsizerender.jpeg',
  '80297303124__736061AB-67C0-48AA-AA0E-61FED264DC88.jpeg',
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
      <section className="mx-auto max-w-2xl space-y-4 px-6 py-12 text-center">
        <h2 className="font-display text-3xl text-berry">Our Story</h2>
        <p className="text-lg leading-relaxed text-cocoa/80">
          Welcome to Sam's Sweet Treats and Coffee! We're a family-owned and
          operated coffee and pastries trailer proudly serving the community
          we've called home our entire lives. What started as a dream has grown
          into a place where friends, families, and neighbors can gather to
          enjoy handcrafted coffee, delicious sweet treats, and small-town
          hospitality.
        </p>
        <p className="text-lg leading-relaxed text-cocoa/80">
          At Sam's Sweet Treats and Coffee, we believe the best memories are
          made over great conversations, a fresh cup of coffee, and something
          sweet to share. As local residents who grew up right here in the
          county, we're honored to serve the community that has supported us
          throughout the years.
        </p>
        <p className="text-lg leading-relaxed text-cocoa/80">
          Whether you're stopping by for your morning coffee, an afternoon
          pick-me-up, or a special treat, we look forward to welcoming you with
          a smile and making you feel like part of our family. Thank you for
          supporting local, family-run businesses. We can't wait to serve you!
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
        <Gallery photos={galleryPhotos} />
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
