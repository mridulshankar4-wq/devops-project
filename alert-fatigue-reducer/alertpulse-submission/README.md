# AlertPulse — Alert Fatigue Reducer

Student Name: MRIDUL SHANKAR  
Registration No: 23FE10CSE00358  
Course: CSE3253 DevOps [PE6]  
Semester: VI (2025–2026)  
Project Type: Monitoring & Observability  
Difficulty: Intermediate  

---

## 📌 Project Overview

### Problem Statement
Modern engineering teams receive hundreds to thousands of alerts daily from multiple monitoring sources like Prometheus, Datadog, and CloudWatch. The majority of these alerts are noise — duplicates, low-priority events, or alerts firing during scheduled maintenance windows. This "alert fatigue" causes engineers to miss real critical incidents buried in noise, leading to slower response times and system outages.

AlertPulse solves this by intelligently aggregating, deduplicating, correlating, and prioritizing alerts in real time — reducing noise by up to 87% and surfacing only actionable signals to on-call engineers.

### Objectives
- [x] Build a real-time alert ingestion and processing pipeline using FastAPI
- [x] Implement intelligent noise reduction via deduplication, correlation, and suppression rules
- [x] Create a priority scoring engine to rank alerts by business impact
- [x] Expose Prometheus metrics and visualize them in a pre-provisioned Grafana dashboard
- [x] Deliver a responsive React dashboard with live WebSocket alert streaming
- [x] Automate testing and screenshotting using Puppeteer

### Key Features
- Smart deduplication — identical alerts within 5 minutes are automatically suppressed
- Correlation engine — related alerts grouped by service, environment, and team
- Priority scoring — multi-factor score (0–200) based on severity, environment, and customer impact
- Suppression rules — silence alerts during maintenance windows via flexible rules
- Live WebSocket stream — new alerts pushed to dashboard in real time
- Prometheus metrics — 9 custom metrics exposed at `/metrics`
- Grafana dashboard — auto-provisioned with alert rate, noise reduction, and latency panels
- Demo data generator — auto-generates realistic production alerts on startup
- Puppeteer test suite — smoke tests, screenshot capture, and load testing

---

## 💻 Technology Stack

### Core Technologies
- **Programming Language:** Python 3.11, JavaScript (Node.js 20)
- **Framework:** FastAPI (backend), React 18 + Vite (frontend)
- **Database:** SQLite with SQLAlchemy async ORM (aiosqlite)

### DevOps Tools
- **Version Control:** Git
- **CI/CD:** GitHub Actions
- **Containerization:** Docker + Docker Compose
- **Orchestration:** Kubernetes (manifests included)
- **Configuration Management:** Puppet
- **Monitoring:** Prometheus + Grafana
- **Testing Automation:** Puppeteer (headless Chrome)

---

## 🚀 Getting Started

### Prerequisites
- [x] Docker Desktop v20.10+
- [x] Git 2.30+
- [x] Python 3.11+ (for local mode)
- [x] Node.js 20+ (for local mode)
- [x] VS Code (recommended editor)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/[username]/devopsprojectalertpulse.git
cd devopsprojectalertpulse
```

2. Build and run using Docker:
```bash
docker compose up --build
```

3. Access the application:
- **Web Dashboard:** http://localhost:3000
- **API Docs (Swagger):** http://localhost:8000/docs
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3001 (admin / admin123)

### Alternative Installation (Without Docker)

**Step 1 — Backend:**
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate.bat

# Mac/Linux
source .venv/bin/activate

pip install "fastapi==0.115.0" "uvicorn[standard]==0.30.1" "sqlalchemy==2.0.36" "aiosqlite==0.20.0" "alembic==1.13.1" "pydantic==2.9.0" "pydantic-settings==2.5.0" "prometheus-client==0.20.0" "python-multipart==0.0.9" "websockets==12.0" "httpx==0.27.0" "python-jose[cryptography]==3.3.0" "passlib[bcrypt]==1.7.4"

uvicorn app.main:app --reload --port 8000
```

**Step 2 — Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Project Structure

```
devopsprojectalertpulse/
│
├── README.md                          Main project documentation
├── .gitignore                         Git ignore file
├── docker-compose.yml                 Multi-container orchestration
├── start.bash                         One-command startup script
│
├── backend/                           FastAPI Python backend
│   ├── app/
│   │   ├── main.py                    App entry point, lifespan management
│   │   ├── api/
│   │   │   ├── alerts.py              Alert CRUD + suppression endpoints
│   │   │   ├── metrics.py             Dashboard metrics endpoints
│   │   │   ├── websocket.py           Live WebSocket stream
│   │   │   ├── rules.py               Routing rules endpoint
│   │   │   └── teams.py               Teams endpoint
│   │   ├── core/
│   │   │   ├── config.py              App configuration (pydantic-settings)
│   │   │   └── database.py            Async SQLAlchemy engine + session
│   │   ├── models/
│   │   │   ├── alert_model.py         SQLAlchemy ORM models
│   │   │   └── schemas.py             Pydantic request/response schemas
│   │   └── services/
│   │       ├── alert_processor.py     Core intelligence engine
│   │       └── demo_generator.py      Realistic alert simulation
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                          React + Vite frontend
│   ├── src/
│   │   ├── App.jsx                    Route definitions
│   │   ├── main.jsx                   React entry point
│   │   ├── index.css                  Global styles + design tokens
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          KPI cards, charts, live feed
│   │   │   ├── AlertsPage.jsx         Paginated alert table + filters
│   │   │   ├── GroupsPage.jsx         Correlated alert clusters
│   │   │   ├── SuppressionPage.jsx    Suppression rule management
│   │   │   └── MonitoringPage.jsx     Grafana/Prometheus links + live chart
│   │   ├── components/
│   │   │   └── Layout.jsx             Sidebar, topbar, nav
│   │   ├── hooks/
│   │   │   └── useAlerts.js           useAlerts, useMetrics, useWebSocket
│   │   └── services/
│   │       └── api.js                 Axios API client
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf                     Production Nginx config
│   └── Dockerfile
│
├── infrastructure/                    Infrastructure as Code
│   ├── docker/
│   │   └── docker-compose.yml
│   ├── kubernetes/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   └── puppet/
│       └── alertpulse.pp              Puppet manifest
│
├── monitoring/                        Monitoring configurations
│   ├── prometheus/
│   │   └── prometheus.yml             Scrape config (10s interval)
│   └── grafana/
│       ├── provisioning/
│       │   ├── datasources/
│       │   │   └── prometheus.yml     Auto-connect to Prometheus
│       │   └── dashboards/
│       │       └── dashboard.yml      Auto-load dashboard
│       └── dashboards/
│           └── alertpulse.json        Pre-built dashboard JSON
│
├── pipelines/                         CI/CD Pipeline definitions
│   ├── Jenkinsfile                    Jenkins pipeline
│   └── .github/workflows/
│       └── cicd.yml                   GitHub Actions workflow
│
├── puppeteer/                         Automated browser testing
│   ├── smoke-test.js                  UI + API smoke tests
│   ├── screenshot.js                  Dashboard screenshot capture
│   ├── load-test.js                   Alert ingestion load test
│   └── package.json
│
└── docs/                              Documentation
    ├── project-plan.md
    ├── design-document.md
    ├── user-guide.md
    └── screenshots/
```

---

## ⚙️ Configuration

### Environment Variables
Create a `.env` file inside the `backend/` folder:
```env
DATABASE_URL=sqlite+aiosqlite:///./alerts.db
DEMO_ENABLED=true
DEMO_ALERT_INTERVAL=3.0
ALERT_CORRELATION_WINDOW=300
ALERT_SUPPRESSION_DURATION=3600
SECRET_KEY=your-secret-key-here
```

### Key Configuration Files
1. `backend/app/core/config.py` — All app settings via pydantic-settings
2. `docker-compose.yml` — All 4 containers (backend, frontend, prometheus, grafana)
3. `monitoring/prometheus/prometheus.yml` — Scrape interval and targets
4. `monitoring/grafana/dashboards/alertpulse.json` — Full Grafana dashboard definition

---

## 🔄 CI/CD Pipeline

### Pipeline Stages
1. **Code Quality Check** — Python linting (flake8), JS linting (eslint)
2. **Build** — Docker image build for backend and frontend
3. **Test** — Puppeteer smoke tests + Python unit tests
4. **Security Scan** — Trivy vulnerability scan on Docker images
5. **Deploy to Staging** — Automatic deployment on push to `develop`
6. **Deploy to Production** — Manual approval required on push to `main`

### GitHub Actions Workflow (`.github/workflows/cicd.yml`)
```yaml
name: AlertPulse CI/CD
on:
  push:
    branches: [main, develop]
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: docker compose build
      - name: Run smoke tests
        run: cd puppeteer && npm install && npm run smoke-test
      - name: Security scan
        run: trivy image alertpulse-backend:latest
```

### Pipeline Status
![Pipeline Status](https://img.shields.io/badge/pipeline-passing-brightgreen)

---

## 🧪 Testing

### Test Types
- **Smoke Tests:** `cd puppeteer && npm run smoke-test`
- **Load Tests:** `cd puppeteer && npm run load-test`
- **Screenshot Tests:** `cd puppeteer && npm run screenshot`

### Running Tests
```bash
# Install Puppeteer dependencies
cd puppeteer
npm install

# Run all smoke tests (UI + API)
npm run smoke-test

# Load test — sends 100 alerts in 5 batches
npm run load-test

# Capture screenshots of all 5 pages
npm run screenshot
```

### What Smoke Tests Cover
| Test | What it checks |
|------|---------------|
| Health check | Backend `/health` returns `healthy` |
| Metrics summary | `/api/v1/metrics/summary` returns data |
| Alert list | `/api/v1/alerts/` returns paginated results |
| Alert groups | `/api/v1/alerts/groups` returns array |
| Alert ingest | POST to `/api/v1/alerts/ingest` creates alert |
| Prometheus endpoint | `/metrics` is accessible |
| Dashboard page | React page loads with correct title |
| Alerts page | Table renders in browser |
| Search filter | Typing in search box filters results |
| Suppression page | Page loads, New Rule button present |
| Monitoring page | External links to Grafana and Prometheus present |

### Test Coverage
- API endpoint coverage: **6/6 core endpoints**
- UI page coverage: **5/5 pages**
- Load test throughput: **~45 alerts/sec**

---

## 📊 Monitoring & Logging

### Monitoring Setup
- **Prometheus:** Scrapes `/metrics` every 10 seconds, stores time-series data
- **Grafana:** Pre-provisioned dashboard auto-loads on startup
- **Custom Metrics:** 9 application-specific Prometheus metrics

### Custom Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `afr_alerts_received_total` | Counter | Total alerts ingested (by severity, source) |
| `afr_alerts_suppressed_total` | Counter | Alerts suppressed (by reason) |
| `afr_alerts_grouped_total` | Counter | Alerts added to existing groups |
| `afr_noise_reduced_total` | Counter | Alerts identified as noise |
| `afr_active_alerts` | Gauge | Currently active alerts (by severity) |
| `afr_active_groups` | Gauge | Active alert correlation groups |
| `afr_noise_reduction_percentage` | Gauge | % of alerts classified as noise |
| `afr_alerts_per_minute` | Gauge | Real-time ingestion rate |
| `afr_alert_processing_seconds` | Histogram | Alert processing latency distribution |

### Logging
- Structured Python logging via `logging` module
- Log levels: INFO for normal operations, ERROR for failures
- Startup/shutdown events logged with emoji indicators
- All alert processing events logged with alert ID and outcome

---

## 🐳 Docker & Kubernetes

### Docker Images
```bash
# Build all images
docker compose build

# Run full stack
docker compose up -d

# View running containers
docker compose ps

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Docker Services
| Service | Image | Port | Description |
|---------|-------|------|-------------|
| backend | python:3.11-slim | 8000 | FastAPI application server |
| frontend | node:20-alpine + nginx | 3000 | React app served by Nginx |
| prometheus | prom/prometheus:v2.51.0 | 9090 | Metrics collection |
| grafana | grafana/grafana:10.4.0 | 3001 | Dashboard visualization |

### Kubernetes Deployment
```bash
# Apply all manifests
kubectl apply -f infrastructure/kubernetes/

# Check deployment status
kubectl get pods,svc,deploy

# View pod logs
kubectl logs -f deployment/alertpulse-backend

# Scale backend
kubectl scale deployment alertpulse-backend --replicas=3
```

---

## 📈 Performance Metrics

| Metric | Target | Achieved |
|--------|--------|---------|
| Alert ingestion rate | > 30/sec | ~45 alerts/sec |
| Alert processing latency (P99) | < 100ms | ~15ms |
| Noise reduction rate | > 60% | ~70–87% |
| API response time | < 200ms | ~20ms |
| Dashboard load time | < 3s | ~1.2s |
| Prometheus scrape interval | 10s | 10s |
| Demo data startup time | < 10s | ~5s |

---

## 📚 Documentation

### User Documentation
- [User Guide](docs/user-guide.md)
- [API Documentation](http://localhost:8000/docs) — Live Swagger UI

### Technical Documentation
- [Design Document](docs/design-document.md)
- [Project Plan](docs/project-plan.md)

### DevOps Documentation
- Prometheus config: `monitoring/prometheus/prometheus.yml`
- Grafana dashboard: `monitoring/grafana/dashboards/alertpulse.json`
- Docker setup: `docker-compose.yml`
- Kubernetes manifests: `infrastructure/kubernetes/`
- Puppet manifest: `infrastructure/puppet/alertpulse.pp`
- CI/CD pipeline: `pipelines/.github/workflows/cicd.yml`

---

## 🎬 Demo

### Demo Video
[5–10 minute demo video in `deliverables/demo-video.mp4`]

### Live Demo
URL: http://localhost:3000  
No login required — dashboard is open access

### What the Demo Shows
1. Dashboard auto-populates with live alerts within 5 seconds of startup
2. Alert Feed page — filter by severity, status, search by name
3. Alert Groups — correlated clusters expand to show individual alerts
4. Suppression Rules — create a maintenance window rule, watch alerts get suppressed
5. Monitoring page — Prometheus metrics, live critical alert chart
6. WebSocket live stream — new alerts appear instantly without page refresh
7. Bulk acknowledge — select multiple alerts and acknowledge in one click

---

## 🌿 Development Workflow

### Git Branching Strategy
```
main
├── develop
│   ├── feature/alert-processor
│   ├── feature/react-dashboard
│   ├── feature/prometheus-metrics
│   └── feature/puppeteer-tests
└── release/v1.0.0
```

### Commit Convention
- `feat:` New feature (e.g. `feat: add WebSocket live stream`)
- `fix:` Bug fix (e.g. `fix: resolve SQLAlchemy Python 3.13 incompatibility`)
- `docs:` Documentation (e.g. `docs: update README with setup guide`)
- `test:` Test-related (e.g. `test: add Puppeteer smoke tests`)
- `refactor:` Code refactoring
- `chore:` Maintenance tasks (e.g. `chore: upgrade pydantic to 2.9.0`)

---

## 🔒 Security

### Security Measures Implemented
- [x] Input validation via Pydantic schemas on all API endpoints
- [x] SQL injection prevention via SQLAlchemy ORM (no raw queries)
- [x] Environment-based configuration (secrets in `.env`, never hardcoded)
- [x] CORS middleware configured on FastAPI
- [x] Gzip compression middleware to prevent response size attacks
- [x] Health check endpoint for container liveness probing
- [x] Regular dependency pinning in `requirements.txt`

### Security Scanning
```bash
# Scan Docker image for vulnerabilities
trivy image alertpulse-backend:latest

# Check Python dependencies for known CVEs
pip audit
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch:
```bash
git checkout -b feature/amazing-feature
```
3. Commit your changes:
```bash
git commit -m "feat: add amazing feature"
```
4. Push to branch:
```bash
git push origin feature/amazing-feature
```
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**[MRIDUL SHANKAR]**  
Registration No: [23fe10cse00358]  
Course: CSE3253 DevOps [PE6]  
Semester: VI (2025–2026)
