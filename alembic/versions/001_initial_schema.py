"""Initial Schema Creation

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-17 21:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tenants
    op.create_table(
        'tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.Enum('shipper', 'carrier', 'admin', name='tenanttype'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Hubs
    op.create_table(
        'hubs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=255), nullable=False, index=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lon', sa.Float(), nullable=False),
        sa.Column('type', sa.Enum('warehouse', 'rail_yard', 'crossdock', name='hubtype'), nullable=False),
        sa.Column('cold_storage_capacity_kg', sa.Float(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
    )

    # Routes
    op.create_table(
        'routes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('origin_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('dest_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('mode', sa.Enum('road', 'rail', name='transportmode'), nullable=False),
        sa.Column('avg_transit_hrs', sa.Float(), nullable=False),
        sa.Column('base_cost_per_kg', sa.Float(), nullable=False),
        sa.Column('reliability_score', sa.Float(), nullable=False),
    )

    # Route History
    op.create_table(
        'route_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('route_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('routes.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('trip_date', sa.Date(), nullable=False),
        sa.Column('actual_transit_hrs', sa.Float(), nullable=False),
        sa.Column('delayed', sa.Boolean(), nullable=False),
        sa.Column('delay_reason', sa.String(length=255), nullable=True),
        sa.Column('season', sa.String(length=50), nullable=False),
    )

    # Shipments
    op.create_table(
        'shipments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('origin_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('dest_hub_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('hubs.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('weight_kg', sa.Float(), nullable=False),
        sa.Column('volume_cbm', sa.Float(), nullable=False),
        sa.Column('temp_class', sa.Enum('frozen', 'chilled', 'ambient', name='tempclass'), nullable=False),
        sa.Column('sla_deadline', sa.DateTime(timezone=True), nullable=False),
        sa.Column('max_cost', sa.Float(), nullable=True),
        sa.Column('status', sa.Enum('pending', 'grouped', 'in_transit', 'delivered', name='shipmentstatus'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Temperature Logs
    op.create_table(
        'temperature_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('shipment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('shipments.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('vehicle_id', sa.String(length=100), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('temp_celsius', sa.Float(), nullable=False),
        sa.Column('humidity', sa.Float(), nullable=True),
    )

    # Consolidation Plans
    op.create_table(
        'consolidation_plans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('shipment_ids', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('route_ids', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('departure_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_cost', sa.Float(), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('plan_rank', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('proposed', 'accepted', 'rejected', name='planstatus'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Explanations
    op.create_table(
        'explanations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('plan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('consolidation_plans.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('decision_type', sa.String(length=50), nullable=False),
        sa.Column('factor_name', sa.String(length=100), nullable=False),
        sa.Column('factor_weight', sa.Float(), nullable=False),
        sa.Column('human_readable_text', sa.String(length=1000), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('explanations')
    op.drop_table('consolidation_plans')
    op.drop_table('temperature_logs')
    op.drop_table('shipments')
    op.drop_table('route_history')
    op.drop_table('routes')
    op.drop_table('hubs')
    op.drop_table('tenants')
