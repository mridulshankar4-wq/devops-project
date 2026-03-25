from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False)  # critical, high, medium, low, info
    status = Column(String(20), default="firing")  # firing, resolved, suppressed, acknowledged
    source = Column(String(100), nullable=False)  # prometheus, datadog, cloudwatch, etc.
    service = Column(String(100), nullable=True)
    environment = Column(String(50), nullable=True)  # prod, staging, dev
    team = Column(String(100), nullable=True)
    fingerprint = Column(String(64), nullable=True, index=True)
    group_id = Column(String, ForeignKey("alert_groups.id"), nullable=True)
    labels = Column(JSON, default=dict)
    annotations = Column(JSON, default=dict)
    priority_score = Column(Float, default=0.0)
    is_noise = Column(Boolean, default=False)
    noise_reason = Column(String(200), nullable=True)
    fired_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(100), nullable=True)
    suppressed_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    group = relationship("AlertGroup", back_populates="alerts")


class AlertGroup(Base):
    __tablename__ = "alert_groups"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(300), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), nullable=False)
    status = Column(String(20), default="active")
    source = Column(String(100), nullable=True)
    service = Column(String(100), nullable=True)
    environment = Column(String(50), nullable=True)
    team = Column(String(100), nullable=True)
    alert_count = Column(Integer, default=0)
    suppressed_count = Column(Integer, default=0)
    correlation_key = Column(String(200), nullable=True, index=True)
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    alerts = relationship("Alert", back_populates="group")


class SuppressionRule(Base):
    __tablename__ = "suppression_rules"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    match_labels = Column(JSON, default=dict)
    match_service = Column(String(100), nullable=True)
    match_severity = Column(String(20), nullable=True)
    match_source = Column(String(100), nullable=True)
    duration_seconds = Column(Integer, default=3600)
    reason = Column(String(200), nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)


class AlertMetric(Base):
    __tablename__ = "alert_metrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    total_alerts = Column(Integer, default=0)
    critical_alerts = Column(Integer, default=0)
    high_alerts = Column(Integer, default=0)
    medium_alerts = Column(Integer, default=0)
    low_alerts = Column(Integer, default=0)
    suppressed_alerts = Column(Integer, default=0)
    noise_reduction_pct = Column(Float, default=0.0)
    active_groups = Column(Integer, default=0)
