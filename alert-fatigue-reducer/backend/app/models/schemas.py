from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import uuid


class AlertBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str  # critical, high, medium, low, info
    source: str
    service: Optional[str] = None
    environment: Optional[str] = "production"
    team: Optional[str] = None
    labels: Dict[str, Any] = {}
    annotations: Dict[str, Any] = {}


class AlertCreate(AlertBase):
    fingerprint: Optional[str] = None


class AlertResponse(AlertBase):
    id: str
    status: str
    fingerprint: Optional[str]
    group_id: Optional[str]
    priority_score: float
    is_noise: bool
    noise_reason: Optional[str]
    fired_at: datetime
    resolved_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    acknowledged_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlertGroupResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    severity: str
    status: str
    source: Optional[str]
    service: Optional[str]
    environment: Optional[str]
    team: Optional[str]
    alert_count: int
    suppressed_count: int
    first_seen: datetime
    last_seen: datetime
    alerts: List[AlertResponse] = []

    class Config:
        from_attributes = True


class SuppressionRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    match_labels: Dict[str, Any] = {}
    match_service: Optional[str] = None
    match_severity: Optional[str] = None
    match_source: Optional[str] = None
    duration_seconds: int = 3600
    reason: Optional[str] = None
    created_by: Optional[str] = None


class SuppressionRuleResponse(SuppressionRuleCreate):
    id: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class AcknowledgeRequest(BaseModel):
    acknowledged_by: str
    comment: Optional[str] = None


class MetricsSummary(BaseModel):
    total_alerts: int
    firing_alerts: int
    resolved_alerts: int
    suppressed_alerts: int
    acknowledged_alerts: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    noise_reduction_pct: float
    active_groups: int
    alerts_per_hour: float
    top_services: List[Dict[str, Any]]
    top_sources: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]


class PaginatedAlerts(BaseModel):
    items: List[AlertResponse]
    total: int
    page: int
    size: int
    pages: int
