"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getShipments } from "@/lib/api/shipments";
import type { Shipment } from "@/types";

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

function TruckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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

function getRiskLabel(score: number) {
  const percentage =
    score <= 1 ? score * 100 : score;

  if (percentage < 35) {
    return {
      label: "Low risk",
      className: "bg-emerald-400/10 text-emerald-700",
      bar: "bg-emerald-500",
    };
  }

  if (percentage <= 65) {
    return {
      label: "Medium risk",
      className: "bg-amber-400/10 text-amber-700",
      bar: "bg-amber-500",
    };
  }

  return {
    label: "High risk",
    className: "bg-rose-400/10 text-rose-700",
    bar: "bg-rose-500",
  };
}

function getRiskPercentage(score: number) {
  const value = score <= 1 ? score * 100 : score;

  return Math.max(0, Math.min(100, value));
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

function normalizeShipments(response: unknown): Shipment[] {
  if (Array.isArray(response)) {
    return response as Shipment[];
  }

  if (response && typeof response === "object") {
    const objectResponse = response as Record<
      string,
      unknown
    >;

    for (const key of [
      "shipments",
      "data",
      "items",
      "results",
    ]) {
      const value = objectResponse[key];

      if (Array.isArray(value)) {
        return value as Shipment[];
      }
    }
  }

  return [];
}

function normalizePlans(response: unknown): ConsolidationPlan[] {
  if (Array.isArray(response)) {
    return response as ConsolidationPlan[];
  }

  if (response && typeof response === "object") {
    const objectResponse = response as Record<
      string,
      unknown
    >;

    for (const key of [
      "plans",
      "data",
      "items",
      "results",
    ]) {
      const value = objectResponse[key];

      if (Array.isArray(value)) {
        return value as ConsolidationPlan[];
      }
    }

    if (
      typeof objectResponse.id === "string" &&
      typeof objectResponse.total_cost === "number"
    ) {
      return [
        objectResponse as unknown as ConsolidationPlan,
      ];
    }
  }

  return [];
}

function getStoredAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};

  if (typeof window === "undefined") {
    return headers;
  }

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

export default function ConsolidationPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [plans, setPlans] = useState<ConsolidationPlan[]>([]);

  const [loadingShipments, setLoadingShipments] =
    useState(true);

  const [generating, setGenerating] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [planError, setPlanError] =
    useState<string | null>(null);

  const [selectedPlanId, setSelectedPlanId] =
    useState<string | null>(null);

  const pendingShipments = useMemo(
    () =>
      shipments.filter(
        (shipment) =>
          shipment.status === "pending",
      ),
    [shipments],
  );

  const selectedShipments = useMemo(
    () =>
      shipments.filter((shipment) =>
        selectedIds.includes(shipment.id),
      ),
    [shipments, selectedIds],
  );

  const totalWeight = useMemo(
    () =>
      selectedShipments.reduce(
        (total, shipment) =>
          total + shipment.weight_kg,
        0,
      ),
    [selectedShipments],
  );

  const totalVolume = useMemo(
    () =>
      selectedShipments.reduce(
        (total, shipment) =>
          total + shipment.volume_cbm,
        0,
      ),
    [selectedShipments],
  );

  async function loadShipments(
    isRefresh = false,
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingShipments(true);
      }

      setError(null);

      const response = await getShipments();

      const normalized =
        normalizeShipments(response);

      setShipments(normalized);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load shipments.",
      );
    } finally {
      setLoadingShipments(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadShipments();
  }, []);

  function toggleShipment(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (shipmentId) => shipmentId !== id,
          )
        : [...current, id],
    );

    setPlans([]);
    setSelectedPlanId(null);
    setPlanError(null);
  }

  function selectAllPending() {
    setSelectedIds(
      pendingShipments.map(
        (shipment) => shipment.id,
      ),
    );

    setPlans([]);
    setSelectedPlanId(null);
    setPlanError(null);
  }

  function clearSelection() {
    setSelectedIds([]);
    setPlans([]);
    setSelectedPlanId(null);
    setPlanError(null);
  }

  async function generatePlans() {
    if (selectedIds.length === 0) {
      setPlanError(
        "Select at least one shipment before generating a consolidation plan.",
      );
      return;
    }

    try {
      setGenerating(true);
      setPlanError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000/api";

      const response = await fetch(
        `${baseUrl}/consolidation/plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getStoredAuthHeaders(),
          },
          body: JSON.stringify({
            shipment_ids: selectedIds,
          }),
        },
      );

      if (!response.ok) {
        let message =
          "Unable to generate consolidation plans.";

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
          // Keep default error.
        }

        throw new Error(message);
      }

      const data = await response.json();

      const normalizedPlans =
        normalizePlans(data);

      if (normalizedPlans.length === 0) {
        throw new Error(
          "The backend returned no consolidation plans for the selected shipments.",
        );
      }

      const sortedPlans = [
        ...normalizedPlans,
      ].sort(
        (a, b) =>
          (a.plan_rank ?? 999) -
          (b.plan_rank ?? 999),
      );

      setPlans(sortedPlans);

      setSelectedPlanId(
        sortedPlans[0]?.id ?? null,
      );
    } catch (err) {
      setPlanError(
        err instanceof Error
          ? err.message
          : "Unable to generate consolidation plans.",
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
      <div className="mx-auto max-w-[1800px]">
        {/* Header */}
        <section className="animate-fade-up flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
              <SparkIcon />
              Optimization Engine
            </div>

            <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#111a20] sm:text-5xl">
              Consolidation
            </h1>

            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-500">
              Select compatible shipment requests and let CargoMind
              generate optimized movement strategies balancing
              cost, risk and operational efficiency.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadShipments(true)}
              disabled={refreshing}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/45 px-5 text-[10px] font-medium text-slate-600 backdrop-blur-md transition-all hover:bg-white/70 disabled:opacity-50"
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

            <Link
              href="/shipments/create"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-5 text-[10px] font-semibold text-white shadow-[0_14px_30px_rgba(17,18,22,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#24252a]"
            >
              Add shipment
              <ArrowUpRightIcon />
            </Link>
          </div>
        </section>

        {/* KPI */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Pending shipments
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-600">
                <PackageIcon />
              </div>
            </div>

            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#111a20]">
              {loadingShipments
                ? "—"
                : pendingShipments.length}
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Available for consolidation
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Selected
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-600">
                <SparkIcon />
              </div>
            </div>

            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#111a20]">
              {selectedIds.length}
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Shipment requests in scenario
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Combined weight
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-600">
                <TruckIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[#111a20]">
              {totalWeight.toLocaleString(
                "en-IN",
              )}{" "}
              kg
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Across selected shipments
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Combined volume
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-600">
                <PackageIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-[#111a20]">
              {totalVolume.toFixed(2)} m³
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Across selected shipments
            </p>
          </div>
        </section>

        {/* Main workspace */}
        <section className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.55fr]">
          {/* Shipment selection */}
          <section className="cargomind-panel rounded-[30px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Scenario builder
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                  Select shipments
                </h2>

                <p className="mt-2 text-[10px] leading-5 text-slate-400">
                  Choose shipments you want the optimizer to
                  evaluate together.
                </p>
              </div>

              <button
                type="button"
                onClick={selectAllPending}
                disabled={
                  pendingShipments.length === 0
                }
                className="rounded-xl bg-white/60 px-3 py-2 text-[9px] font-semibold text-slate-500 transition-colors hover:bg-white disabled:opacity-40"
              >
                Select all
              </button>
            </div>

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4">
                <p className="text-[10px] font-semibold text-rose-700">
                  Unable to load shipments
                </p>

                <p className="mt-1 text-[9px] leading-5 text-rose-600/70">
                  {error}
                </p>
              </div>
            )}

            {loadingShipments ? (
              <div className="mt-6 space-y-3">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-[88px] animate-pulse rounded-2xl bg-white/40"
                    />
                  ),
                )}
              </div>
            ) : pendingShipments.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-white/40 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/70 text-slate-400">
                  <PackageIcon />
                </div>

                <p className="mt-4 text-[11px] font-semibold text-[#111a20]">
                  No pending shipments
                </p>

                <p className="mt-2 text-[9px] leading-5 text-slate-400">
                  Create shipment requests first before generating
                  consolidation plans.
                </p>

                <Link
                  href="/shipments/create"
                  className="mt-5 inline-flex h-9 items-center gap-2 rounded-xl bg-[#111216] px-4 text-[9px] font-semibold text-white"
                >
                  Create shipment
                  <ArrowUpRightIcon />
                </Link>
              </div>
            ) : (
              <div className="mt-6 max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {pendingShipments.map(
                  (shipment) => {
                    const selected =
                      selectedIds.includes(
                        shipment.id,
                      );

                    return (
                      <button
                        key={shipment.id}
                        type="button"
                        onClick={() =>
                          toggleShipment(
                            shipment.id,
                          )
                        }
                        className={`w-full rounded-2xl border p-4 text-left transition-all ${
                          selected
                            ? "border-[#111216]/15 bg-white/80 shadow-sm"
                            : "border-transparent bg-white/40 hover:bg-white/65"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[9px] font-bold ${
                              selected
                                ? "border-[#111216] bg-[#111216] text-white"
                                : "border-slate-300 bg-white/50 text-transparent"
                            }`}
                          >
                            ✓
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="truncate text-[11px] font-semibold text-[#111a20]">
                                  {shipment.id}
                                </p>

                                <p className="mt-1 text-[9px] text-slate-400">
                                  {
                                    shipment.origin_hub_id
                                  }{" "}
                                  →{" "}
                                  {
                                    shipment.dest_hub_id
                                  }
                                </p>
                              </div>

                              <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[8px] font-semibold capitalize text-cyan-700">
                                {
                                  shipment.temp_class
                                }
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                              <span className="text-[9px] text-slate-400">
                                {shipment.weight_kg.toLocaleString(
                                  "en-IN",
                                )}{" "}
                                kg
                              </span>

                              <span className="text-[9px] text-slate-400">
                                {shipment.volume_cbm} m³
                              </span>

                              <span className="text-[9px] text-slate-400">
                                Max{" "}
                                {formatCurrency(
                                  shipment.max_cost,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}

            <div className="mt-5 border-t border-slate-300/20 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-400">
                  {selectedIds.length} shipment
                  {selectedIds.length === 1
                    ? ""
                    : "s"}{" "}
                  selected
                </span>

                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[9px] font-semibold text-slate-500 hover:text-[#111216]"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={generatePlans}
                disabled={
                  generating ||
                  selectedIds.length === 0
                }
                className="group mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#111216] text-[10px] font-semibold text-white shadow-[0_14px_30px_rgba(17,18,22,0.12)] transition-all hover:-translate-y-0.5 hover:bg-[#24252a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <SparkIcon />
                    Generate plans
                    <span className="transition-transform group-hover:translate-x-0.5">
                      <ArrowUpRightIcon />
                    </span>
                  </>
                )}
              </button>

              {planError && (
                <div className="mt-4 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4">
                  <p className="text-[9px] leading-5 text-rose-600">
                    {planError}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Plans */}
          <section className="cargomind-panel rounded-[30px] p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                  Optimization output
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                  Candidate plans
                </h2>

                <p className="mt-2 text-[10px] leading-5 text-slate-400">
                  CargoMind evaluates trade-offs rather than forcing
                  every shipment into one solution.
                </p>
              </div>

              {plans.length > 0 && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/10 px-3 py-2 text-[9px] font-semibold text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {plans.length} plan
                  {plans.length === 1
                    ? ""
                    : "s"} generated
                </div>
              )}
            </div>

            {plans.length === 0 ? (
              <div className="mt-8 flex min-h-[560px] flex-col items-center justify-center rounded-[25px] bg-white/35 px-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/70 text-slate-400 shadow-sm">
                  <SparkIcon />
                </div>

                <h3 className="mt-6 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                  Ready to optimize
                </h3>

                <p className="mt-3 max-w-md text-[10px] leading-6 text-slate-400">
                  Select two or more compatible shipments to create a
                  realistic consolidation scenario. CargoMind will
                  then generate candidate plans balancing cost,
                  operational risk and transit efficiency.
                </p>

                <div className="mt-7 grid w-full max-w-lg gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/50 p-4">
                    <IndianRupeeIcon />

                    <p className="mt-3 text-[10px] font-semibold text-[#111a20]">
                      Cost
                    </p>

                    <p className="mt-1 text-[8px] leading-4 text-slate-400">
                      Minimize transportation expense
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/50 p-4">
                    <ShieldIcon />

                    <p className="mt-3 text-[10px] font-semibold text-[#111a20]">
                      Risk
                    </p>

                    <p className="mt-1 text-[8px] leading-4 text-slate-400">
                      Protect SLA and cargo integrity
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/50 p-4">
                    <ClockIcon />

                    <p className="mt-3 text-[10px] font-semibold text-[#111a20]">
                      Time
                    </p>

                    <p className="mt-1 text-[8px] leading-4 text-slate-400">
                      Balance transit performance
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-7 grid gap-5">
                {plans.map((plan) => {
                  const risk =
                    getRiskPercentage(
                      plan.risk_score,
                    );

                  const riskStyle =
                    getRiskLabel(
                      plan.risk_score,
                    );

                  const selected =
                    selectedPlanId ===
                    plan.id;

                  return (
                    <button
                      type="button"
                      key={plan.id}
                      onClick={() =>
                        setSelectedPlanId(
                          plan.id,
                        )
                      }
                      className={`group w-full rounded-[27px] border p-6 text-left transition-all duration-300 ${
                        selected
                          ? "border-[#111216]/20 bg-white/75 shadow-[0_18px_45px_rgba(17,18,22,0.07)]"
                          : "border-transparent bg-white/40 hover:bg-white/65"
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[12px] font-semibold ${
                              plan.plan_rank === 1
                                ? "bg-[#111216] text-white"
                                : "bg-white text-slate-500"
                            }`}
                          >
                            P{plan.plan_rank}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-[15px] font-semibold tracking-[-0.025em] text-[#111a20]">
                                Plan{" "}
                                {plan.plan_rank}
                              </h3>

                              {plan.plan_rank ===
                                1 && (
                                <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-cyan-700">
                                  Recommended
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-[9px] text-slate-400">
                              {plan.id}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-semibold ${riskStyle.className}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${riskStyle.bar}`}
                          />

                          {riskStyle.label}
                        </span>
                      </div>

                      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl bg-white/55 p-4">
                          <div className="flex items-center gap-2 text-slate-400">
                            <IndianRupeeIcon />

                            <span className="text-[8px] uppercase tracking-[0.1em]">
                              Cost
                            </span>
                          </div>

                          <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[#111a20]">
                            {formatCurrency(
                              plan.total_cost,
                            )}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/55 p-4">
                          <div className="flex items-center gap-2 text-slate-400">
                            <ShieldIcon />

                            <span className="text-[8px] uppercase tracking-[0.1em]">
                              Risk
                            </span>
                          </div>

                          <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[#111a20]">
                            {risk.toFixed(0)}%
                          </p>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                            <div
                              className={`h-full rounded-full ${riskStyle.bar}`}
                              style={{
                                width: `${risk}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white/55 p-4">
                          <div className="flex items-center gap-2 text-slate-400">
                            <ClockIcon />

                            <span className="text-[8px] uppercase tracking-[0.1em]">
                              Transit
                            </span>
                          </div>

                          <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[#111a20]">
                            {plan.transit_time_hrs !=
                            null
                              ? `${plan.transit_time_hrs.toFixed(
                                  1,
                                )}h`
                              : "—"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/55 p-4">
                          <div className="flex items-center gap-2 text-slate-400">
                            <TruckIcon />

                            <span className="text-[8px] uppercase tracking-[0.1em]">
                              Shipments
                            </span>
                          </div>

                          <p className="mt-3 text-lg font-semibold tracking-[-0.04em] text-[#111a20]">
                            {
                              plan
                                .shipment_ids
                                ?.length
                            }
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col justify-between gap-4 border-t border-slate-300/15 pt-5 sm:flex-row sm:items-center">
                        <div className="flex flex-wrap gap-2">
                          {(plan.mode_mix?.length
                            ? plan.mode_mix
                            : ["Optimized route"]
                          ).map((mode) => (
                            <span
                              key={mode}
                              className="rounded-full bg-slate-400/10 px-3 py-1.5 text-[8px] font-semibold capitalize text-slate-500"
                            >
                              {mode}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[9px] text-slate-400">
                            {plan.departure_time
                              ? `Departure ${formatDate(
                                  plan.departure_time,
                                )}`
                              : "Departure window available"}
                          </span>

                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 text-slate-500 transition-transform group-hover:translate-x-0.5">
                            <ArrowUpRightIcon />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        {/* Selected plan intelligence */}
        {selectedPlanId && (
          <section className="relative mt-5 overflow-hidden rounded-[30px] bg-[#111216] p-7 text-white shadow-[0_25px_70px_rgba(17,18,22,0.12)]">
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

            {(() => {
              const selectedPlan =
                plans.find(
                  (plan) =>
                    plan.id ===
                    selectedPlanId,
                );

              if (!selectedPlan) {
                return null;
              }

              const risk =
                getRiskPercentage(
                  selectedPlan.risk_score,
                );

              return (
                <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-300">
                      <SparkIcon />

                      <span className="text-[9px] font-semibold uppercase tracking-[0.16em]">
                        Decision intelligence
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
                      Plan {selectedPlan.plan_rank} is ready for
                      deeper analysis
                    </h2>

                    <p className="mt-3 max-w-2xl text-[10px] leading-6 text-white/45">
                      This candidate can now be inspected through
                      CargoMind's explainability layer to understand
                      why shipments were grouped, which constraints
                      influenced the route and what factors drive
                      the predicted risk.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      <Link
                        href={`/ai-intelligence?plan=${encodeURIComponent(
                          selectedPlan.id,
                        )}`}
                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-5 text-[10px] font-semibold text-[#111216] transition-colors hover:bg-cyan-100"
                      >
                        <SparkIcon />
                        Open AI Intelligence
                        <ArrowUpRightIcon />
                      </Link>

                      <Link
                        href={`/consolidation/${encodeURIComponent(
                          selectedPlan.id,
                        )}`}
                        className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white/10 px-5 text-[10px] font-semibold text-white/80 transition-colors hover:bg-white/15"
                      >
                        View plan details
                        <ArrowUpRightIcon />
                      </Link>
                    </div>
                  </div>

                  <div className="min-w-[220px] rounded-[25px] bg-white/5 p-6">
                    <p className="text-[9px] uppercase tracking-[0.12em] text-white/30">
                      Selected plan risk
                    </p>

                    <p className="mt-3 text-4xl font-semibold tracking-[-0.05em]">
                      {risk.toFixed(0)}%
                    </p>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-cyan-300"
                        style={{
                          width: `${risk}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-[9px] leading-4 text-white/35">
                      Risk score will be explained using the
                      backend's prediction and XAI data.
                    </p>
                  </div>
                </div>
              );
            })()}
          </section>
        )}
      </div>
    </main>
  );
}