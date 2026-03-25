#!/usr/bin/env bash
# ============================================================
#  AlertPulse — Alert Fatigue Reducer
#  start.bash — One-command startup script
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

MODE="${1:-local}"   # local | docker
SKIP_INSTALL="${SKIP_INSTALL:-false}"

banner() {
cat << 'EOF'
   _   _           _   ____       _          
  / \ | | ___ _ __| |_|  _ \ _   _| |___  ___ 
 / _ \| |/ _ \ '__| __| |_) | | | | / __|/ _ \
/ ___ \ |  __/ |  | |_|  __/| |_| | \__ \  __/
/_/   \_\_\___|_|   \__|_|    \__,_|_|___/\___|

  Alert Fatigue Reducer  v1.0.0
  Smart alert aggregation & prioritization

EOF
}

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERR]${RESET}   $*"; exit 1; }

check_deps() {
  info "Checking dependencies..."
  if [[ "$MODE" == "docker" ]]; then
    command -v docker  >/dev/null 2>&1 || error "Docker not found. Install: https://docs.docker.com/get-docker/"
    command -v docker compose >/dev/null 2>&1 || \
      docker-compose version >/dev/null 2>&1    || \
      error "Docker Compose not found."
    success "Docker and Compose found"
  else
    command -v python3 >/dev/null 2>&1 || error "Python 3 not found"
    PYTHON_VERSION=$(python3 -c 'import sys; print(sys.version_info.minor)')
    [[ "$PYTHON_VERSION" -ge 11 ]] || warn "Python 3.11+ recommended (got 3.$PYTHON_VERSION)"
    command -v node >/dev/null 2>&1 || error "Node.js not found. Install: https://nodejs.org"
    command -v npm  >/dev/null 2>&1 || error "npm not found"
    success "Python and Node.js found"
  fi
}

wait_for() {
  local url="$1"
  local label="$2"
  local max=30
  local i=0
  echo -n "  Waiting for $label"
  while ! curl -sf "$url" >/dev/null 2>&1; do
    echo -n "."
    sleep 1
    i=$((i+1))
    [[ $i -ge $max ]] && echo "" && warn "$label not responding after ${max}s" && return 1
  done
  echo ""
  success "$label is ready"
}

start_local() {
  info "Starting in LOCAL mode..."
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$SCRIPT_DIR"

  # ── Backend ──────────────────────────────────────────────
  info "Setting up Python backend..."
  cd backend

  if [[ "$SKIP_INSTALL" != "true" ]]; then
    if [[ ! -d ".venv" ]]; then
      info "Creating virtual environment..."
      python3 -m venv .venv
    fi
    source .venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    success "Python dependencies installed"
  else
    source .venv/bin/activate
  fi

  info "Starting FastAPI backend on port 8000..."
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
  BACKEND_PID=$!
  echo $BACKEND_PID > /tmp/afr-backend.pid
  cd ..

  wait_for "http://localhost:8000/health" "Backend API"

  # ── Frontend ─────────────────────────────────────────────
  info "Setting up React frontend..."
  cd frontend

  if [[ "$SKIP_INSTALL" != "true" ]]; then
    info "Installing npm packages..."
    npm install --silent
    success "Frontend dependencies installed"
  fi

  info "Starting Vite dev server on port 3000..."
  npm run dev &
  FRONTEND_PID=$!
  echo $FRONTEND_PID > /tmp/afr-frontend.pid
  cd ..

  wait_for "http://localhost:3000" "Frontend"

  print_access_info_local
  cleanup_local
}

start_docker() {
  info "Starting in DOCKER mode..."
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$SCRIPT_DIR"

  info "Building and starting all services..."
  docker compose up --build -d 2>&1 | grep -E "(Building|Started|Created|Error)" || true

  wait_for "http://localhost:8000/health" "Backend API"
  wait_for "http://localhost:3000"        "Frontend"
  wait_for "http://localhost:9090/-/ready" "Prometheus"
  wait_for "http://localhost:3001/api/health" "Grafana"

  print_access_info_docker
}

print_access_info_local() {
  echo ""
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${GREEN}  🎉 AlertPulse is running!${RESET}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  echo -e "  ${CYAN}Dashboard${RESET}     →  http://localhost:3000"
  echo -e "  ${CYAN}API Docs${RESET}      →  http://localhost:8000/docs"
  echo -e "  ${CYAN}Prometheus${RESET}    →  (not started in local mode)"
  echo -e "  ${CYAN}Grafana${RESET}       →  (not started in local mode)"
  echo ""
  echo -e "  ${YELLOW}Tip:${RESET} Run ${BOLD}./start.bash docker${RESET} for full stack with Grafana + Prometheus"
  echo ""
  echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop all services"
  echo ""
}

print_access_info_docker() {
  echo ""
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo -e "${GREEN}  🎉 AlertPulse full stack is running!${RESET}"
  echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  echo -e "  ${CYAN}Dashboard${RESET}     →  http://localhost:3000"
  echo -e "  ${CYAN}API Docs${RESET}      →  http://localhost:8000/docs"
  echo -e "  ${CYAN}Prometheus${RESET}    →  http://localhost:9090"
  echo -e "  ${CYAN}Grafana${RESET}       →  http://localhost:3001"
  echo -e "                   (admin / admin123)"
  echo ""
  echo -e "  ${YELLOW}Puppeteer tests:${RESET}"
  echo -e "    cd puppeteer && npm install"
  echo -e "    npm run smoke-test    # UI + API smoke tests"
  echo -e "    npm run screenshot    # Capture dashboard screenshots"
  echo -e "    npm run load-test     # Stress test alert ingestion"
  echo ""
  echo -e "  ${YELLOW}To stop:${RESET}  docker compose down"
  echo ""
}

cleanup_local() {
  trap 'echo ""; info "Shutting down..."; kill $(cat /tmp/afr-backend.pid 2>/dev/null) $(cat /tmp/afr-frontend.pid 2>/dev/null) 2>/dev/null; rm -f /tmp/afr-*.pid; success "Stopped."; exit 0' INT TERM
  wait
}

# ── Entry point ───────────────────────────────────────────
banner
check_deps

case "$MODE" in
  local)  start_local ;;
  docker) start_docker ;;
  *)      error "Unknown mode '$MODE'. Use: ./start.bash local | ./start.bash docker" ;;
esac
