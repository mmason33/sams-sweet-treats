/**
 * One-time importer: Toast menu CSV exports -> Firestore `menuItems`.
 *
 * The Toast `MenuItem_Export.csv` mixes real products with sizes, add-on
 * modifiers, demo "(Example)" rows, archived rows, and placeholders. It also
 * carries NO item->category link, so we filter to sellable products and infer a
 * category from the item name. Multi-size items list $0.00 base price but encode
 * the smallest size + price in the trailing SKU/PLU columns (e.g. "Small,$5.00").
 *
 * Usage:
 *   npx tsx scripts/import-toast.ts --dry-run     # parse + write preview JSON, no Firebase
 *   ADMIN_EMAIL=.. ADMIN_PASSWORD=.. npx tsx scripts/import-toast.ts            # push (skips if collection non-empty)
 *   ADMIN_EMAIL=.. ADMIN_PASSWORD=.. npx tsx scripts/import-toast.ts --replace  # delete existing, then push
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { NewMenuItem } from '../src/lib/menuTypes'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, '..', 'menu-data')

// --- Tiny CSV parser (handles quoted fields containing commas) ---------------
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* skip */ }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }

  const header = rows.shift()
  if (!header) return []
  return rows
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ''])))
}

// --- Category inference (first matching rule wins) ---------------------------
// Food rules run before drink rules so e.g. "Coffee Cake" -> Cakes & Sweets.
const RULES: [RegExp, string][] = [
  [/muffin|scone/i, 'Muffins & Scones'],
  [/cookie|brownie|\bbar\b/i, 'Cookies & Bars'],
  [/cake|loaf|pound cake/i, 'Cakes & Sweets'],
  [/croissant|cinnamon roll|streusel|danish|pastry/i, 'Pastries'],
  [/ganache/i, 'Cookies & Bars'],
  [/breakfast|burrito|biscuit|gravy|quiche|parfait|egg bite|oatmeal|sandwich/i, 'Breakfast'],
  [/frappe|blended/i, 'Blended & Frappes'],
  [/smoothie|strawberry banana|mixed berry|mango pineapple/i, 'Smoothies'],
  [/matcha/i, 'Matcha'],
  [/hot chocolate/i, 'Hot Chocolate'],
  [/energy/i, 'Energy'],
  [/chai|affogato/i, 'Specialty'],
  [/tea|lemonade|arnold palmer/i, 'Tea & Lemonade'],
  [/refresher|dragon fruit|acai|passion fruit|cucumber/i, 'Refreshers'],
  [/dirty soda|float|root ?beer/i, 'Dirty Soda'],
  [/iced|cold brew/i, 'Iced Coffee'],
  [/coffee|latte|americano|cappuccino|mocha|macchiato|espresso/i, 'Hot Coffee'],
]

// Display order for grouping in the app.
const CATEGORY_ORDER = [
  'Hot Coffee', 'Iced Coffee', 'Specialty', 'Matcha', 'Blended & Frappes',
  'Smoothies', 'Hot Chocolate', 'Energy', 'Tea & Lemonade', 'Refreshers', 'Dirty Soda',
  'Pastries', 'Muffins & Scones', 'Cookies & Bars', 'Cakes & Sweets', 'Breakfast', 'Other',
]

function categorize(name: string): string {
  for (const [re, cat] of RULES) if (re.test(name)) return cat
  return 'Other'
}

function resolvePrice(row: Record<string, string>): number {
  const base = parseFloat(row['Base Price'] || '0')
  if (base > 0) return base
  // Trailing columns hold the smallest size price, e.g. PLU "$5.00".
  const plu = (row['PLU'] || row['SKU'] || '').replace(/[^0-9.]/g, '')
  return plu ? parseFloat(plu) : 0
}

function isSellable(row: Record<string, string>): boolean {
  const name = (row['Name'] || '').trim()
  if (!name) return false
  if (row['Modifier'] === 'Yes') return false          // sizes & add-ons
  if (row['Archived'] === 'Yes') return false
  if (/\(example\)|\(copy\)/i.test(name)) return false  // Toast demo / dupes
  if (name.startsWith('(')) return false                // descriptive sub-lines
  if (/^open (drink|food)$/i.test(name)) return false   // POS placeholders
  // Add-on modifiers that leak in as Modifier=No with a real price.
  if (/milk$|half and half|heavy cream|extra (shot|flavor)|flavor shot/i.test(name)) return false
  return resolvePrice(row) > 0                          // drops $0 flavor rows
}

function buildItems(): NewMenuItem[] {
  const raw = parseCsv(readFileSync(join(dataDir, 'MenuItem_Export.csv'), 'utf8'))
  const seen = new Set<string>()
  const items: { name: string; price: number; category: string }[] = []
  for (const row of raw) {
    if (!isSellable(row)) continue
    const name = row['Name'].trim()
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ name, price: resolvePrice(row), category: categorize(name) })
  }
  // Sort by category display order, then name; assign sortOrder within category.
  items.sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category)
    const cb = CATEGORY_ORDER.indexOf(b.category)
    return ca !== cb ? ca - cb : a.name.localeCompare(b.name)
  })
  const counter: Record<string, number> = {}
  return items.map((it) => ({
    name: it.name,
    description: '',
    price: it.price,
    category: it.category,
    available: true,
    sortOrder: (counter[it.category] = (counter[it.category] ?? 0) + 1) - 1,
  }))
}

async function main() {
  const items = buildItems()
  const dryRun = process.argv.includes('--dry-run')

  // Summary to console regardless of mode.
  const byCat: Record<string, string[]> = {}
  for (const it of items) (byCat[it.category] ??= []).push(`${it.name} ($${it.price.toFixed(2)})`)
  for (const cat of CATEGORY_ORDER) {
    if (!byCat[cat]) continue
    console.log(`\n${cat} (${byCat[cat].length})`)
    for (const line of byCat[cat]) console.log(`  - ${line}`)
  }
  console.log(`\nTotal sellable items: ${items.length}`)

  if (dryRun) {
    const out = join(dataDir, 'import-preview.json')
    writeFileSync(out, JSON.stringify(items, null, 2))
    console.log(`\nDry run — wrote ${out}. No Firebase changes.`)
    return
  }

  // Real import (deferred require keeps Firebase out of the dry-run path).
  const { signInWithEmailAndPassword } = await import('firebase/auth')
  const { collection, addDoc, getDocs, deleteDoc } = await import('firebase/firestore')
  const { auth, db } = await import('../src/lib/firebase')

  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  if (!email || !password) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars')
  await signInWithEmailAndPassword(auth, email, password)

  const existing = await getDocs(collection(db, 'menuItems'))
  if (!existing.empty) {
    if (!process.argv.includes('--replace')) {
      console.log(`menuItems already has ${existing.size} docs — pass --replace to overwrite. Aborting.`)
      return
    }
    console.log(`Deleting ${existing.size} existing docs…`)
    for (const d of existing.docs) await deleteDoc(d.ref)
  }
  for (const item of items) {
    await addDoc(collection(db, 'menuItems'), item)
    console.log(`Added ${item.name}`)
  }
  console.log('\nImport complete.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
