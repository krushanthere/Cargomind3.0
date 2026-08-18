import uuid
from datetime import datetime
from sqlalchemy import String, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class TemperatureLog(Base):
    __tablename__ = "temperature_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vehicle_id: Mapped[str] = mapped_column(String(100), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    temp_celsius: Mapped[float] = mapped_column(Float, nullable=False)
    humidity: Mapped[float | None] = mapped_column(Float, nullable=True)

    shipment = relationship("Shipment", back_populates="temperature_logs")
