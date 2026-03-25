/**
 * AlertPulse - Dashboard Screenshot Generator
 * Captures screenshots of the dashboard for documentation/reporting
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const OUTPUT_DIR = path.join(__dirname, 'screenshots')

const PAGES = [
  { name: 'dashboard', path: '/dashboard', waitFor: '.metric-card' },
  { name: 'alerts', path: '/alerts', waitFor: 'table' },
  { name: 'groups', path: '/groups', waitFor: '.glass-card' },
  { name: 'suppression', path: '/suppression', waitFor: '.glass-card' },
  { name: 'monitoring', path: '/monitoring', waitFor: '.glass-card' },
]

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('🚀 Starting screenshot capture...')

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  for (const pageInfo of PAGES) {
    try {
      console.log(`📸 Capturing ${pageInfo.name}...`)
      await page.goto(`${BASE_URL}${pageInfo.path}`, { waitUntil: 'networkidle0', timeout: 15000 })
      await page.waitForTimeout(2000) // Let animations settle

      const filename = path.join(OUTPUT_DIR, `${pageInfo.name}.png`)
      await page.screenshot({ path: filename, fullPage: false })
      console.log(`  ✅ Saved: ${filename}`)
    } catch (err) {
      console.error(`  ❌ Failed to capture ${pageInfo.name}: ${err.message}`)
    }
  }

  await browser.close()
  console.log('\n✨ Screenshot capture complete!')
  console.log(`📁 Saved to: ${OUTPUT_DIR}`)
}

capture().catch(console.error)
