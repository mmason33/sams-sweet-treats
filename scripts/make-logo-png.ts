// Generate a transparent PNG from the JPG logo.
// The logo sits on a solid white background, but the coffee cup and saucer are
// also white — so we can't just make all white transparent. Instead we
// flood-fill inward from the image borders, turning only the *exterior* white
// (connected to the edge) transparent. The black outlines act as walls, so the
// enclosed white cup/saucer are preserved.
//
// Run: npx tsx scripts/make-logo-png.ts
import Jimp from 'jimp'
import path from 'node:path'

const SRC = path.resolve('public/images/sams-logo.jpg')
const OUT = path.resolve('public/images/sams-logo.png')
const THRESHOLD = 230 // a pixel is "background white" if every channel >= this

const img = await Jimp.read(SRC)
const { width, height, data } = img.bitmap
const visited = new Uint8Array(width * height)
const stack: number[] = []

function isWhite(idx: number): boolean {
  const o = idx * 4
  return data[o] >= THRESHOLD && data[o + 1] >= THRESHOLD && data[o + 2] >= THRESHOLD
}

function visit(x: number, y: number): void {
  if (x < 0 || y < 0 || x >= width || y >= height) return
  const idx = y * width + x
  if (visited[idx]) return
  visited[idx] = 1
  if (isWhite(idx)) {
    data[idx * 4 + 3] = 0 // make transparent
    stack.push(idx)
  }
}

// Seed the flood from every border pixel.
for (let x = 0; x < width; x++) {
  visit(x, 0)
  visit(x, height - 1)
}
for (let y = 0; y < height; y++) {
  visit(0, y)
  visit(width - 1, y)
}

// Flood-fill through connected white.
while (stack.length) {
  const idx = stack.pop() as number
  const x = idx % width
  const y = (idx - x) / width
  visit(x + 1, y)
  visit(x - 1, y)
  visit(x, y + 1)
  visit(x, y - 1)
}

await img.writeAsync(OUT)
console.log(`Wrote ${OUT} (${width}x${height}, exterior white made transparent)`)
