# 🚨 AlertPulse — Alert Fatigue Reducer

> Smart alert aggregation, deduplication, and prioritization system for modern engineering teams.

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![Prometheus](https://img.shields.io/badge/Prometheus-2.51-orange?logo=prometheus)](https://prometheus.io)
[![Grafana](https://img.shields.io/badge/Grafana-10.4-F46800?logo=grafana)](https://grafana.com)

---

## 🎯 Problem Statement

Engineering teams receive hundreds to thousands of alerts per day from Prometheus, Datadog, CloudWatch, and PagerDuty. Most of these are **noise** — duplicates, low-priority events, or alerts during maintenance windows. AlertPulse reduces alert fatigue by:

- **Deduplicating** identical alerts within rolling time windows
- **Correlating** related alerts into groups by service/environment
- **Prioritizing** alerts with a multi-factor score (severity, environment, customer impact)
- **Suppressing** alerts via flexible rules during maintenance windows
- **Visualizing** noise reduction metrics in real-time

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     AlertPulse Stack                      │
│                                                          │
│  ┌─────────────┐    ┌──────────────────────────────┐    │
│  │  React UI   │◄──►│   FastAPI Backend (Python)   │    │
│  │  Port 3000  │    │        Port 8000              │    │
│  │             │    │  • Alert ingestion API        │    │
│  │  Dashboard  │    │  • Dedup & correlation engine │    │
│  │  Alert feed │    │  • Priority scoring           │    │
│  │  Groups     │    │  • Suppression rules          │    │
│  │  Suppression│    │  • WebSocket live stream      │    │
│  │  Monitoring │    │  • Prometheus /metrics        │    │
│  └─────────────┘    └──────────────┬───────────────┘    │
│                                     │                    │
│  ┌──────────────┐   ┌──────────────▼───────────────┐    │
│  │   Grafana    │◄──│        Prometheus             │    │
│  │  Port 3001   │   │         Port 9090             │    │
│  │  Dashboards  │   │  Scrapes /metrics every 10s   │    │
│  └──────────────┘   └──────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  Puppeteer  (smoke tests · screenshots · load)   │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Option A — Local (Development)

```bash
chmod +x start.bash
./start.bash local
```

Requirements: Python 3.11+, Node.js 20+

### Option B — Docker (Full Stack with Grafana + Prometheus)

```bash
chmod +x start.bash
./start.bash docker
```

Requirements: Docker + Docker Compose

---

## 🌐 Access URLs

| Service    | URL                          | Notes                        |
|------------|------------------------------|------------------------------|
| Dashboard  | http://localhost:3000        | React SPA                    |
| API Docs   | http://localhost:8000/docs   | Swagger UI                   |
| Prometheus | http://localhost:9090        | Metrics store (Docker only)  |
| Grafana    | http://localhost:3001        | admin / admin123 (Docker)    |

---

## 📡 API Reference

### Ingest an Alert

```bash
curl -X POST http://localhost:8000/api/v1/alerts/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "title": "High CPU utilization on payment-service",
    "severity": "critical",
    "source": "prometheus",
    "service": "payment-service",
    "environment": "production",
    "labels": {"host": "node-01", "customer_facing": true}
  }'
```

### List Alerts

```bash
curl "http://localhost:8000/api/v1/alerts/?severity=critical&status=firing&page=1&size=20"
```

### Get Metrics Summary

```bash
curl http://localhost:8000/api/v1/metrics/summary
```

### Create Suppression Rule

```bash
curl -X POST http://localhost:8000/api/v1/alerts/suppression/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maintenance Window",
    "match_service": "payment-service",
    "duration_seconds": 7200,
    "reason": "Scheduled database maintenance"
  }'
```

---

## 🔬 Puppeteer Testing

```bash
cd puppeteer
npm install

# Smoke test all UI pages + API endpoints
npm run smoke-test

# Generate screenshots of every page
npm run screenshot

# Load test the ingestion pipeline
npm run load-test

# Custom load test
BATCHES=10 BATCH_SIZE=50 npm run load-test
```

---

## 📊 Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `afr_alerts_received_total` | Counter | Alerts ingested (labels: severity, source) |
| `afr_alerts_suppressed_total` | Counter | Alerts suppressed (label: reason) |
| `afr_alerts_grouped_total` | Counter | Alerts added to existing groups |
| `afr_noise_reduced_total` | Counter | Alerts identified as noise |
| `afr_active_alerts` | Gauge | Currently active alerts (label: severity) |
| `afr_active_groups` | Gauge | Active alert groups |
| `afr_noise_reduction_percentage` | Gauge | % of alerts classified as noise |
| `afr_alerts_per_minute` | Gauge | Real-time ingestion rate |
| `afr_alert_processing_seconds` | Histogram | Processing latency |

---

## 🧠 Alert Intelligence Engine

### Priority Scoring

Each alert gets a 0–200 priority score:

| Factor | Score |
|--------|-------|
| Severity: critical | +100 |
| Severity: high | +75 |
| Severity: medium | +50 |
| Environment: production | +30 |
| Environment: staging | +15 |
| Customer-facing service | +20 |
| Has runbook URL | +5 |
| Duplicate within 5min | ×0.3 |

### Deduplication

Alerts with the same `(title, source, service, environment)` fingerprint within a 5-minute window are automatically tagged as noise.

### Correlation

Alerts from the same `(source, service, environment, team)` within a 5-minute window are grouped together, reducing visual clutter on the dashboard.

---

## 🏢 Use Case: E-Commerce Platform

**Before AlertPulse**: 500 alerts/day → engineers spend 3h/day triaging, miss real incidents buried in noise.

**After AlertPulse**:
- 320 alerts suppressed as duplicates
- 85 grouped into 12 correlated incidents
- 30 suppressed by maintenance rules
- **Engineers see only 65 actionable signals** — 87% noise reduction

---

## 📁 Project Structure

```
alert-fatigue-reducer/
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── api/             # Route handlers
│   │   ├── core/            # Config, database
│   │   ├── models/          # SQLAlchemy + Pydantic
│   │   └── services/        # Alert processor, demo generator
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # Dashboard, Alerts, Groups, etc.
│   │   ├── components/      # Layout, shared components
│   │   ├── hooks/           # useAlerts, useMetrics, useWebSocket
│   │   └── services/        # API client
│   └── Dockerfile
├── monitoring/
│   ├── prometheus/          # prometheus.yml
│   └── grafana/             # Dashboards + provisioning
├── puppeteer/               # Smoke tests, screenshots, load tests
├── docker-compose.yml
├── start.bash               # One-command startup
└── README.md
```

---

## 🛠 Development

```bash
# Backend only
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend only
cd frontend
npm install
npm run dev

# View logs (Docker)
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 📝 License

MIT — Build something great.
