import { useState } from 'react'
import Lightbox from './Lightbox'

interface GalleryProps {
  /** Photo filenames, relative to BASE_URL images/. */
  photos: string[]
}

// Instagram-style masonry gallery. Photos keep their natural aspect ratio and
// flow into balanced columns; clicking one opens a full-screen lightbox.
export default function Gallery({ photos }: GalleryProps) {
  const [active, setActive] = useState<number | null>(null)

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
        {photos.map((photo, i) => (
          <button
            key={photo}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Open photo ${i + 1}`}
            className="block w-full break-inside-avoid overflow-hidden rounded-2xl shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-berry"
          >
            <img
              src={`${import.meta.env.BASE_URL}images/${photo}`}
              alt=""
              loading="lazy"
              className="w-full object-cover"
            />
          </button>
        ))}
      </div>

      <Lightbox
        photos={photos}
        index={active}
        onClose={() => setActive(null)}
        onNavigate={setActive}
      />
    </>
  )
}
