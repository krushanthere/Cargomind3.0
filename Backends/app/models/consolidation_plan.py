import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Enum, Float, ForeignKey, DateTime, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base


class PlanStatus(str, enum.Enum):
    proposed = "proposed"
    accepted = "accepted"
    rejected = "rejected"


class ConsolidationPlan(Base):
    __tablename__ = "consolidation_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    shipment_ids: Mapped[list] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    route_ids: Mapped[list] = mapped_column(JSON().with_variant(JSONB, "postgresql"), nullable=False)
    departure_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_cost: Mapped[float] = mapped_column(Float, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    plan_rank: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[PlanStatus] = mapped_column(
        Enum(PlanStatus), nullable=False, default=PlanStatus.proposed, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    tenant = relationship("Tenant", back_populates="consolidation_plans")
    explanations = relationship("Explanation", back_populates="plan", cascade="all, delete-orphan")


class Explanation(Base):
    __tablename__ = "explanations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("consolidation_plans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    decision_type: Mapped[str] = mapped_column(String(50), nullable=False)
    factor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    factor_weight: Mapped[float] = mapped_column(Float, nullable=False)
    human_readable_text: Mapped[str] = mapped_column(String(1000), nullable=False)

    plan = relationship("ConsolidationPlan", back_populates="explanations")
