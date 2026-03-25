"""
Demo Data Generator - Simulates realistic production alert scenarios
"""

import asyncio
import logging
import random
from datetime import datetime
from typing import Optional

from app.models.schemas import AlertCreate
from app.services.alert_processor import AlertProcessor

logger = logging.getLogger(__name__)

SERVICES = [
    "payment-service", "auth-service", "user-api", "order-processor",
    "notification-service", "inventory-manager", "search-engine",
    "recommendation-engine", "analytics-pipeline", "cdn-edge",
    "database-primary", "cache-cluster", "message-queue", "api-gateway",
]

SOURCES = ["prometheus", "datadog", "cloudwatch", "pagerduty", "grafana", "zabbix"]

ENVIRONMENTS = ["production", "staging", "development"]

TEAMS = ["platform", "backend", "frontend", "data-engineering", "security", "infra"]

ALERT_SCENARIOS = [
    {
        "title": "High CPU utilization detected",
        "description": "CPU usage exceeds 90% threshold for more than 5 minutes",
        "severity": "critical",
        "labels": {"metric": "cpu_percent", "threshold": "90"},
    },
    {
        "title": "Memory usage approaching limit",
        "description": "Memory consumption at 85% of allocated limit",
        "severity": "high",
        "labels": {"metric": "memory_percent", "threshold": "85"},
    },
    {
        "title": "Increased error rate on API endpoint",
        "description": "5xx error rate increased to 3.2% in the last 5 minutes",
        "severity": "critical",
        "labels": {"metric": "error_rate", "endpoint": "/api/v1/process"},
    },
    {
        "title": "Database connection pool exhausted",
        "description": "All database connections are in use, new connections being rejected",
        "severity": "critical",
        "labels": {"metric": "db_connections", "pool_size": "100"},
    },
    {
        "title": "Slow query detected",
        "description": "Query execution time exceeded 2000ms threshold",
        "severity": "medium",
        "labels": {"metric": "query_time_ms", "threshold": "2000"},
    },
    {
        "title": "Disk space running low",
        "description": "Disk usage at 88% - action required within 24 hours",
        "severity": "high",
        "labels": {"metric": "disk_percent", "path": "/var/data"},
    },
    {
        "title": "Service health check failing",
        "description": "Health endpoint returning 503 for 3 consecutive checks",
        "severity": "critical",
        "labels": {"check": "health_endpoint", "consecutive_failures": "3"},
    },
    {
        "title": "Latency spike detected",
        "description": "P99 latency increased to 800ms (baseline: 150ms)",
        "severity": "high",
        "labels": {"metric": "p99_latency_ms", "baseline": "150", "current": "800"},
    },
    {
        "title": "SSL certificate expiring soon",
        "description": "SSL certificate expires in 7 days",
        "severity": "medium",
        "labels": {"check": "ssl_expiry", "days_remaining": "7"},
    },
    {
        "title": "Unusual traffic spike",
        "description": "Request rate increased by 400% compared to baseline",
        "severity": "high",
        "labels": {"metric": "request_rate", "increase_pct": "400"},
    },
    {
        "title": "Cache hit rate degraded",
        "description": "Redis cache hit rate dropped to 45% (expected >80%)",
        "severity": "medium",
        "labels": {"metric": "cache_hit_rate", "current": "45", "expected": "80"},
    },
    {
        "title": "Queue depth increasing",
        "description": "Message queue depth has grown to 50,000 messages",
        "severity": "high",
        "labels": {"metric": "queue_depth", "current": "50000"},
    },
    {
        "title": "Deployment rollout detected",
        "description": "New deployment detected - monitoring for issues",
        "severity": "info",
        "labels": {"event": "deployment", "version": "v2.4.1"},
    },
    {
        "title": "Pod restart loop detected",
        "description": "Kubernetes pod restarted 5 times in last 10 minutes",
        "severity": "critical",
        "labels": {"platform": "kubernetes", "restart_count": "5"},
    },
    {
        "title": "Security scan completed",
        "description": "Vulnerability scan completed with 2 medium findings",
        "severity": "low",
        "labels": {"scan_type": "vulnerability", "findings": "2"},
    },
]


class DemoDataGenerator:
    def __init__(self, processor: AlertProcessor):
        self.processor = processor
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._alert_count = 0

    async def start(self):
        self._running = True
        self._task = asyncio.create_task(self._generate_loop())
        logger.info("Demo data generator started")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        logger.info("Demo data generator stopped")

    async def generate_burst(self, count: int = 10):
        """Generate a burst of alerts for demo purposes"""
        for _ in range(count):
            await self._generate_alert()
            await asyncio.sleep(0.1)

    async def _generate_alert(self):
        scenario = random.choice(ALERT_SCENARIOS)
        service = random.choice(SERVICES)
        source = random.choice(SOURCES)

        # Bias towards production for realism
        env_weights = [0.7, 0.2, 0.1]
        environment = random.choices(ENVIRONMENTS, weights=env_weights)[0]

        team = random.choice(TEAMS)

        # Occasionally generate duplicates to demonstrate dedup
        if random.random() < 0.2 and self._alert_count > 5:
            service = SERVICES[0]  # Force duplicate service

        alert = AlertCreate(
            title=scenario["title"],
            description=scenario["description"],
            severity=scenario["severity"],
            source=source,
            service=service,
            environment=environment,
            team=team,
            labels={
                **scenario["labels"],
                "host": f"node-{random.randint(1, 20):02d}",
                "datacenter": random.choice(["us-east-1", "us-west-2", "eu-west-1"]),
                "customer_facing": random.choice([True, False]),
            },
            annotations={
                "summary": scenario["description"],
                "runbook_url": f"https://runbooks.internal/{service}" if random.random() > 0.4 else None,
            },
        )

        try:
            await self.processor.process_alert(alert)
            self._alert_count += 1
        except Exception as e:
            logger.error(f"Failed to generate demo alert: {e}")

    async def _generate_loop(self):
        # Initial burst to populate dashboard
        logger.info("Generating initial alert data...")
        for _ in range(25):
            await self._generate_alert()
            await asyncio.sleep(0.2)

        while self._running:
            try:
                # Variable rate to simulate real-world patterns
                interval = random.uniform(2.0, 5.0)

                # Simulate incident bursts
                if random.random() < 0.05:
                    logger.info("Simulating incident burst...")
                    for _ in range(random.randint(3, 8)):
                        await self._generate_alert()
                        await asyncio.sleep(0.3)
                else:
                    await self._generate_alert()

                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Demo generator error: {e}")
                await asyncio.sleep(5)
