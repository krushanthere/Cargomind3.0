from typing import TypeVar, Generic, Type, Optional, List, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseTenantRepository(Generic[ModelType]):
    """Base repository providing automatic tenant isolation on all queries."""

    def __init__(self, model: Type[ModelType], db: AsyncSession, tenant_id: UUID):
        self.model = model
        self.db = db
        self.tenant_id = tenant_id

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        stmt = select(self.model).where(
            self.model.id == id,
            getattr(self.model, "tenant_id") == self.tenant_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        filters: Optional[dict] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[ModelType]:
        stmt = select(self.model).where(getattr(self.model, "tenant_id") == self.tenant_id)
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key) and value is not None:
                    stmt = stmt.where(getattr(self.model, key) == value)
        stmt = stmt.limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> ModelType:
        kwargs["tenant_id"] = self.tenant_id
        instance = self.model(**kwargs)
        self.db.add(instance)
        await self.db.commit()
        await self.db.refresh(instance)
        return instance

    async def update(self, id: UUID, **kwargs) -> Optional[ModelType]:
        kwargs.pop("tenant_id", None)
        stmt = (
            update(self.model)
            .where(
                self.model.id == id,
                getattr(self.model, "tenant_id") == self.tenant_id,
            )
            .values(**kwargs)
            .returning(self.model)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.scalar_one_or_none()

    async def delete(self, id: UUID) -> bool:
        stmt = delete(self.model).where(
            self.model.id == id,
            getattr(self.model, "tenant_id") == self.tenant_id,
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0
