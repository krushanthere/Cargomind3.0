"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PlanStatus =
  | "draft"
  | "approved"
  | "dispatched"
  | "cancelled"
  | string;

interface ConsolidationPlan {
  id: string;
  tenant_id?: string;
  shipment_ids?: string[];
  route_ids?: string[];
  departure_time?: string;
  total_cost: number;
  risk_score: number;
  plan_rank: number;
  status: PlanStatus;
  transit_time_hrs?: number;
  mode_mix?: string[];
  origin_hub_id?: string;
  dest_hub_id?: string;
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

function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 6H14V17H3V6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 10H18L21 13V17H14V10Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="7"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="17"
        cy="18"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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

function IndianRupeeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 5H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 9H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 5C12.5 5 15 6.5 15 9C15 11.5 12.5 13 8 13H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 13L16.5 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7.5L12 3L20 7.5V16.5L12 21L4 16.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 7.5L12 12L19.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 12V20.5"
        stroke="currentColor"
        strokeWidth="1.5"
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

function getRiskPercentage(score: number) {
  const value = score <= 1 ? score * 100 : score;

  return Math.max(0, Math.min(100, value));
}

function getRiskStyle(score: number) {
  const percentage = getRiskPercentage(score);

  if (percentage < 35) {
    return {
      label: "Low risk",
      text: "text-emerald-700",
      bg: "bg-emerald-400/10",
      bar: "bg-emerald-500",
    };
  }

  if (percentage <= 65) {
    return {
      label: "Medium risk",
      text: "text-amber-700",
      bg: "bg-amber-400/10",
      bar: "bg-amber-500",
    };
  }

  return {
    label: "High risk",
    text: "text-rose-700",
    bg: "bg-rose-400/10",
    bar: "bg-rose-500",
  };
}

function getStatusStyle(status: string) {
  switch (status) {
    case "approved":
      return "bg-emerald-400/10 text-emerald-700";

    case "dispatched":
      return "bg-sky-400/10 text-sky-700";

    case "draft":
      return "bg-amber-400/10 text-amber-700";

    case "cancelled":
      return "bg-rose-400/10 text-rose-700";

    default:
      return "bg-slate-400/10 text-slate-600";
  }
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

function normalizePlan(data: unknown): ConsolidationPlan | null {
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
    object.data &&
    typeof object.data === "object"
  ) {
    return normalizePlan(object.data);
  }

  if (
    object.plan &&
    typeof object.plan === "object"
  ) {
    return normalizePlan(object.plan);
  }

  return null;
}

function normalizeShipments(data: unknown): Shipment[] {
  if (Array.isArray(data)) {
    return data as Shipment[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const object = data as Record<string, unknown>;

  for (const key of [
    "shipments",
    "items",
    "results",
    "data",
  ]) {
    if (Array.isArray(object[key])) {
      return object[key] as Shipment[];
    }
  }

  return [];
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

export default function ConsolidationPlanDetailPage() {
  const params = useParams<{ planId: string }>();

  const planId = Array.isArray(params?.planId)
    ? params.planId[0]
    : params?.planId;

  const [plan, setPlan] =
    useState<ConsolidationPlan | null>(null);

  const [shipments, setShipments] =
    useState<Shipment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function loadPlan(isRefresh = false) {
    if (!planId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000/api";

      const response = await fetch(
        `${baseUrl}/consolidation/${encodeURIComponent(
          planId,
        )}`,
        {
          method: "GET",
          headers: {
            ...getAuthHeaders(),
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        let message =
          "Unable to load the consolidation plan.";

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

      const data = await response.json();

      const normalizedPlan =
        normalizePlan(data);

      if (!normalizedPlan) {
        throw new Error(
          "The backend returned an invalid consolidation plan.",
        );
      }

      setPlan(normalizedPlan);

      /*
       * Fetch the shipment registry separately.
       *
       * This lets the page enrich shipment IDs from
       * the consolidation plan with their actual cargo
       * information.
       */
      try {
        const shipmentResponse = await fetch(
          `${baseUrl}/shipments`,
          {
            method: "GET",
            headers: {
              ...getAuthHeaders(),
            },
            cache: "no-store",
          },
        );

        if (shipmentResponse.ok) {
          const shipmentData =
            await shipmentResponse.json();

          setShipments(
            normalizeShipments(
              shipmentData,
            ),
          );
        }
      } catch {
        /*
         * Shipment enrichment is optional.
         * The plan itself should still render.
         */
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the consolidation plan.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, [planId]);

  const planShipments = useMemo(() => {
    if (!plan?.shipment_ids) {
      return [];
    }

    return plan.shipment_ids.map(
      (id) =>
        shipments.find(
          (shipment) => shipment.id === id,
        ) ?? {
          id,
          origin_hub_id: "—",
          dest_hub_id: "—",
          weight_kg: 0,
          volume_cbm: 0,
          temp_class: "unknown",
          sla_deadline: "",
          max_cost: 0,
          status: "unknown",
        },
    );
  }, [plan, shipments]);

  const totalWeight = useMemo(
    () =>
      planShipments.reduce(
        (sum, shipment) =>
          sum + shipment.weight_kg,
        0,
      ),
    [planShipments],
  );

  const totalVolume = useMemo(
    () =>
      planShipments.reduce(
        (sum, shipment) =>
          sum + shipment.volume_cbm,
        0,
      ),
    [planShipments],
  );

  const temperatureClasses = useMemo(
    () =>
      Array.from(
        new Set(
          planShipments.map(
            (shipment) =>
              shipment.temp_class,
          ),
        ),
      ),
    [planShipments],
  );

  if (loading) {
    return (
      <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="h-4 w-32 animate-pulse rounded bg-white/50" />

          <div className="mt-8 h-12 w-96 animate-pulse rounded bg-white/50" />

          <div className="mt-4 h-5 w-[500px] max-w-full animate-pulse rounded bg-white/40" />

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="cargomind-panel h-[620px] animate-pulse rounded-[30px]" />

            <div className="space-y-5">
              <div className="cargomind-panel h-[300px] animate-pulse rounded-[30px]" />
              <div className="cargomind-panel h-[250px] animate-pulse rounded-[30px]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !plan) {
    return (
      <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
        <div className="mx-auto max-w-[900px]">
          <Link
            href="/consolidation"
            className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-[#111216]"
          >
            <ArrowLeftIcon />
            Back to consolidation
          </Link>

          <section className="mt-8 rounded-[30px] border border-rose-200/70 bg-rose-50/70 p-9 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <ShieldIcon />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-rose-800">
              Plan unavailable
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-[10px] leading-5 text-rose-700/70">
              {error ||
                "The requested consolidation plan could not be found."}
            </p>

            <div className="mt-6 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => loadPlan()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-[10px] font-semibold text-white hover:bg-rose-700"
              >
                <RefreshIcon />
                Try again
              </button>

              <Link
                href="/consolidation"
                className="inline-flex h-10 items-center rounded-xl bg-white/70 px-4 text-[10px] font-semibold text-rose-700 hover:bg-white"
              >
                Consolidation
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const riskPercentage = getRiskPercentage(
    plan.risk_score,
  );

  const riskStyle = getRiskStyle(
    plan.risk_score,
  );

  const statusStyle = getStatusStyle(
    plan.status,
  );

  return (
    <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Top controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/consolidation"
            className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-[#111216]"
          >
            <ArrowLeftIcon />
            Back to consolidation
          </Link>

          <button
            type="button"
            onClick={() => loadPlan(true)}
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

            Refresh
          </button>
        </div>

        {/* Header */}
        <section className="animate-fade-up mt-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
                <SparkIcon />
                Consolidation plan
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#111a20] sm:text-5xl">
                  Plan {plan.plan_rank}
                </h1>

                <span
                  className={`rounded-full px-3 py-2 text-[9px] font-semibold capitalize ${statusStyle}`}
                >
                  {plan.status}
                </span>

                {plan.plan_rank === 1 && (
                  <span className="rounded-full bg-cyan-400/10 px-3 py-2 text-[9px] font-semibold text-cyan-700">
                    Recommended
                  </span>
                )}
              </div>

              <p className="mt-3 text-[11px] text-slate-400">
                Plan ID:{" "}
                <span className="font-medium text-slate-500">
                  {plan.id}
                </span>
              </p>
            </div>

            <Link
              href={`/ai-intelligence?plan=${encodeURIComponent(
                plan.id,
              )}`}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-6 text-[10px] font-semibold text-white shadow-[0_15px_35px_rgba(17,18,22,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#24252a]"
            >
              <SparkIcon />
              Analyze with AI
              <span className="transition-transform group-hover:translate-x-0.5">
                <ArrowUpRightIcon />
              </span>
            </Link>
          </div>
        </section>

        {/* Metrics */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Total cost
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-600">
                <IndianRupeeIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {formatCurrency(plan.total_cost)}
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Optimized movement cost
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Risk score
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-600">
                <ShieldIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {riskPercentage.toFixed(0)}%
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              {riskStyle.label}
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Transit time
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-600">
                <ClockIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {plan.transit_time_hrs != null
                ? `${plan.transit_time_hrs.toFixed(1)}h`
                : "—"}
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Estimated journey duration
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Consolidated cargo
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-600">
                <PackageIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {plan.shipment_ids?.length ?? 0}
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Shipment requests in this plan
            </p>
          </div>
        </section>

        {/* Main */}
        <section className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          {/* Left */}
          <div className="space-y-5">
            {/* Route */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10 text-violet-600">
                  <TruckIcon />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Movement strategy
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                    Optimized route
                  </h2>
                </div>
              </div>

              <div className="mt-7 rounded-[25px] bg-white/45 p-6">
                <div className="flex items-center gap-5">
                  <div className="min-w-0">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Origin
                    </p>

                    <p className="mt-2 truncate text-[13px] font-semibold text-[#111a20]">
                      {plan.origin_hub_id ||
                        planShipments[0]
                          ?.origin_hub_id ||
                        "Origin hub"}
                    </p>
                  </div>

                  <div className="flex flex-1 items-center gap-2">
                    <div className="h-px flex-1 bg-slate-300/70" />

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111216] text-white">
                      <TruckIcon />
                    </div>

                    <div className="h-px flex-1 bg-slate-300/70" />
                  </div>

                  <div className="min-w-0 text-right">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Destination
                    </p>

                    <p className="mt-2 truncate text-[13px] font-semibold text-[#111a20]">
                      {plan.dest_hub_id ||
                        planShipments[0]
                          ?.dest_hub_id ||
                        "Destination hub"}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/50 p-4">
                    <p className="text-[8px] uppercase tracking-[0.1em] text-slate-400">
                      Route legs
                    </p>

                    <p className="mt-2 text-[12px] font-semibold text-[#111a20]">
                      {plan.route_ids?.length ??
                        0}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/50 p-4">
                    <p className="text-[8px] uppercase tracking-[0.1em] text-slate-400">
                      Mode mix
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(plan.mode_mix?.length
                        ? plan.mode_mix
                        : ["Optimized"]
                      ).map((mode) => (
                        <span
                          key={mode}
                          className="rounded-full bg-slate-400/10 px-2 py-1 text-[8px] font-semibold capitalize text-slate-500"
                        >
                          {mode}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/50 p-4">
                    <p className="text-[8px] uppercase tracking-[0.1em] text-slate-400">
                      Departure
                    </p>

                    <p className="mt-2 text-[10px] font-semibold text-[#111a20]">
                      {formatDate(
                        plan.departure_time,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Shipment composition */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Load composition
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                    Consolidated shipments
                  </h2>
                </div>

                <div className="rounded-xl bg-white/60 px-3 py-2 text-[9px] font-semibold text-slate-500">
                  {planShipments.length} loads
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {planShipments.length === 0 ? (
                  <div className="rounded-2xl bg-white/40 p-6 text-center sm:col-span-2">
                    <p className="text-[10px] font-semibold text-[#111a20]">
                      Shipment details unavailable
                    </p>

                    <p className="mt-1 text-[9px] text-slate-400">
                      The plan contains shipment IDs, but their
                      registry data could not be loaded.
                    </p>
                  </div>
                ) : (
                  planShipments.map(
                    (shipment) => (
                      <Link
                        key={shipment.id}
                        href={`/shipments/${encodeURIComponent(
                          shipment.id,
                        )}`}
                        className="group rounded-2xl bg-white/45 p-5 transition-all hover:bg-white/70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold text-[#111a20]">
                              {shipment.id}
                            </p>

                            <p className="mt-1 text-[8px] text-slate-400">
                              {
                                shipment.origin_hub_id
                              }{" "}
                              →{" "}
                              {
                                shipment.dest_hub_id
                              }
                            </p>
                          </div>

                          <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[8px] font-semibold capitalize text-cyan-700">
                            {
                              shipment.temp_class
                            }
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[8px] text-slate-400">
                              Weight
                            </p>

                            <p className="mt-1 text-[10px] font-semibold text-[#111a20]">
                              {shipment.weight_kg.toLocaleString(
                                "en-IN",
                              )}{" "}
                              kg
                            </p>
                          </div>

                          <div>
                            <p className="text-[8px] text-slate-400">
                              Volume
                            </p>

                            <p className="mt-1 text-[10px] font-semibold text-[#111a20]">
                              {shipment.volume_cbm}{" "}
                              m³
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-300/15 pt-4">
                          <span className="text-[8px] text-slate-400">
                            SLA{" "}
                            {formatDate(
                              shipment.sla_deadline,
                            )}
                          </span>

                          <span className="text-slate-400 transition-transform group-hover:translate-x-0.5">
                            <ArrowUpRightIcon />
                          </span>
                        </div>
                      </Link>
                    ),
                  )
                )}
              </div>
            </section>

            {/* Composition summary */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/45 p-5">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-slate-400">
                    Combined weight
                  </p>

                  <p className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
                    {totalWeight.toLocaleString(
                      "en-IN",
                    )}{" "}
                    kg
                  </p>
                </div>

                <div className="rounded-2xl bg-white/45 p-5">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-slate-400">
                    Combined volume
                  </p>

                  <p className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
                    {totalVolume.toFixed(2)} m³
                  </p>
                </div>

                <div className="rounded-2xl bg-white/45 p-5">
                  <p className="text-[8px] uppercase tracking-[0.1em] text-slate-400">
                    Temperature zones
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {temperatureClasses.length >
                    0 ? (
                      temperatureClasses.map(
                        (temp) => (
                          <span
                            key={temp}
                            className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[8px] font-semibold capitalize text-cyan-700"
                          >
                            {temp}
                          </span>
                        ),
                      )
                    ) : (
                      <span className="text-[10px] font-semibold text-[#111a20]">
                        Not available
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right */}
          <aside className="space-y-5">
            {/* Risk */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Predicted risk
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                    Plan risk
                  </h2>
                </div>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${riskStyle.bg} ${riskStyle.text}`}
                >
                  <ShieldIcon />
                </div>
              </div>

              <div className="mt-7 flex items-end justify-between">
                <div>
                  <p className="text-4xl font-semibold tracking-[-0.055em] text-[#111a20]">
                    {riskPercentage.toFixed(0)}%
                  </p>

                  <p
                    className={`mt-1 text-[9px] font-semibold ${riskStyle.text}`}
                  >
                    {riskStyle.label}
                  </p>
                </div>

                <p className="text-[8px] text-slate-400">
                  Backend risk score
                </p>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className={`h-full rounded-full ${riskStyle.bar}`}
                  style={{
                    width: `${riskPercentage}%`,
                  }}
                />
              </div>

              <div className="mt-6 rounded-2xl bg-white/45 p-4">
                <p className="text-[9px] leading-5 text-slate-400">
                  This score is an optimization signal. Open AI
                  Intelligence to inspect the underlying risk
                  factors instead of treating the score as a black
                  box.
                </p>
              </div>
            </section>

            {/* Plan facts */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Plan facts
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300/20 pb-4">
                  <span className="text-[9px] text-slate-400">
                    Plan rank
                  </span>

                  <span className="text-[11px] font-semibold text-[#111a20]">
                    #{plan.plan_rank}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-300/20 pb-4">
                  <span className="text-[9px] text-slate-400">
                    Plan status
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[8px] font-semibold capitalize ${statusStyle}`}
                  >
                    {plan.status}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-300/20 pb-4">
                  <span className="text-[9px] text-slate-400">
                    Route legs
                  </span>

                  <span className="text-[11px] font-semibold text-[#111a20]">
                    {plan.route_ids?.length ??
                      0}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-300/20 pb-4">
                  <span className="text-[9px] text-slate-400">
                    Shipments
                  </span>

                  <span className="text-[11px] font-semibold text-[#111a20]">
                    {plan.shipment_ids?.length ??
                      0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400">
                    Departure
                  </span>

                  <span className="max-w-[160px] text-right text-[9px] font-semibold text-[#111a20]">
                    {formatDate(
                      plan.departure_time,
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* AI CTA */}
            <section className="relative overflow-hidden rounded-[30px] bg-[#111216] p-7 text-white shadow-[0_20px_55px_rgba(17,18,22,0.12)]">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-2 text-cyan-300">
                  <SparkIcon />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em]">
                    Explainable AI
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-semibold tracking-[-0.035em]">
                  Why did CargoMind choose this plan?
                </h2>

                <p className="mt-3 text-[10px] leading-5 text-white/45">
                  Explore the risk factors, optimization constraints
                  and decision trace behind this recommendation.
                </p>

                <Link
                  href={`/ai-intelligence?plan=${encodeURIComponent(
                    plan.id,
                  )}`}
                  className="mt-6 flex h-11 items-center justify-center gap-2 rounded-2xl bg-white text-[10px] font-semibold text-[#111216] transition-colors hover:bg-cyan-100"
                >
                  Open AI Intelligence
                  <ArrowUpRightIcon />
                </Link>
              </div>
            </section>
          </aside>
        </section>

        {/* Bottom AI banner */}
        <section className="mt-5 overflow-hidden rounded-[30px] border border-white/50 bg-white/25 p-7 backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111216] text-white">
                <SparkIcon />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Next layer
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                  Turn this recommendation into an explainable decision
                </h2>

                <p className="mt-2 max-w-2xl text-[10px] leading-5 text-slate-400">
                  The AI Intelligence workspace will connect this
                  plan with risk prediction, SHAP-style factor
                  attribution, constraint tracing and natural-language
                  reasoning.
                </p>
              </div>
            </div>

            <Link
              href={`/ai-intelligence?plan=${encodeURIComponent(
                plan.id,
              )}`}
              className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-5 text-[10px] font-semibold text-white transition-all hover:-translate-y-0.5"
            >
              Continue to AI
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