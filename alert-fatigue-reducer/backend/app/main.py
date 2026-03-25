"""
Alert Fatigue Reducer - FastAPI Backend
Industry-ready alert aggregation and prioritization system
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from prometheus_client import make_asgi_app

from app.api import alerts, metrics, rules, teams, websocket
from app.core.config import settings
from app.core.database import init_db
from app.services.alert_processor import AlertProcessor
from app.services.demo_generator import DemoDataGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

alert_processor: AlertProcessor = None
demo_generator: DemoDataGenerator = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global alert_processor, demo_generator
    logger.info("🚀 Starting Alert Fatigue Reducer...")
    await init_db()
    alert_processor = AlertProcessor()
    await alert_processor.start()
    demo_generator = DemoDataGenerator(alert_processor)
    await demo_generator.start()
    app.state.alert_processor = alert_processor
    app.state.demo_generator = demo_generator
    logger.info("✅ All services started successfully")
    yield
    logger.info("🛑 Shutting down services...")
    await demo_generator.stop()
    await alert_processor.stop()


app = FastAPI(
    title="Alert Fatigue Reducer API",
    description="Smart alert aggregation and prioritization system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Register routers
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])
app.include_router(rules.router, prefix="/api/v1/rules", tags=["rules"])
app.include_router(teams.router, prefix="/api/v1/teams", tags=["teams"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "services": {
            "alert_processor": "running" if alert_processor else "stopped",
            "demo_generator": "running" if demo_generator else "stopped",
        },
    }


@app.get("/")
async def root():
    return {
        "message": "Alert Fatigue Reducer API",
        "docs": "/docs",
        "metrics": "/metrics",
    }
