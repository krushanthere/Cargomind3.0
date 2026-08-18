"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getShipment } from "@/lib/api/shipments";
import type {
  Shipment,
  ShipmentStatus,
  ShipmentTempClass,
} from "@/types";

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

function MapPinIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 10.5C20 15.5 12 21 12 21C12 21 4 15.5 4 10.5C4 6.36 7.58 3 12 3C16.42 3 20 6.36 20 10.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10.5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
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

function ThermometerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 14.76V5C14 3.895 13.105 3 12 3C10.895 3 10 3.895 10 5V14.76C8.775 15.469 8 16.78 8 18.25C8 20.459 9.791 22.25 12 22.25C14.209 22.25 16 20.459 16 18.25C16 16.78 15.225 15.469 14 14.76Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 8V18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
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

function getStatusStyle(status: ShipmentStatus) {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        className: "bg-amber-400/10 text-amber-700",
        dot: "bg-amber-400",
      };

    case "consolidated":
      return {
        label: "Consolidated",
        className: "bg-violet-400/10 text-violet-700",
        dot: "bg-violet-400",
      };

    case "in_transit":
      return {
        label: "In Transit",
        className: "bg-sky-400/10 text-sky-700",
        dot: "bg-sky-400",
      };

    case "delivered":
      return {
        label: "Delivered",
        className: "bg-emerald-400/10 text-emerald-700",
        dot: "bg-emerald-400",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-rose-400/10 text-rose-700",
        dot: "bg-rose-400",
      };

    default:
      return {
        label: status,
        className: "bg-slate-400/10 text-slate-600",
        dot: "bg-slate-400",
      };
  }
}

function getTemperatureStyle(temp: ShipmentTempClass) {
  switch (temp) {
    case "frozen":
      return {
        label: "Frozen",
        className: "bg-blue-400/10 text-blue-700",
      };

    case "chilled":
      return {
        label: "Chilled",
        className: "bg-cyan-400/10 text-cyan-700",
      };

    case "ambient":
      return {
        label: "Ambient",
        className: "bg-orange-400/10 text-orange-700",
      };

    default:
      return {
        label: temp,
        className: "bg-slate-400/10 text-slate-600",
      };
  }
}

function formatDate(value: string) {
  if (!value) return "—";

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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getLifecycleState(status: ShipmentStatus) {
  const steps = [
    {
      key: "pending",
      label: "Shipment created",
      description: "Shipment request received",
    },
    {
      key: "consolidated",
      label: "Consolidation",
      description: "Compatible cargo grouped",
    },
    {
      key: "in_transit",
      label: "In transit",
      description: "Cargo is moving",
    },
    {
      key: "delivered",
      label: "Delivered",
      description: "Shipment completed",
    },
  ];

  const order: ShipmentStatus[] = [
    "pending",
    "consolidated",
    "in_transit",
    "delivered",
  ];

  const currentIndex = order.indexOf(status);

  return steps.map((step, index) => ({
    ...step,
    completed:
      currentIndex >= index &&
      status !== "cancelled",
    active:
      currentIndex === index &&
      status !== "cancelled",
  }));
}

export default function ShipmentDetailPage() {
  const params = useParams<{ id: string }>();

  const shipmentId = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id;

  const [shipment, setShipment] =
    useState<Shipment | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function loadShipment(
    isRefresh = false,
  ) {
    if (!shipmentId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response =
        await getShipment(shipmentId);

      setShipment(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load shipment.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadShipment();
  }, [shipmentId]);

  if (loading) {
    return (
      <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
        <div className="mx-auto max-w-[1500px]">
          <div className="h-5 w-32 animate-pulse rounded bg-white/50" />

          <div className="mt-8 h-12 w-80 animate-pulse rounded bg-white/50" />

          <div className="mt-3 h-5 w-[520px] max-w-full animate-pulse rounded bg-white/40" />

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="cargomind-panel h-[560px] animate-pulse rounded-[30px]" />

            <div className="space-y-5">
              <div className="cargomind-panel h-[300px] animate-pulse rounded-[30px]" />
              <div className="cargomind-panel h-[220px] animate-pulse rounded-[30px]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !shipment) {
    return (
      <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
        <div className="mx-auto max-w-[900px]">
          <Link
            href="/shipments"
            className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-[#111216]"
          >
            <ArrowLeftIcon />
            Back to shipments
          </Link>

          <section className="mt-8 rounded-[30px] border border-rose-200/70 bg-rose-50/70 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <PackageIcon />
            </div>

            <h1 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-rose-800">
              Shipment unavailable
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-[11px] leading-5 text-rose-700/70">
              {error ||
                "The requested shipment could not be found."}
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => loadShipment()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-[10px] font-semibold text-white hover:bg-rose-700"
              >
                <RefreshIcon />
                Try again
              </button>

              <Link
                href="/shipments"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/70 px-4 text-[10px] font-semibold text-rose-700 hover:bg-white"
              >
                Shipment registry
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const status = getStatusStyle(
    shipment.status,
  );

  const temperature =
    getTemperatureStyle(
      shipment.temp_class,
    );

  const lifecycle =
    getLifecycleState(shipment.status);

  return (
    <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Top navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/shipments"
            className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-[#111216]"
          >
            <ArrowLeftIcon />
            Back to shipments
          </Link>

          <button
            type="button"
            onClick={() => loadShipment(true)}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/70 bg-white/45 px-4 text-[10px] font-medium text-slate-500 backdrop-blur-md transition-colors hover:bg-white/70 disabled:opacity-50"
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
                <PackageIcon />
                Shipment details
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#111a20] sm:text-5xl">
                  {shipment.id}
                </h1>

                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[9px] font-semibold ${status.className}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                  />

                  {status.label}
                </span>
              </div>

              <p className="mt-3 text-[12px] text-slate-400">
                Tenant:{" "}
                <span className="font-medium text-slate-500">
                  {shipment.tenant_id || "—"}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/consolidation"
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/45 px-5 text-[10px] font-semibold text-slate-600 backdrop-blur-md transition-all hover:bg-white/70"
              >
                Open consolidation
                <span className="transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRightIcon />
                </span>
              </Link>

              <Link
                href={`/ai-intelligence?shipment=${encodeURIComponent(
                  shipment.id,
                )}`}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-5 text-[10px] font-semibold text-white shadow-[0_14px_30px_rgba(17,18,22,0.14)] transition-all hover:-translate-y-0.5 hover:bg-[#24252a]"
              >
                <SparkIcon />
                AI Intelligence
                <span className="transition-transform group-hover:translate-x-0.5">
                  <ArrowUpRightIcon />
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* KPI cards */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Cargo weight
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-400/10 text-slate-600">
                <PackageIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {shipment.weight_kg.toLocaleString(
                "en-IN",
              )}{" "}
              kg
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              {shipment.volume_cbm} m³ total volume
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Temperature
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-600">
                <ThermometerIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {temperature.label}
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Compatibility constraint
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                SLA deadline
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-600">
                <ClockIcon />
              </div>
            </div>

            <p className="mt-4 text-lg font-semibold tracking-[-0.04em] text-[#111a20]">
              {formatDate(
                shipment.sla_deadline,
              )}
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Latest acceptable delivery
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Maximum cost
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-600">
                <IndianRupeeIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {formatCurrency(
                shipment.max_cost,
              )}
            </p>

            <p className="mt-1 text-[9px] text-slate-400">
              Shipment budget constraint
            </p>
          </div>
        </section>

        {/* Main content */}
        <section className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          {/* Left */}
          <div className="space-y-5">
            {/* Route */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10 text-violet-600">
                  <MapPinIcon />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Route
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                    Shipment corridor
                  </h2>
                </div>
              </div>

              <div className="mt-7 rounded-[25px] bg-white/45 p-6">
                <div className="flex items-center gap-4 overflow-x-auto pb-2">
                  <div className="min-w-[130px]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111216] text-white">
                        <MapPinIcon />
                      </div>

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Origin
                        </p>

                        <p className="mt-1 text-[12px] font-semibold text-[#111a20]">
                          {shipment.origin_hub_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-[80px] flex-1 items-center">
                    <div className="h-px flex-1 bg-slate-300/70" />

                    <TruckIcon />

                    <div className="h-px flex-1 bg-slate-300/70" />
                  </div>

                  <div className="min-w-[150px]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                        <MapPinIcon />
                      </div>

                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Destination
                        </p>

                        <p className="mt-1 text-[12px] font-semibold text-[#111a20]">
                          {shipment.dest_hub_id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/50 p-4">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">
                      Route status
                    </p>

                    <p className="mt-2 text-[11px] font-semibold text-[#111a20]">
                      {status.label}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/50 p-4">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">
                      Cargo class
                    </p>

                    <p className="mt-2 text-[11px] font-semibold text-[#111a20]">
                      {temperature.label}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/50 p-4">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">
                      Volume
                    </p>

                    <p className="mt-2 text-[11px] font-semibold text-[#111a20]">
                      {shipment.volume_cbm} m³
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Lifecycle */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-400/10 text-sky-600">
                  <TruckIcon />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Shipment lifecycle
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                    Movement progress
                  </h2>
                </div>
              </div>

              {shipment.status ===
              "cancelled" ? (
                <div className="mt-7 rounded-2xl border border-rose-200/70 bg-rose-50/60 p-5">
                  <p className="text-[11px] font-semibold text-rose-700">
                    Shipment cancelled
                  </p>

                  <p className="mt-1 text-[9px] leading-5 text-rose-600/70">
                    This shipment is no longer available for
                    consolidation or dispatch.
                  </p>
                </div>
              ) : (
                <div className="mt-8">
                  <div className="flex items-start">
                    {lifecycle.map(
                      (step, index) => (
                        <div
                          key={step.key}
                          className="flex flex-1 items-start"
                        >
                          <div className="flex min-w-0 flex-col items-center">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-semibold ${
                                step.completed
                                  ? "bg-[#111216] text-white"
                                  : "bg-white/70 text-slate-400"
                              }`}
                            >
                              {step.completed
                                ? "✓"
                                : index + 1}
                            </div>

                            <p
                              className={`mt-3 text-center text-[9px] font-semibold ${
                                step.active
                                  ? "text-[#111a20]"
                                  : "text-slate-400"
                              }`}
                            >
                              {step.label}
                            </p>

                            <p className="mt-1 hidden text-center text-[8px] leading-4 text-slate-400 sm:block">
                              {
                                step.description
                              }
                            </p>
                          </div>

                          {index <
                            lifecycle.length -
                              1 && (
                            <div
                              className={`mt-4 h-px flex-1 ${
                                lifecycle[index + 1]
                                  .completed
                                  ? "bg-[#111216]"
                                  : "bg-slate-300/60"
                              }`}
                            />
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Data used by AI */}
            <section className="relative overflow-hidden rounded-[30px] bg-[#111216] p-7 text-white shadow-[0_25px_70px_rgba(17,18,22,0.12)]">
              <div className="absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-2 text-cyan-300">
                  <SparkIcon />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                    AI intelligence
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-semibold tracking-[-0.035em]">
                  Understand this shipment
                </h2>

                <p className="mt-3 max-w-2xl text-[11px] leading-6 text-white/45">
                  CargoMind can use this shipment's route, cargo
                  characteristics, SLA and commercial constraints
                  when evaluating consolidation and risk.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-white/30">
                      Temperature
                    </p>

                    <p className="mt-2 text-[11px] font-semibold text-white/80">
                      {temperature.label}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-white/30">
                      SLA
                    </p>

                    <p className="mt-2 text-[11px] font-semibold text-white/80">
                      Constraint active
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-white/30">
                      Budget
                    </p>

                    <p className="mt-2 text-[11px] font-semibold text-white/80">
                      {formatCurrency(
                        shipment.max_cost,
                      )}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/ai-intelligence?shipment=${encodeURIComponent(
                    shipment.id,
                  )}`}
                  className="mt-7 inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-5 text-[10px] font-semibold text-[#111216] transition-colors hover:bg-cyan-100"
                >
                  Open AI Intelligence
                  <ArrowUpRightIcon />
                </Link>
              </div>
            </section>
          </div>

          {/* Right */}
          <aside className="space-y-5">
            {/* Shipment information */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Shipment information
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-300/20 pb-4">
                  <span className="text-[10px] text-slate-400">
                    Shipment ID
                  </span>

                  <span className="text-right text-[11px] font-semibold text-[#111a20]">
                    {shipment.id}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-300/20 pb-4">
                  <span className="text-[10px] text-slate-400">
                    Origin
                  </span>

                  <span className="text-right text-[11px] font-semibold text-[#111a20]">
                    {shipment.origin_hub_id}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-300/20 pb-4">
                  <span className="text-[10px] text-slate-400">
                    Destination
                  </span>

                  <span className="text-right text-[11px] font-semibold text-[#111a20]">
                    {shipment.dest_hub_id}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-300/20 pb-4">
                  <span className="text-[10px] text-slate-400">
                    Weight
                  </span>

                  <span className="text-right text-[11px] font-semibold text-[#111a20]">
                    {shipment.weight_kg.toLocaleString(
                      "en-IN",
                    )}{" "}
                    kg
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-300/20 pb-4">
                  <span className="text-[10px] text-slate-400">
                    Volume
                  </span>

                  <span className="text-right text-[11px] font-semibold text-[#111a20]">
                    {shipment.volume_cbm} m³
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-300/20 pb-4">
                  <span className="text-[10px] text-slate-400">
                    Temperature
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${temperature.className}`}
                  >
                    {temperature.label}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 border-b border-slate-300/20 pb-4">
                  <span className="text-[10px] text-slate-400">
                    SLA deadline
                  </span>

                  <span className="max-w-[190px] text-right text-[10px] font-semibold text-[#111a20]">
                    {formatDate(
                      shipment.sla_deadline,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] text-slate-400">
                    Maximum cost
                  </span>

                  <span className="text-right text-[11px] font-semibold text-[#111a20]">
                    {formatCurrency(
                      shipment.max_cost,
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* Next action */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-600">
                  <ShieldIcon />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                    Recommended next step
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-[#111a20]">
                    Evaluate consolidation
                  </p>
                </div>
              </div>

              <p className="mt-5 text-[10px] leading-5 text-slate-400">
                Compare this shipment with compatible pending
                shipments to identify lower-cost or lower-risk
                movement options.
              </p>

              <Link
                href="/consolidation"
                className="mt-6 flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#111216] text-[10px] font-semibold text-white transition-colors hover:bg-[#24252a]"
              >
                View consolidation plans
                <ArrowUpRightIcon />
              </Link>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}