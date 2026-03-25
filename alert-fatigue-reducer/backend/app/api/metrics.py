from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_

from app.core.database import get_db
from app.models.alert_model import Alert, AlertGroup
from app.models.schemas import MetricsSummary

router = APIRouter()


@router.get("/summary", response_model=MetricsSummary)
async def get_metrics_summary(db: AsyncSession = Depends(get_db)):
    """Get comprehensive metrics summary for dashboard"""

    total = await db.scalar(select(func.count(Alert.id))) or 0
    firing = await db.scalar(select(func.count(Alert.id)).where(Alert.status == "firing")) or 0
    resolved = await db.scalar(select(func.count(Alert.id)).where(Alert.status == "resolved")) or 0
    suppressed = await db.scalar(select(func.count(Alert.id)).where(Alert.status == "suppressed")) or 0
    acknowledged = await db.scalar(select(func.count(Alert.id)).where(Alert.status == "acknowledged")) or 0

    critical = await db.scalar(select(func.count(Alert.id)).where(Alert.severity == "critical", Alert.status.in_(["firing", "acknowledged"]))) or 0
    high = await db.scalar(select(func.count(Alert.id)).where(Alert.severity == "high", Alert.status.in_(["firing", "acknowledged"]))) or 0
    medium = await db.scalar(select(func.count(Alert.id)).where(Alert.severity == "medium", Alert.status.in_(["firing", "acknowledged"]))) or 0
    low = await db.scalar(select(func.count(Alert.id)).where(Alert.severity == "low", Alert.status.in_(["firing", "acknowledged"]))) or 0
    info = await db.scalar(select(func.count(Alert.id)).where(Alert.severity == "info")) or 0

    noise = await db.scalar(select(func.count(Alert.id)).where(Alert.is_noise == True)) or 0
    noise_pct = round((noise / total * 100), 1) if total > 0 else 0.0

    active_groups = await db.scalar(select(func.count(AlertGroup.id)).where(AlertGroup.status == "active")) or 0

    # Alerts in last hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_count = await db.scalar(select(func.count(Alert.id)).where(Alert.created_at >= one_hour_ago)) or 0
    alerts_per_hour = float(recent_count)

    # Top services
    svc_result = await db.execute(
        select(Alert.service, func.count(Alert.id).label("count"))
        .where(Alert.service != None)
        .group_by(Alert.service)
        .order_by(desc("count"))
        .limit(5)
    )
    top_services = [{"service": r[0], "count": r[1]} for r in svc_result.all()]

    # Top sources
    src_result = await db.execute(
        select(Alert.source, func.count(Alert.id).label("count"))
        .group_by(Alert.source)
        .order_by(desc("count"))
        .limit(5)
    )
    top_sources = [{"source": r[0], "count": r[1]} for r in src_result.all()]

    # Timeline (last 24 hours, hourly buckets)
    timeline = []
    for i in range(23, -1, -1):
        bucket_start = datetime.utcnow() - timedelta(hours=i + 1)
        bucket_end = datetime.utcnow() - timedelta(hours=i)
        count = await db.scalar(
            select(func.count(Alert.id)).where(
                Alert.created_at >= bucket_start,
                Alert.created_at < bucket_end,
            )
        ) or 0
        timeline.append({
            "hour": bucket_start.strftime("%H:%M"),
            "count": count,
        })

    return MetricsSummary(
        total_alerts=total,
        firing_alerts=firing,
        resolved_alerts=resolved,
        suppressed_alerts=suppressed,
        acknowledged_alerts=acknowledged,
        critical_count=critical,
        high_count=high,
        medium_count=medium,
        low_count=low,
        info_count=info,
        noise_reduction_pct=noise_pct,
        active_groups=active_groups,
        alerts_per_hour=alerts_per_hour,
        top_services=top_services,
        top_sources=top_sources,
        timeline=timeline,
    )


@router.get("/realtime")
async def get_realtime_stats(db: AsyncSession = Depends(get_db)):
    """Get real-time stats for live dashboard updates"""
    now = datetime.utcnow()
    five_min_ago = now - timedelta(minutes=5)

    recent_alerts = await db.execute(
        select(Alert.severity, func.count(Alert.id).label("count"))
        .where(Alert.created_at >= five_min_ago)
        .group_by(Alert.severity)
    )
    recent_by_severity = {r[0]: r[1] for r in recent_alerts.all()}

    firing_critical = await db.scalar(
        select(func.count(Alert.id)).where(
            Alert.status == "firing",
            Alert.severity == "critical",
        )
    ) or 0

    return {
        "timestamp": now.isoformat(),
        "firing_critical": firing_critical,
        "recent_5min": recent_by_severity,
        "system_health": "critical" if firing_critical > 5 else "warning" if firing_critical > 0 else "healthy",
    }
