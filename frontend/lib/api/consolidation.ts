import {
  apiGet,
  apiPost,
} from "@/lib/api/client";

import type {
  ConsolidationPlan,
  ConsolidationRequest,
  ExplanationItem,
} from "@/types";

export async function generateConsolidationPlans(
  data: ConsolidationRequest,
) {
  return apiPost<
    ConsolidationPlan[],
    ConsolidationRequest
  >("/consolidation/plan", data);
}

export async function getConsolidationPlans() {
  return apiGet<ConsolidationPlan[]>(
    "/consolidation/plan",
  );
}

export async function getConsolidationPlan(
  planId: string,
) {
  return apiGet<ConsolidationPlan>(
    `/consolidation/${planId}`,
  );
}

export async function getPlanExplanation(
  planId: string,
) {
  return apiGet<ExplanationItem[]>(
    `/consolidation/${planId}/explanation`,
  );
}