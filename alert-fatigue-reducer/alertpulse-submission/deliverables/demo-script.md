# AlertPulse — Demo Script (5–10 minutes)

## 1. Introduction (30 seconds)
"AlertPulse is a smart alert aggregation system that reduces alert fatigue
for engineering teams. It processes incoming alerts, removes noise,
groups related alerts, and prioritizes what matters most."

## 2. Start the Application (1 minute)
- Open VS Code terminal
- Show backend running: `uvicorn app.main:app --reload --port 8000`
- Show frontend running: `npm run dev`
- Open http://localhost:3000

## 3. Dashboard Walkthrough (2 minutes)
- Point out the 4 KPI cards: Firing Alerts, Noise Reduced %, Alert Groups, Alerts/Hour
- Show the 24-hour timeline chart — explain the spikes are simulated incidents
- Show the severity pie chart
- Show the live stream panel — new alerts appearing in real time
- Explain: "The system auto-generates demo alerts simulating a real production environment"

## 4. Alert Feed (2 minutes)
- Click "Alert Feed" in the sidebar
- Show the table sorted by Priority Score
- Filter by severity=critical — show only critical alerts
- Show P1/P2/P3/P4 priority labels
- Show NOISE badge on duplicate alerts
- Acknowledge an alert — show status change to "Acknowledged"
- Use the search box — type "CPU" to filter

## 5. Alert Groups (1 minute)
- Click "Alert Groups"
- Expand a group — show correlated alerts inside
- Explain: "Instead of seeing 20 separate alerts, the team sees 1 group"

## 6. Suppression Rules (1 minute)
- Click "Suppression"
- Click "New Rule"
- Create a rule: name="Demo Maintenance", service="payment-service", duration=3600
- Show it appears in the active rules list
- Explain: "Now all payment-service alerts are silenced for 1 hour"

## 7. Monitoring (1 minute)
- Click "Monitoring"
- Show the live critical alerts chart updating every 3 seconds
- Point out Grafana and Prometheus links
- Open http://localhost:8000/metrics — show raw Prometheus output
- Explain the custom AFR metrics

## 8. Puppeteer Demo (1 minute — optional)
- Open a terminal
- Run: `cd puppeteer && npm run smoke-test`
- Show green checkmarks for all tests passing

## 9. Conclusion (30 seconds)
"AlertPulse demonstrates the complete DevOps stack:
FastAPI backend, React frontend, Prometheus metrics,
Grafana dashboards, Docker containerization, Kubernetes manifests,
Puppet configuration management, and automated Puppeteer testing —
all connected together in a real-world monitoring use case."
