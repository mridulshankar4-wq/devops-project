from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.alert_model import Alert, AlertGroup, SuppressionRule
from app.models.schemas import (
    AlertCreate, AlertResponse, AlertGroupResponse,
    SuppressionRuleCreate, SuppressionRuleResponse,
    AcknowledgeRequest, PaginatedAlerts
)

router = APIRouter()


def get_processor(request: Request):
    return request.app.state.alert_processor


@router.post("/ingest", response_model=AlertResponse, status_code=201)
async def ingest_alert(alert: AlertCreate, request: Request):
    """Ingest a new alert into the system"""
    processor = get_processor(request)
    db_alert = await processor.process_alert(alert)
    return db_alert


@router.get("/", response_model=PaginatedAlerts)
async def list_alerts(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    status: Optional[str] = None,
    service: Optional[str] = None,
    environment: Optional[str] = None,
    source: Optional[str] = None,
    is_noise: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List alerts with filtering and pagination"""
    query = select(Alert)
    conditions = []

    if severity:
        conditions.append(Alert.severity == severity)
    if status:
        conditions.append(Alert.status == status)
    if service:
        conditions.append(Alert.service == service)
    if environment:
        conditions.append(Alert.environment == environment)
    if source:
        conditions.append(Alert.source == source)
    if is_noise is not None:
        conditions.append(Alert.is_noise == is_noise)
    if search:
        conditions.append(Alert.title.ilike(f"%{search}%"))

    if conditions:
        query = query.where(and_(*conditions))

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    query = query.order_by(desc(Alert.priority_score), desc(Alert.created_at))
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return PaginatedAlerts(
        items=alerts,
        total=total or 0,
        page=page,
        size=size,
        pages=((total or 0) + size - 1) // size,
    )


@router.get("/groups", response_model=List[AlertGroupResponse])
async def list_alert_groups(
    status: Optional[str] = "active",
    db: AsyncSession = Depends(get_db),
):
    """List alert groups"""
    query = select(AlertGroup).options(selectinload(AlertGroup.alerts))
    if status:
        query = query.where(AlertGroup.status == status)
    query = query.order_by(desc(AlertGroup.last_seen))
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: str,
    body: AcknowledgeRequest,
    request: Request,
):
    processor = get_processor(request)
    alert = await processor.acknowledge_alert(alert_id, body.acknowledged_by)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(alert_id: str, request: Request):
    processor = get_processor(request)
    alert = await processor.resolve_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.post("/bulk/acknowledge")
async def bulk_acknowledge(
    alert_ids: List[str],
    body: AcknowledgeRequest,
    request: Request,
):
    processor = get_processor(request)
    results = []
    for alert_id in alert_ids:
        alert = await processor.acknowledge_alert(alert_id, body.acknowledged_by)
        if alert:
            results.append(alert_id)
    return {"acknowledged": len(results), "ids": results}


@router.get("/suppression/rules", response_model=List[SuppressionRuleResponse])
async def list_suppression_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SuppressionRule).order_by(desc(SuppressionRule.created_at)))
    return result.scalars().all()


@router.post("/suppression/rules", response_model=SuppressionRuleResponse, status_code=201)
async def create_suppression_rule(rule: SuppressionRuleCreate, db: AsyncSession = Depends(get_db)):
    db_rule = SuppressionRule(**rule.model_dump())
    if rule.duration_seconds:
        db_rule.expires_at = datetime.utcnow() + timedelta(seconds=rule.duration_seconds)
    db.add(db_rule)
    await db.commit()
    await db.refresh(db_rule)
    return db_rule


@router.delete("/suppression/rules/{rule_id}")
async def delete_suppression_rule(rule_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SuppressionRule).where(SuppressionRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await db.delete(rule)
    await db.commit()
    return {"deleted": rule_id}
