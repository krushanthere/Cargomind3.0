import {
  apiPost,
  apiPostFormData,
} from "@/lib/api/client";

import type {
  AIChatRequest,
  AIChatResponse,
  ExtractShipmentResponse,
  NarratePlanRequest,
  NarratePlanResponse,
  ParseQueryResponse,
  Shipment,
  SummarizeAnomalyRequest,
  SummarizeAnomalyResponse,
} from "@/types";

export async function narratePlan(
  data: NarratePlanRequest,
) {
  return apiPost<
    NarratePlanResponse,
    NarratePlanRequest
  >("/ai/narrate-plan", data);
}

export async function summarizeAnomaly(
  data: SummarizeAnomalyRequest,
) {
  return apiPost<
    SummarizeAnomalyResponse,
    SummarizeAnomalyRequest
  >("/ai/summarize-anomaly", data);
}

export async function askAI(
  data: AIChatRequest,
) {
  return apiPost<
    AIChatResponse,
    AIChatRequest
  >("/ai/chat", data);
}

export async function extractShipment(
  file: File,
) {
  const formData = new FormData();

  formData.append("file", file);

  return apiPostFormData<ExtractShipmentResponse>(
    "/ai/extract-shipment",
    formData,
  );
}

export async function parseSmartQuery(
  query: string,
) {
  return apiPost<
    ParseQueryResponse,
    { query: string }
  >("/ai/parse-query", {
    query,
  });
}