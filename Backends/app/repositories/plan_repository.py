from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.consolidation_plan import ConsolidationPlan, Explanation
from app.repositories.base import BaseTenantRepository


class PlanRepository(BaseTenantRepository[ConsolidationPlan]):
    def __init__(self, db: AsyncSession, tenant_id: UUID):
        super().__init__(ConsolidationPlan, db, tenant_id)

    async def get_plan_with_explanations(self, plan_id: UUID) -> Optional[ConsolidationPlan]:
        stmt = (
            select(ConsolidationPlan)
            .options(selectinload(ConsolidationPlan.explanations))
            .where(
                ConsolidationPlan.id == plan_id,
                ConsolidationPlan.tenant_id == self.tenant_id,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def save_explanations(self, plan_id: UUID, explanations_data: List[dict]) -> List[Explanation]:
        explanation_objects = []
        for item in explanations_data:
            expl = Explanation(
                plan_id=plan_id,
                decision_type=item["decision_type"],
                factor_name=item["factor_name"],
                factor_weight=item["factor_weight"],
                human_readable_text=item["human_readable_text"],
            )
            self.db.add(expl)
            explanation_objects.append(expl)
        await self.db.commit()
        return explanation_objects
