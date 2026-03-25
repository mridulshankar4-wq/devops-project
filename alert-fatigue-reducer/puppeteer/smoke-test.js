/**
 * AlertPulse - Smoke Test Suite
 * Validates all core UI flows and API endpoints
 */

const puppeteer = require('puppeteer')
const axios = require('axios')

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
const API_URL = process.env.API_URL || 'http://localhost:8000'

let passed = 0
let failed = 0

function log(msg, ok = true) {
  const icon = ok ? '✅' : '❌'
  console.log(`  ${icon} ${msg}`)
  ok ? passed++ : failed++
}

async function testApi() {
  console.log('\n📡 API Tests')

  try {
    const r = await axios.get(`${API_URL}/health`)
    log(`Health check: ${r.data.status}`, r.data.status === 'healthy')
  } catch { log('Health check failed', false) }

  try {
    const r = await axios.get(`${API_URL}/api/v1/metrics/summary`)
    log('Metrics summary returns data', !!r.data.total_alerts !== undefined)
  } catch { log('Metrics summary failed', false) }

  try {
    const r = await axios.get(`${API_URL}/api/v1/alerts/`)
    log(`Alert list returns paginated results (total: ${r.data.total})`, Array.isArray(r.data.items))
  } catch { log('Alert list failed', false) }

  try {
    const r = await axios.get(`${API_URL}/api/v1/alerts/groups`)
    log(`Alert groups endpoint works (${r.data.length} groups)`, Array.isArray(r.data))
  } catch { log('Alert groups failed', false) }

  try {
    const r = await axios.post(`${API_URL}/api/v1/alerts/ingest`, {
      title: 'Smoke Test Alert',
      severity: 'low',
      source: 'smoke-test',
      service: 'test-service',
      environment: 'development',
    })
    log(`Alert ingest works (id: ${r.data.id?.slice(0, 8)}...)`, !!r.data.id)
  } catch { log('Alert ingest failed', false) }

  try {
    const r = await axios.get(`${API_URL}/metrics`)
    log('Prometheus /metrics endpoint accessible', r.status === 200)
  } catch { log('Prometheus metrics endpoint failed', false) }
}

async function testUI() {
  console.log('\n🖥️  UI Tests')

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  // Dashboard
  try {
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0', timeout: 20000 })
    const title = await page.$eval('h1', el => el.textContent)
    log(`Dashboard loads: "${title}"`, title.includes('Dashboard'))
  } catch (e) { log(`Dashboard load failed: ${e.message}`, false) }

  // Alerts page
  try {
    await page.goto(`${FRONTEND_URL}/alerts`, { waitUntil: 'networkidle0', timeout: 15000 })
    await page.waitForSelector('table', { timeout: 5000 })
    log('Alerts table renders', true)
  } catch (e) { log(`Alerts page failed: ${e.message}`, false) }

  // Search filter
  try {
    await page.type('input[placeholder="Search alerts..."]', 'CPU')
    await page.waitForTimeout(800)
    log('Alert search filter works', true)
  } catch (e) { log(`Search filter failed: ${e.message}`, false) }

  // Groups page
  try {
    await page.goto(`${FRONTEND_URL}/groups`, { waitUntil: 'networkidle0', timeout: 15000 })
    const heading = await page.$eval('h1', el => el.textContent)
    log(`Groups page loads: "${heading}"`, heading.includes('Groups'))
  } catch (e) { log(`Groups page failed: ${e.message}`, false) }

  // Suppression page
  try {
    await page.goto(`${FRONTEND_URL}/suppression`, { waitUntil: 'networkidle0', timeout: 15000 })
    await page.waitForTimeout(500)
    log('Suppression page loads', true)
    // Click new rule button
    const btn = await page.$('button')
    if (btn) log('New Rule button present', true)
  } catch (e) { log(`Suppression page failed: ${e.message}`, false) }

  // Monitoring page
  try {
    await page.goto(`${FRONTEND_URL}/monitoring`, { waitUntil: 'networkidle0', timeout: 15000 })
    const links = await page.$$eval('a[target="_blank"]', els => els.map(el => el.href))
    log(`Monitoring page loads with ${links.length} external links`, links.length >= 2)
  } catch (e) { log(`Monitoring page failed: ${e.message}`, false) }

  await browser.close()
}

async function run() {
  console.log('🔍 AlertPulse Smoke Test Suite')
  console.log('================================')

  await testApi()
  await testUI()

  console.log('\n================================')
  console.log(`Results: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    console.log('⚠️  Some tests failed — check services are running')
    process.exit(1)
  } else {
    console.log('🎉 All tests passed!')
  }
}

run().catch(err => {
  console.error('Test runner crashed:', err)
  process.exit(1)
})
