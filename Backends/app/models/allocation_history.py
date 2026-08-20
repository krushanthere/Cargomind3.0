import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class AllocationHistory(Base):
    __tablename__ = "allocation_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    producer_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    producer_name: Mapped[str] = mapped_column(String(255), nullable=False, default="Local Producer")
    community_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    shipment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shipments.id", ondelete="SET NULL"), nullable=True, index=True
    )
    vehicle_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    matched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True
    )
    wait_time_minutes: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    allocation_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    urgency: Mapped[str] = mapped_column(String(50), nullable=False, default="routine")
    good_type: Mapped[str] = mapped_column(String(50), nullable=False, default="farm_produce")
    explanation_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    client_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    shipment = relationship("Shipment", back_populates="allocations")
    vehicle = relationship("Vehicle", back_populates="allocations")
