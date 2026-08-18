"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

type DecisionType =
  | "risk"
  | "capacity"
  | "cost"
  | "grouping"
  | "routing"
  | string;

interface ExplanationItem {
  id?: string;
  plan_id?: string;
  decision_type: DecisionType;
  factor_name: string;
  factor_weight: number;
  human_readable_text: string;
}

interface ConsolidationPlan {
  id: string;
  shipment_ids?: string[];
  route_ids?: string[];
  departure_time?: string;
  total_cost: number;
  risk_score: number;
  plan_rank: number;
  status: string;
  transit_time_hrs?: number;
  mode_mix?: string[];
  origin_hub_id?: string;
  dest_hub_id?: string;
}

interface RiskResult {
  risk_score?: number;
  delay_risk?: number;
  spoilage_risk?: number;
  temperature_risk?: number;
  factors?: Array<{
    name: string;
    value: number;
    impact?: number;
  }>;
  explanation?: string;
}

interface NarrationResult {
  narrative?: string;
  summary?: string;
  text?: string;
  based_on?: string[];
}

interface Shipment {
  id: string;
  origin_hub_id: string;
  dest_hub_id: string;
  weight_kg: number;
  volume_cbm: number;
  temp_class: string;
  sla_deadline: string;
  max_cost: number;
  status: string;
}

function SparkIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L20 6V11.5C20 16.5 16.8 20 12 21C7.2 20 4 16.5 4 11.5V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 12L10.8 14.8L16 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M19 12H5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 19L5 12L12 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 17L17 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9 7H17V15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 11A8 8 0 0 0 6.2 6.2L4 8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 4V8.5H8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 13A8 8 0 0 0 17.8 17.8L20 15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 20V15.5H15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 7V12L15.5 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle
        cx="6"
        cy="18"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="18"
        cy="6"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 18H10C13 18 14 16 14 13.5V10.5C14 8 15 6 18 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <ellipse
        cx="12"
        cy="5"
        rx="7"
        ry="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 5V12C5 13.66 8.13 15 12 15C15.87 15 19 13.66 19 12V5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 12V19C5 20.66 8.13 22 12 22C15.87 22 19 20.66 19 19V12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeScore(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.max(
    0,
    Math.min(100, value <= 1 ? value * 100 : value),
  );
}

function getRiskState(score: number) {
  const normalized = normalizeScore(score);

  if (normalized < 35) {
    return {
      label: "Low",
      className: "bg-emerald-400/10 text-emerald-700",
      text: "text-emerald-600",
      bar: "bg-emerald-500",
    };
  }

  if (normalized <= 65) {
    return {
      label: "Moderate",
      className: "bg-amber-400/10 text-amber-700",
      text: "text-amber-600",
      bar: "bg-amber-500",
    };
  }

  return {
    label: "High",
    className: "bg-rose-400/10 text-rose-700",
    text: "text-rose-600",
    bar: "bg-rose-500",
  };
}

function getFactorWidth(weight: number, maximum: number) {
  if (maximum <= 0) return 0;

  return Math.max(
    5,
    Math.min(
      100,
      (Math.abs(weight) / maximum) * 100,
    ),
  );
}

function normalizeExplanation(
  data: unknown,
): ExplanationItem[] {
  if (Array.isArray(data)) {
    return data as ExplanationItem[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const object = data as Record<string, unknown>;

  for (const key of [
    "explanations",
    "items",
    "results",
    "data",
  ]) {
    if (Array.isArray(object[key])) {
      return object[key] as ExplanationItem[];
    }
  }

  return [];
}

function normalizePlan(
  data: unknown,
): ConsolidationPlan | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const object = data as Record<string, unknown>;

  if (
    typeof object.id === "string" &&
    typeof object.total_cost === "number"
  ) {
    return object as unknown as ConsolidationPlan;
  }

  if (
    object.plan &&
    typeof object.plan === "object"
  ) {
    return normalizePlan(object.plan);
  }

  if (
    object.data &&
    typeof object.data === "object"
  ) {
    return normalizePlan(object.data);
  }

  return null;
}

function normalizeRisk(
  data: unknown,
): RiskResult | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const object = data as Record<string, unknown>;

  if (
    typeof object.risk_score === "number" ||
    typeof object.delay_risk === "number" ||
    typeof object.spoilage_risk === "number"
  ) {
    return object as unknown as RiskResult;
  }

  if (
    object.data &&
    typeof object.data === "object"
  ) {
    return normalizeRisk(object.data);
  }

  if (
    object.result &&
    typeof object.result === "object"
  ) {
    return normalizeRisk(object.result);
  }

  return null;
}

function normalizeNarration(
  data: unknown,
): NarrationResult | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const object = data as Record<string, unknown>;

  if (
    typeof object.narrative === "string" ||
    typeof object.summary === "string" ||
    typeof object.text === "string"
  ) {
    return object as unknown as NarrationResult;
  }

  if (
    object.data &&
    typeof object.data === "object"
  ) {
    return normalizeNarration(object.data);
  }

  return null;
}

function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const headers: Record<string, string> = {};

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("cargomind_token");

  const tenantId =
    localStorage.getItem("tenant_id") ||
    localStorage.getItem("tenantId") ||
    localStorage.getItem("cargomind_tenant_id");

  const tenantRole =
    localStorage.getItem("tenant_role") ||
    localStorage.getItem("tenantRole") ||
    localStorage.getItem("cargomind_tenant_role");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    headers["X-Tenant-ID"] = tenantId;
  }

  if (tenantRole) {
    headers["X-Tenant-Role"] = tenantRole;
  }

  return headers;
}

async function fetchJson(
  endpoint: string,
  options?: RequestInit,
) {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000/api";

  const response = await fetch(
    `${baseUrl}${endpoint}`,
    {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options?.headers || {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let message = "Request failed.";

    try {
      const body = await response.json();

      if (typeof body?.detail === "string") {
        message = body.detail;
      } else if (
        typeof body?.message === "string"
      ) {
        message = body.message;
      }
    } catch {
      // Keep default message.
    }

    throw new Error(message);
  }

  return response.json();
}

function AIIntelligenceContent() {
  const searchParams = useSearchParams();

  const planId =
    searchParams.get("plan");

  const shipmentId =
    searchParams.get("shipment");

  const [plan, setPlan] =
    useState<ConsolidationPlan | null>(null);

  const [explanations, setExplanations] =
    useState<ExplanationItem[]>([]);

  const [risk, setRisk] =
    useState<RiskResult | null>(null);

  const [narration, setNarration] =
    useState<NarrationResult | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [optionalErrors, setOptionalErrors] =
    useState<string[]>([]);

  const [narrating, setNarrating] =
    useState(false);

  const loadIntelligence =
    useCallback(
      async (isRefresh = false) => {
        if (!planId && !shipmentId) {
          setLoading(false);
          setError(
            "No plan or shipment was selected for AI analysis.",
          );
          return;
        }

        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError(null);
          setOptionalErrors([]);

          /*
           * The core intelligence page is plan-first.
           * If only a shipment is supplied, we first attempt
           * to obtain its latest consolidation context.
           */
          let resolvedPlanId =
            planId;

          if (!resolvedPlanId && shipmentId) {
            try {
              const shipmentPlans =
                await fetchJson(
                  `/consolidation/plan?shipment_id=${encodeURIComponent(
                    shipmentId,
                  )}`,
                );

              const possiblePlan =
                normalizePlan(
                  shipmentPlans,
                );

              if (possiblePlan) {
                resolvedPlanId =
                  possiblePlan.id;
                setPlan(possiblePlan);
              }
            } catch {
              /*
               * Shipment-only intelligence can still display
               * the risk endpoint if the backend supports it.
               */
            }
          }

          if (!resolvedPlanId) {
            if (shipmentId) {
              try {
                const riskResponse =
                  await fetchJson(
                    "/risk/predict",
                    {
                      method: "POST",
                      headers: {
                        "Content-Type":
                          "application/json",
                      },
                      body: JSON.stringify({
                        shipment_id:
                          shipmentId,
                      }),
                    },
                  );

                setRisk(
                  normalizeRisk(
                    riskResponse,
                  ),
                );
              } catch (riskError) {
                throw new Error(
                  riskError instanceof Error
                    ? riskError.message
                    : "Unable to obtain shipment intelligence.",
                );
              }
            } else {
              throw new Error(
                "A consolidation plan or shipment is required.",
              );
            }

            return;
          }

          /*
           * 1. Core plan
           */
          const planResponse =
            await fetchJson(
              `/consolidation/${encodeURIComponent(
                resolvedPlanId,
              )}`,
            );

          const resolvedPlan =
            normalizePlan(
              planResponse,
            );

          if (!resolvedPlan) {
            throw new Error(
              "The backend returned an invalid consolidation plan.",
            );
          }

          setPlan(resolvedPlan);

          /*
           * 2. Explainability
           *
           * This is one of the core backend features.
           */
          try {
            const explanationResponse =
              await fetchJson(
                `/consolidation/${encodeURIComponent(
                  resolvedPlanId,
                )}/explanation`,
              );

            setExplanations(
              normalizeExplanation(
                explanationResponse,
              ),
            );
          } catch {
            setExplanations([]);

            setOptionalErrors(
              (current) => [
                ...current,
                "Explanation data is currently unavailable.",
              ],
            );
          }

          /*
           * 3. Risk prediction
           *
           * The exact backend schema can evolve, so the
           * frontend accepts several compatible response shapes.
           */
          try {
            const riskResponse =
              await fetchJson(
                "/risk/predict",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    plan_id:
                      resolvedPlanId,
                    shipment_id:
                      shipmentId ||
                      undefined,
                  }),
                },
              );

            setRisk(
              normalizeRisk(
                riskResponse,
              ),
            );
          } catch {
            /*
             * The plan already contains risk_score,
             * therefore the AI page remains usable.
             */
            setRisk(null);

            setOptionalErrors(
              (current) => [
                ...current,
                "Live risk prediction is unavailable; showing the plan risk score.",
              ],
            );
          }

          /*
           * 4. Narration
           *
           * This is optional so an LLM outage never breaks
           * the core optimization demo.
           */
          try {
            const narrationResponse =
              await fetchJson(
                "/ai/narrate-plan",
                {
                  method: "POST",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    plan_id:
                      resolvedPlanId,
                  }),
                },
              );

            setNarration(
              normalizeNarration(
                narrationResponse,
              ),
            );
          } catch {
            setNarration(null);

            setOptionalErrors(
              (current) => [
                ...current,
                "AI narration is currently unavailable.",
              ],
            );
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load AI intelligence.",
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [planId, shipmentId],
    );

  useEffect(() => {
    loadIntelligence();
  }, [loadIntelligence]);

  const groupedExplanations =
    useMemo(() => {
      const groups: Record<
        string,
        ExplanationItem[]
      > = {};

      for (const item of explanations) {
        const key =
          item.decision_type ||
          "other";

        if (!groups[key]) {
          groups[key] = [];
        }

        groups[key].push(item);
      }

      return groups;
    }, [explanations]);

  const factorExplanations =
    useMemo(() => {
      return explanations
        .filter(
          (item) =>
            item.decision_type ===
              "risk" ||
            item.decision_type ===
              "routing",
        )
        .sort(
          (a, b) =>
            Math.abs(
              b.factor_weight,
            ) -
            Math.abs(
              a.factor_weight,
            ),
        );
    }, [explanations]);

  const maximumFactorWeight =
    useMemo(() => {
      return Math.max(
        1,
        ...factorExplanations.map(
          (item) =>
            Math.abs(
              item.factor_weight,
            ),
        ),
      );
    }, [factorExplanations]);

  const constraints =
    useMemo(() => {
      return explanations.filter(
        (item) =>
          item.decision_type ===
            "capacity" ||
          item.decision_type ===
            "cost" ||
          item.decision_type ===
            "grouping",
      );
    }, [explanations]);

  const displayedRisk = normalizeScore(
    risk?.risk_score ??
      plan?.risk_score ??
      0,
  );

  const delayRisk = normalizeScore(
    risk?.delay_risk ?? 0,
  );

  const spoilageRisk = normalizeScore(
    risk?.spoilage_risk ??
      risk?.temperature_risk ??
      0,
  );

  const riskState =
    getRiskState(displayedRisk);

  const narrativeText =
    narration?.narrative ||
    narration?.summary ||
    narration?.text ||
    "";

  if (loading) {
    return (
      <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
        <div className="mx-auto max-w-[1550px]">
          <div className="h-4 w-36 animate-pulse rounded bg-white/50" />

          <div className="mt-8 h-14 w-[500px] max-w-full animate-pulse rounded bg-white/50" />

          <div className="mt-4 h-5 w-[700px] max-w-full animate-pulse rounded bg-white/40" />

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="cargomind-panel h-[500px] animate-pulse rounded-[30px]" />

            <div className="cargomind-panel h-[500px] animate-pulse rounded-[30px]" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
        <div className="mx-auto max-w-[900px]">
          <Link
            href={
              planId
                ? `/consolidation/${encodeURIComponent(
                    planId,
                  )}`
                : "/consolidation"
            }
            className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-[#111216]"
          >
            <ArrowLeftIcon />
            Back
          </Link>

          <section className="mt-8 rounded-[30px] border border-rose-200/70 bg-rose-50/70 p-9 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <ShieldIcon />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-rose-800">
              Intelligence unavailable
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-[10px] leading-5 text-rose-700/70">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadIntelligence(true)
              }
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-[10px] font-semibold text-white hover:bg-rose-700"
            >
              <RefreshIcon />
              Try again
            </button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
      <div className="mx-auto max-w-[1550px]">
        {/* Header */}
        <section className="animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <Link
              href={
                planId
                  ? `/consolidation/${encodeURIComponent(
                      planId,
                    )}`
                  : "/consolidation"
              }
              className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-[#111216]"
            >
              <ArrowLeftIcon />
              Back to plan
            </Link>

            <button
              type="button"
              onClick={() =>
                loadIntelligence(true)
              }
              disabled={refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/45 px-4 text-[10px] font-medium text-slate-500 backdrop-blur-md hover:bg-white/70 disabled:opacity-50"
            >
              <span
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              >
                <RefreshIcon />
              </span>

              Refresh intelligence
            </button>
          </div>

          <div className="mt-7 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
                <SparkIcon />
                Explainable AI
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.06em] text-[#111a20] sm:text-5xl lg:text-6xl">
                AI Intelligence
              </h1>

              <p className="mt-4 max-w-3xl text-[14px] leading-7 text-slate-500">
                Understand not only what CargoMind recommends,
                but <span className="font-semibold text-slate-600">why</span>{" "}
                the system made that decision.
              </p>

              {plan && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#111216] px-3 py-1.5 text-[8px] font-semibold text-white">
                    Plan {plan.plan_rank}
                  </span>

                  <span className="rounded-full bg-white/60 px-3 py-1.5 text-[8px] font-semibold text-slate-500">
                    {plan.id}
                  </span>

                  {shipmentId && (
                    <span className="rounded-full bg-white/60 px-3 py-1.5 text-[8px] font-semibold text-slate-500">
                      Shipment {shipmentId}
                    </span>
                  )}
                </div>
              )}
            </div>

            {plan && (
              <Link
                href={`/consolidation/${encodeURIComponent(
                  plan.id,
                )}`}
                className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-white/55 px-5 text-[10px] font-semibold text-slate-600 backdrop-blur-md transition-all hover:bg-white/80"
              >
                View optimization plan
                <span className="transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRightIcon />
                </span>
              </Link>
            )}
          </div>
        </section>

        {/* Optional backend warnings */}
        {optionalErrors.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-200/60 bg-amber-50/60 px-5 py-4">
            <p className="text-[9px] font-semibold text-amber-800">
              Some intelligence services are unavailable
            </p>

            <p className="mt-1 text-[8px] leading-5 text-amber-700/70">
              Core plan information remains available. Optional AI
              services can be restored without affecting the
              optimization workflow.
            </p>
          </div>
        )}

        {/* Risk hero */}
        <section className="mt-7 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-[32px] bg-[#111216] p-8 text-white shadow-[0_25px_70px_rgba(17,18,22,0.13)]">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 text-cyan-300">
                <ShieldIcon />

                <span className="text-[9px] font-semibold uppercase tracking-[0.17em]">
                  Predictive risk engine
                </span>
              </div>

              <div className="mt-8 flex flex-col justify-between gap-8 md:flex-row md:items-end">
                <div>
                  <p className="text-[10px] text-white/35">
                    Overall predicted risk
                  </p>

                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-6xl font-semibold tracking-[-0.07em]">
                      {displayedRisk.toFixed(0)}
                    </span>

                    <span className="mb-2 text-2xl text-white/30">
                      %
                    </span>
                  </div>

                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1.5 text-[9px] font-semibold ${riskState.className}`}
                  >
                    {riskState.label} risk
                  </span>
                </div>

                <div className="w-full max-w-[310px]">
                  <div className="flex items-center justify-between text-[8px] text-white/35">
                    <span>Risk intensity</span>
                    <span>
                      {displayedRisk.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${riskState.bar}`}
                      style={{
                        width: `${displayedRisk}%`,
                      }}
                    />
                  </div>

                  <p className="mt-4 text-[8px] leading-5 text-white/30">
                    The score combines the backend's predicted
                    operational and cargo-risk signals. The factor
                    analysis below shows what is driving the result.
                  </p>
                </div>
              </div>

              <div className="mt-9 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-white/25">
                    Delay risk
                  </p>

                  <p className="mt-3 text-xl font-semibold">
                    {delayRisk
                      ? `${delayRisk.toFixed(0)}%`
                      : "—"}
                  </p>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-300"
                      style={{
                        width: `${delayRisk}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-white/25">
                    Spoilage risk
                  </p>

                  <p className="mt-3 text-xl font-semibold">
                    {spoilageRisk
                      ? `${spoilageRisk.toFixed(0)}%`
                      : "—"}
                  </p>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-cyan-300"
                      style={{
                        width: `${spoilageRisk}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-white/25">
                    Decision factors
                  </p>

                  <p className="mt-3 text-xl font-semibold">
                    {factorExplanations.length}
                  </p>

                  <p className="mt-2 text-[8px] text-white/30">
                    Explainable signals found
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Plan snapshot */}
          <div className="cargomind-panel rounded-[32px] p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10 text-violet-600">
                <RouteIcon />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Decision context
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                  What the optimizer considered
                </h2>
              </div>
            </div>

            {plan ? (
              <div className="mt-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300/20 pb-4">
                  <span className="text-[9px] text-slate-400">
                    Plan cost
                  </span>

                  <span className="text-[11px] font-semibold text-[#111a20]">
                    {formatCurrency(
                      plan.total_cost,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-300/20 pb-4">
                  <span className="text-[9px] text-slate-400">
                    Transit time
                  </span>

                  <span className="text-[11px] font-semibold text-[#111a20]">
                    {plan.transit_time_hrs !=
                    null
                      ? `${plan.transit_time_hrs.toFixed(
                          1,
                        )} hrs`
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-300/20 pb-4">
                  <span className="text-[9px] text-slate-400">
                    Shipments
                  </span>

                  <span className="text-[11px] font-semibold text-[#111a20]">
                    {plan.shipment_ids
                      ?.length ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-300/20 pb-4">
                  <span className="text-[9px] text-slate-400">
                    Route legs
                  </span>

                  <span className="text-[11px] font-semibold text-[#111a20]">
                    {plan.route_ids
                      ?.length ?? 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">
                    Departure
                  </span>

                  <span className="text-right text-[9px] font-semibold text-[#111a20]">
                    {formatDate(
                      plan.departure_time,
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-7 rounded-2xl bg-white/45 p-5">
                <p className="text-[10px] leading-5 text-slate-400">
                  No consolidation plan was supplied. The available
                  shipment-level intelligence is shown below.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* AI narrative */}
        <section className="mt-5 overflow-hidden rounded-[32px] bg-white/50 p-7 shadow-[0_18px_50px_rgba(17,18,22,0.04)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#111216] text-white">
              <SparkIcon />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  AI plan narrator
                </p>

                {narration && (
                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[8px] font-semibold text-emerald-700">
                    Generated from backend data
                  </span>
                )}
              </div>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                Executive reasoning
              </h2>

              {narrativeText ? (
                <p className="mt-5 max-w-4xl text-[13px] leading-7 text-slate-600">
                  {narrativeText}
                </p>
              ) : (
                <div className="mt-5 rounded-2xl bg-white/50 p-5">
                  <p className="text-[10px] leading-5 text-slate-400">
                    AI narration is not currently available. The
                    underlying risk and explanation data remains
                    available below.
                  </p>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!plan?.id) return;

                      try {
                        setNarrating(true);

                        const response =
                          await fetchJson(
                            "/ai/narrate-plan",
                            {
                              method:
                                "POST",
                              headers: {
                                "Content-Type":
                                  "application/json",
                              },
                              body: JSON.stringify(
                                {
                                  plan_id:
                                    plan.id,
                                },
                              ),
                            },
                          );

                        setNarration(
                          normalizeNarration(
                            response,
                          ),
                        );
                      } catch {
                        setNarration(null);
                      } finally {
                        setNarrating(false);
                      }
                    }}
                    disabled={
                      narrating ||
                      !plan?.id
                    }
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-[#111216] px-4 text-[9px] font-semibold text-white disabled:opacity-50"
                  >
                    {narrating ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <SparkIcon />
                        Generate explanation
                      </>
                    )}
                  </button>
                </div>
              )}

              {narration?.based_on &&
                narration.based_on.length >
                  0 && (
                  <details className="mt-5 rounded-2xl bg-slate-400/5 p-4">
                    <summary className="cursor-pointer text-[9px] font-semibold text-slate-500">
                      Based on backend data
                    </summary>

                    <ul className="mt-3 space-y-2">
                      {narration.based_on.map(
                        (item, index) => (
                          <li
                            key={`${item}-${index}`}
                            className="text-[9px] leading-5 text-slate-400"
                          >
                            {item}
                          </li>
                        ),
                      )}
                    </ul>
                  </details>
                )}
            </div>
          </div>
        </section>

        {/* Explainability */}
        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Factors */}
          <section className="cargomind-panel rounded-[32px] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Explainability
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                  What is driving the risk?
                </h2>

                <p className="mt-2 max-w-xl text-[9px] leading-5 text-slate-400">
                  Factor attribution converts the model output into
                  understandable signals for a logistics decision
                  maker.
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-600">
                <DatabaseIcon />
              </div>
            </div>

            {factorExplanations.length ===
            0 ? (
              <div className="mt-7 rounded-2xl bg-white/45 p-7 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white/70 text-slate-400">
                  <ShieldIcon />
                </div>

                <p className="mt-4 text-[10px] font-semibold text-[#111a20]">
                  No factor explanation returned
                </p>

                <p className="mt-2 text-[9px] leading-5 text-slate-400">
                  The backend has not returned SHAP-style factor
                  attribution for this plan yet.
                </p>
              </div>
            ) : (
              <div className="mt-7 space-y-5">
                {factorExplanations.map(
                  (factor, index) => {
                    const weight =
                      Math.abs(
                        factor.factor_weight,
                      );

                    const width =
                      getFactorWidth(
                        factor.factor_weight,
                        maximumFactorWeight,
                      );

                    return (
                      <div
                        key={
                          factor.id ||
                          `${factor.factor_name}-${index}`
                        }
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-[#111a20]">
                              {
                                factor.factor_name
                              }
                            </p>

                            <p className="mt-1 text-[9px] leading-5 text-slate-400">
                              {
                                factor.human_readable_text
                              }
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full bg-slate-400/10 px-2.5 py-1 text-[8px] font-semibold text-slate-500">
                            {factor.factor_weight >
                            0
                              ? "+"
                              : ""}
                            {factor.factor_weight.toFixed(
                              3,
                            )}
                          </span>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200/70">
                          <div
                            className={`h-full rounded-full ${
                              factor.factor_weight >=
                              0
                                ? "bg-rose-400"
                                : "bg-emerald-400"
                            }`}
                            style={{
                              width: `${width}%`,
                            }}
                          />
                        </div>

                        <p className="mt-1 text-right text-[8px] text-slate-400">
                          contribution{" "}
                          {weight.toFixed(3)}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </section>

          {/* Explanation summary */}
          <section className="cargomind-panel rounded-[32px] p-7">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Decision trace
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
              Why this decision?
            </h2>

            <div className="mt-7 space-y-3">
              {Object.entries(
                groupedExplanations,
              ).length === 0 ? (
                <div className="rounded-2xl bg-white/45 p-6 text-center">
                  <p className="text-[10px] font-semibold text-[#111a20]">
                    No explanation trace available
                  </p>

                  <p className="mt-2 text-[9px] leading-5 text-slate-400">
                    Explanation rows will appear here when the backend
                    provides them.
                  </p>
                </div>
              ) : (
                Object.entries(
                  groupedExplanations,
                ).map(
                  ([type, items]) => (
                    <div
                      key={type}
                      className="rounded-2xl bg-white/45 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-semibold capitalize text-[#111a20]">
                          {type}
                        </span>

                        <span className="rounded-full bg-slate-400/10 px-2 py-1 text-[8px] text-slate-400">
                          {items.length}
                        </span>
                      </div>

                      <p className="mt-2 text-[8px] leading-4 text-slate-400">
                        {type ===
                        "capacity"
                          ? "Capacity constraints that influenced grouping or routing."
                          : type ===
                            "cost"
                          ? "Commercial constraints that influenced the selected strategy."
                          : type ===
                            "grouping"
                          ? "Compatibility and consolidation decisions."
                          : type ===
                            "routing"
                          ? "Route-level decisions and operational signals."
                          : "Risk-related model signals and decisions."}
                      </p>
                    </div>
                  ),
                )
              )}
            </div>
          </section>
        </section>

        {/* Constraint trace */}
        <section className="mt-5 cargomind-panel rounded-[32px] p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-600">
              <RouteIcon />
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Constraint tracer
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                Optimization decision timeline
              </h2>

              <p className="mt-2 max-w-2xl text-[9px] leading-5 text-slate-400">
                Instead of exposing solver output, CargoMind translates
                binding constraints into a human-readable decision
                trace.
              </p>
            </div>
          </div>

          {constraints.length ===
          0 ? (
            <div className="mt-7 rounded-2xl bg-white/45 p-7 text-center">
              <p className="text-[10px] font-semibold text-[#111a20]">
                No binding constraints returned
              </p>

              <p className="mt-2 text-[9px] leading-5 text-slate-400">
                Constraint-trace entries will appear here when the
                optimizer records them for this plan.
              </p>
            </div>
          ) : (
            <div className="relative mt-8 space-y-0">
              <div className="absolute bottom-5 left-[15px] top-5 w-px bg-slate-300/40" />

              {constraints.map(
                (item, index) => (
                  <div
                    key={
                      item.id ||
                      `${item.factor_name}-${index}`
                    }
                    className="relative flex gap-5 pb-7 last:pb-0"
                  >
                    <div className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-[#edf3f1] bg-[#111216] text-white">
                      <span className="text-[8px] font-semibold">
                        {index + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 rounded-2xl bg-white/45 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[8px] font-semibold capitalize text-amber-700">
                          {
                            item.decision_type
                          }
                        </span>

                        <span className="text-[8px] text-slate-400">
                          Decision {index + 1}
                        </span>
                      </div>

                      <h3 className="mt-3 text-[11px] font-semibold text-[#111a20]">
                        {item.factor_name}
                      </h3>

                      <p className="mt-2 text-[9px] leading-5 text-slate-400">
                        {
                          item.human_readable_text
                        }
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* Grounding */}
        <section className="mt-5 rounded-[32px] border border-white/60 bg-white/25 p-7 backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111216] text-white">
                <DatabaseIcon />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Grounded intelligence
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                  AI is connected to the logistics decision
                </h2>

                <p className="mt-2 max-w-3xl text-[9px] leading-5 text-slate-400">
                  This workspace uses the plan, risk prediction and
                  explanation data returned by the CargoMind backend.
                  AI-generated narration is treated as an additional
                  interpretation layer, not as the source of truth.
                </p>
              </div>
            </div>

            <Link
              href={
                plan
                  ? `/consolidation/${encodeURIComponent(
                      plan.id,
                    )}`
                  : "/consolidation"
              }
              className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-5 text-[10px] font-semibold text-white transition-all hover:-translate-y-0.5"
            >
              Return to optimization
              <span className="transition-transform group-hover:translate-x-0.5">
                <ArrowUpRightIcon />
              </span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AIIntelligencePage() {
  return (
    <Suspense
      fallback={
        <div className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
          <div className="mx-auto max-w-[1500px] animate-pulse">
            <div className="h-6 w-48 rounded-full bg-white/40" />
            <div className="mt-6 h-12 w-96 rounded-2xl bg-white/40" />
            <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
              <div className="h-96 rounded-[30px] bg-white/40" />
              <div className="h-96 rounded-[30px] bg-white/40" />
            </div>
          </div>
        </div>
      }
    >
      <AIIntelligenceContent />
    </Suspense>
  );
}