// Opens a bundled file straight off disk — no server, no network — and proves
// it mounts, sizes its canvas and renders both views.
import { access } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].filter(Boolean)

async function findChrome() {
  for (const c of CHROME) {
    try {
      await access(c)
      return c
    } catch {}
  }
  throw new Error('no chrome')
}

const file = process.argv[2]
const SIZE = { width: 1400, height: 900 }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: await findChrome(),
  headless: true,
  args: [
    '--headless=new',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    `--window-size=${SIZE.width},${SIZE.height}`,
  ],
})
const page = await browser.newPage()
await page.setViewport(SIZE)

const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message))
// Anything the bundle still tries to fetch would be a broken dependency the
// recipient hits and we do not.
const fetched = []
page.on('request', (r) => {
  if (!r.url().startsWith('file://') && !r.url().startsWith('data:')) fetched.push(r.url())
})

await page.goto(pathToFileURL(resolve(file)).href, { waitUntil: 'networkidle0' })
await page.waitForFunction(() => document.querySelector('canvas')?.width > 400, { timeout: 25000 })
await sleep(2600)
const size = await page.evaluate(() => {
  const c = document.querySelector('canvas')
  return { w: c.width, h: c.height, title: document.title }
})
console.log(`filament view: canvas ${size.w}x${size.h}, document.title "${size.title}"`)
await page.screenshot({ path: 'docs/shots/bundle-filament.png' })

await page.evaluate(() => {
  ;[...document.querySelectorAll('.tab')].find((t) => t.textContent.includes('Cell'))?.click()
})
await sleep(4200)
await page.screenshot({ path: 'docs/shots/bundle-cell.png' })
const structures = await page.evaluate(() => document.querySelectorAll('.item').length)
console.log(`cell view: ${structures} structures in the list`)

await browser.close()
console.log(fetched.length ? 'FETCHED FROM THE NETWORK: ' + fetched.join(' ') : 'no network requests')
console.log(problems.length ? 'console errors: ' + [...new Set(problems)].join(' | ') : 'no console errors')
