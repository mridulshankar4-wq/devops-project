"""
Core Alert Processing Engine
Handles deduplication, correlation, prioritization, and noise reduction
"""

import asyncio
import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from collections import defaultdict

from prometheus_client import Counter, Gauge, Histogram

from app.core.database import AsyncSessionLocal
from app.models.alert_model import Alert, AlertGroup, AlertMetric, SuppressionRule
from app.models.schemas import AlertCreate
from sqlalchemy import select, update, func

logger = logging.getLogger(__name__)

# Prometheus metrics
ALERTS_RECEIVED = Counter("afr_alerts_received_total", "Total alerts received", ["severity", "source"])
ALERTS_SUPPRESSED = Counter("afr_alerts_suppressed_total", "Total alerts suppressed", ["reason"])
ALERTS_GROUPED = Counter("afr_alerts_grouped_total", "Total alerts grouped")
NOISE_REDUCED = Counter("afr_noise_reduced_total", "Total noise reduced alerts")
ALERT_PROCESSING_TIME = Histogram("afr_alert_processing_seconds", "Alert processing time")
ACTIVE_ALERTS = Gauge("afr_active_alerts", "Currently active alerts", ["severity"])
ACTIVE_GROUPS = Gauge("afr_active_groups", "Currently active alert groups")
NOISE_REDUCTION_PCT = Gauge("afr_noise_reduction_percentage", "Noise reduction percentage")
ALERTS_PER_MINUTE = Gauge("afr_alerts_per_minute", "Alerts received per minute")


class AlertProcessor:
    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._recent_fingerprints: Dict[str, datetime] = {}
        self._alert_counts: Dict[str, int] = defaultdict(int)
        self._websocket_callbacks: List = []
        self._alert_rate_window: List[datetime] = []

    async def start(self):
        self._running = True
        self._task = asyncio.create_task(self._background_cleanup())
        logger.info("Alert processor started")

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
        logger.info("Alert processor stopped")

    def register_websocket_callback(self, callback):
        self._websocket_callbacks.append(callback)

    def unregister_websocket_callback(self, callback):
        if callback in self._websocket_callbacks:
            self._websocket_callbacks.remove(callback)

    async def _notify_websockets(self, event_type: str, data: dict):
        for callback in self._websocket_callbacks[:]:
            try:
                await callback(event_type, data)
            except Exception as e:
                logger.warning(f"WebSocket callback error: {e}")

    def _compute_fingerprint(self, alert: AlertCreate) -> str:
        key_parts = [
            alert.title.lower().strip(),
            alert.source,
            alert.service or "",
            alert.environment or "",
        ]
        key = "|".join(key_parts)
        return hashlib.md5(key.encode()).hexdigest()

    def _compute_correlation_key(self, alert: AlertCreate) -> str:
        key_parts = [
            alert.source,
            alert.service or "",
            alert.environment or "",
            alert.team or "",
        ]
        return "|".join(key_parts)

    def _calculate_priority_score(self, alert: AlertCreate, is_duplicate: bool) -> float:
        score = 0.0
        severity_scores = {
            "critical": 100.0,
            "high": 75.0,
            "medium": 50.0,
            "low": 25.0,
            "info": 10.0,
        }
        score += severity_scores.get(alert.severity, 50.0)

        env_scores = {"production": 30.0, "staging": 15.0, "development": 5.0}
        score += env_scores.get(alert.environment or "production", 20.0)

        if is_duplicate:
            score *= 0.3
        if alert.annotations.get("runbook_url"):
            score += 5.0
        if alert.labels.get("customer_facing"):
            score += 20.0

        return min(score, 200.0)

    async def _check_suppression(self, alert: AlertCreate) -> Optional[str]:
        async with AsyncSessionLocal() as db:
            now = datetime.utcnow()
            result = await db.execute(
                select(SuppressionRule).where(
                    SuppressionRule.is_active == True,
                    (SuppressionRule.expires_at == None) | (SuppressionRule.expires_at > now),
                )
            )
            rules = result.scalars().all()
            for rule in rules:
                if rule.match_service and rule.match_service != alert.service:
                    continue
                if rule.match_severity and rule.match_severity != alert.severity:
                    continue
                if rule.match_source and rule.match_source != alert.source:
                    continue
                labels_match = all(
                    alert.labels.get(k) == v for k, v in (rule.match_labels or {}).items()
                )
                if labels_match:
                    return rule.reason or f"Suppressed by rule: {rule.name}"
        return None

    async def _find_or_create_group(self, db, alert: AlertCreate, correlation_key: str) -> str:
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=5)

        result = await db.execute(
            select(AlertGroup).where(
                AlertGroup.correlation_key == correlation_key,
                AlertGroup.status == "active",
                AlertGroup.last_seen >= window_start,
            )
        )
        group = result.scalar_one_or_none()

        if group:
            group.alert_count += 1
            group.last_seen = now
            if alert.severity == "critical":
                group.severity = "critical"
            ALERTS_GROUPED.inc()
            return group.id
        else:
            group = AlertGroup(
                name=f"{alert.service or alert.source} - {alert.title[:100]}",
                description=f"Correlated alerts from {alert.source}",
                severity=alert.severity,
                source=alert.source,
                service=alert.service,
                environment=alert.environment,
                team=alert.team,
                alert_count=1,
                correlation_key=correlation_key,
            )
            db.add(group)
            await db.flush()
            ACTIVE_GROUPS.inc()
            return group.id

    async def process_alert(self, alert_data: AlertCreate) -> Alert:
        with ALERT_PROCESSING_TIME.time():
            fingerprint = self._compute_fingerprint(alert_data)
            correlation_key = self._compute_correlation_key(alert_data)

            ALERTS_RECEIVED.labels(
                severity=alert_data.severity, source=alert_data.source
            ).inc()

            now = datetime.utcnow()
            self._alert_rate_window = [
                t for t in self._alert_rate_window if (now - t).seconds < 60
            ]
            self._alert_rate_window.append(now)
            ALERTS_PER_MINUTE.set(len(self._alert_rate_window))

            # Check deduplication
            is_duplicate = False
            if fingerprint in self._recent_fingerprints:
                last_seen = self._recent_fingerprints[fingerprint]
                if (now - last_seen).seconds < 300:
                    is_duplicate = True

            self._recent_fingerprints[fingerprint] = now

            # Check suppression
            suppression_reason = await self._check_suppression(alert_data)

            priority_score = self._calculate_priority_score(alert_data, is_duplicate)

            is_noise = is_duplicate or (priority_score < 15.0)
            noise_reason = None
            if is_duplicate:
                noise_reason = "Duplicate alert within 5 minutes"
            elif priority_score < 15.0:
                noise_reason = "Low priority score - likely noise"

            if is_noise:
                NOISE_REDUCED.inc()

            async with AsyncSessionLocal() as db:
                group_id = await self._find_or_create_group(db, alert_data, correlation_key)

                status = "firing"
                suppressed_until = None
                if suppression_reason:
                    status = "suppressed"
                    suppressed_until = now + timedelta(hours=1)
                    ALERTS_SUPPRESSED.labels(reason="rule_match").inc()
                elif is_duplicate:
                    ALERTS_SUPPRESSED.labels(reason="duplicate").inc()

                db_alert = Alert(
                    title=alert_data.title,
                    description=alert_data.description,
                    severity=alert_data.severity,
                    status=status,
                    source=alert_data.source,
                    service=alert_data.service,
                    environment=alert_data.environment,
                    team=alert_data.team,
                    fingerprint=fingerprint,
                    group_id=group_id,
                    labels=alert_data.labels,
                    annotations=alert_data.annotations,
                    priority_score=priority_score,
                    is_noise=is_noise,
                    noise_reason=noise_reason,
                    suppressed_until=suppressed_until,
                )
                db.add(db_alert)
                await db.commit()
                await db.refresh(db_alert)

                # Update Prometheus gauges
                sev = alert_data.severity
                ACTIVE_ALERTS.labels(severity=sev).inc()

                # Update noise reduction metric
                await self._update_noise_metric(db)

                await self._notify_websockets("new_alert", {
                    "id": db_alert.id,
                    "title": db_alert.title,
                    "severity": db_alert.severity,
                    "status": db_alert.status,
                    "service": db_alert.service,
                    "priority_score": db_alert.priority_score,
                    "is_noise": db_alert.is_noise,
                    "fired_at": db_alert.fired_at.isoformat(),
                })

                return db_alert

    async def _update_noise_metric(self, db):
        total = await db.scalar(select(func.count(Alert.id)))
        noise = await db.scalar(select(func.count(Alert.id)).where(Alert.is_noise == True))
        if total and total > 0:
            pct = (noise / total) * 100
            NOISE_REDUCTION_PCT.set(pct)

    async def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> Optional[Alert]:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Alert).where(Alert.id == alert_id))
            alert = result.scalar_one_or_none()
            if alert:
                alert.status = "acknowledged"
                alert.acknowledged_at = datetime.utcnow()
                alert.acknowledged_by = acknowledged_by
                await db.commit()
                await db.refresh(alert)
                await self._notify_websockets("alert_acknowledged", {"id": alert_id, "by": acknowledged_by})
            return alert

    async def resolve_alert(self, alert_id: str) -> Optional[Alert]:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Alert).where(Alert.id == alert_id))
            alert = result.scalar_one_or_none()
            if alert:
                alert.status = "resolved"
                alert.resolved_at = datetime.utcnow()
                await db.commit()
                await db.refresh(alert)
                ACTIVE_ALERTS.labels(severity=alert.severity).dec()
                await self._notify_websockets("alert_resolved", {"id": alert_id})
            return alert

    async def _background_cleanup(self):
        while self._running:
            try:
                await asyncio.sleep(60)
                now = datetime.utcnow()
                cutoff = now - timedelta(minutes=10)
                self._recent_fingerprints = {
                    k: v for k, v in self._recent_fingerprints.items() if v > cutoff
                }
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Background cleanup error: {e}")
