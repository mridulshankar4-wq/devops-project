/**
 * AlertPulse - Load Test
 * Sends bursts of alerts to stress-test the ingestion pipeline
 */

const axios = require('axios')

const API_URL = process.env.API_URL || 'http://localhost:8000'

const SERVICES = ['payment-service', 'auth-service', 'user-api', 'order-processor', 'notification-service']
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info']
const SOURCES = ['prometheus', 'datadog', 'cloudwatch', 'pagerduty']

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)] }

async function sendAlert(i) {
  try {
    const res = await axios.post(`${API_URL}/api/v1/alerts/ingest`, {
      title: `Load Test Alert #${i} - ${randomItem(['High CPU', 'Memory spike', 'Error rate up', 'Disk full', 'Timeout'])}`,
      severity: randomItem(SEVERITIES),
      source: randomItem(SOURCES),
      service: randomItem(SERVICES),
      environment: randomItem(['production', 'staging']),
      labels: { load_test: true, batch: Math.floor(i / 10) },
    })
    return { ok: true, id: res.data.id, noise: res.data.is_noise }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

async function runBatch(batchNum, size) {
  const promises = Array.from({ length: size }, (_, i) => sendAlert(batchNum * size + i))
  const results = await Promise.all(promises)
  const ok = results.filter(r => r.ok).length
  const noise = results.filter(r => r.ok && r.noise).length
  console.log(`  Batch ${batchNum + 1}: ${ok}/${size} success | ${noise} noise-filtered`)
  return results
}

async function run() {
  const BATCHES = parseInt(process.env.BATCHES || '5')
  const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '20')
  const DELAY_MS = parseInt(process.env.DELAY_MS || '500')

  console.log(`🚀 AlertPulse Load Test`)
  console.log(`   ${BATCHES} batches × ${BATCH_SIZE} alerts = ${BATCHES * BATCH_SIZE} total`)
  console.log(`   Delay between batches: ${DELAY_MS}ms`)
  console.log()

  const start = Date.now()
  let totalOk = 0
  let totalNoise = 0

  for (let b = 0; b < BATCHES; b++) {
    const results = await runBatch(b, BATCH_SIZE)
    totalOk += results.filter(r => r.ok).length
    totalNoise += results.filter(r => r.ok && r.noise).length
    if (b < BATCHES - 1) await new Promise(r => setTimeout(r, DELAY_MS))
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(2)
  const rate = (totalOk / elapsed).toFixed(1)
  const noisePct = totalOk > 0 ? ((totalNoise / totalOk) * 100).toFixed(1) : 0

  console.log()
  console.log('📊 Results:')
  console.log(`   Total sent:      ${BATCHES * BATCH_SIZE}`)
  console.log(`   Successful:      ${totalOk}`)
  console.log(`   Noise filtered:  ${totalNoise} (${noisePct}%)`)
  console.log(`   Duration:        ${elapsed}s`)
  console.log(`   Throughput:      ${rate} alerts/sec`)
}

run().catch(console.error)
