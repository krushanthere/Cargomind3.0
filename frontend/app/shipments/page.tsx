"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getShipments } from "@/lib/api/shipments";
import type {
  Shipment,
  ShipmentStatus,
  ShipmentTempClass,
} from "@/types";

type FilterStatus = "all" | ShipmentStatus;
type FilterTemperature = "all" | ShipmentTempClass;

function PackageIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
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

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="10.8"
        cy="10.8"
        r="6.8"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16 16L21 21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 5V19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
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

function FilterIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 7H20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M7 12H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 17H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
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

function ClockIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
    >
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

function ThermometerIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
    >
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

function RefreshIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
    >
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
        className:
          "bg-amber-400/10 text-amber-700",
        dot: "bg-amber-400",
      };

    case "consolidated":
      return {
        label: "Consolidated",
        className:
          "bg-violet-400/10 text-violet-700",
        dot: "bg-violet-400",
      };

    case "in_transit":
      return {
        label: "In Transit",
        className:
          "bg-sky-400/10 text-sky-700",
        dot: "bg-sky-400",
      };

    case "delivered":
      return {
        label: "Delivered",
        className:
          "bg-emerald-400/10 text-emerald-700",
        dot: "bg-emerald-400",
      };

    case "cancelled":
      return {
        label: "Cancelled",
        className:
          "bg-rose-400/10 text-rose-700",
        dot: "bg-rose-400",
      };

    default:
      return {
        label: status,
        className:
          "bg-slate-400/10 text-slate-600",
        dot: "bg-slate-400",
      };
  }
}

function getTemperatureStyle(
  temp: ShipmentTempClass,
) {
  switch (temp) {
    case "frozen":
      return {
        label: "Frozen",
        className:
          "bg-blue-400/10 text-blue-700",
      };

    case "chilled":
      return {
        label: "Chilled",
        className:
          "bg-cyan-400/10 text-cyan-700",
      };

    case "ambient":
      return {
        label: "Ambient",
        className:
          "bg-orange-400/10 text-orange-700",
      };

    default:
      return {
        label: temp,
        className:
          "bg-slate-400/10 text-slate-600",
      };
  }
}

function formatDate(
  value: string,
) {
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

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/*
 * The backend may return either:
 *
 * [
 *   shipment,
 *   shipment
 * ]
 *
 * or an object containing the list.
 *
 * This normalizer keeps the UI tolerant
 * of both common response shapes.
 */
function normalizeShipments(
  response: unknown,
): Shipment[] {
  if (Array.isArray(response)) {
    return response as Shipment[];
  }

  if (
    response &&
    typeof response === "object"
  ) {
    const objectResponse =
      response as Record<string, unknown>;

    const possibleKeys = [
      "shipments",
      "data",
      "items",
      "results",
    ];

    for (const key of possibleKeys) {
      const value = objectResponse[key];

      if (Array.isArray(value)) {
        return value as Shipment[];
      }
    }
  }

  return [];
}

export default function ShipmentsPage() {
  const [shipments, setShipments] =
    useState<Shipment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("all");

  const [temperatureFilter, setTemperatureFilter] =
    useState<FilterTemperature>("all");

  const [showFilters, setShowFilters] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  async function loadShipments(
    isRefresh = false,
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const response = await getShipments();

      const normalized =
        normalizeShipments(response);

      setShipments(normalized);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load shipments.";

      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadShipments();
  }, []);

  const filteredShipments = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const matchesSearch =
        !query ||
        shipment.id
          ?.toLowerCase()
          .includes(query) ||
        shipment.origin_hub_id
          ?.toLowerCase()
          .includes(query) ||
        shipment.dest_hub_id
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        shipment.status === statusFilter;

      const matchesTemperature =
        temperatureFilter === "all" ||
        shipment.temp_class ===
          temperatureFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTemperature
      );
    });
  }, [
    shipments,
    search,
    statusFilter,
    temperatureFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: shipments.length,

      pending: shipments.filter(
        (shipment) =>
          shipment.status === "pending",
      ).length,

      inTransit: shipments.filter(
        (shipment) =>
          shipment.status === "in_transit",
      ).length,

      delivered: shipments.filter(
        (shipment) =>
          shipment.status === "delivered",
      ).length,
    };
  }, [shipments]);

  return (
    <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
      <div className="mx-auto max-w-[1800px]">
        {/* Header */}
        <section className="animate-fade-up flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
              <PackageIcon />
              Shipment Management
            </div>

            <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#111a20] sm:text-5xl">
              Shipments
            </h1>

            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-500">
              Manage your cold-chain shipment requests,
              monitor their status and prepare compatible
              cargo for intelligent consolidation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadShipments(true)}
              disabled={refreshing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/45 px-5 text-[11px] font-medium text-slate-600 backdrop-blur-md transition-all hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-5 text-[11px] font-medium text-white shadow-[0_14px_30px_rgba(17,18,22,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#24252a]"
            >
              <PlusIcon />
              New Shipment

              <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowUpRightIcon />
              </span>
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="cargomind-panel rounded-[25px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Total shipments
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-400/10 text-slate-600">
                <PackageIcon />
              </div>
            </div>

            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#111a20]">
              {loading ? "—" : stats.total}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              All shipment requests
            </p>
          </div>

          <div className="cargomind-panel rounded-[25px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Pending
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-600">
                <ClockIcon />
              </div>
            </div>

            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#111a20]">
              {loading ? "—" : stats.pending}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Ready for consolidation
            </p>
          </div>

          <div className="cargomind-panel rounded-[25px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                In transit
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-600">
                <TruckIcon />
              </div>
            </div>

            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#111a20]">
              {loading ? "—" : stats.inTransit}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Currently moving
            </p>
          </div>

          <div className="cargomind-panel rounded-[25px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Delivered
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-600">
                <PackageIcon />
              </div>
            </div>

            <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[#111a20]">
              {loading ? "—" : stats.delivered}
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Successfully completed
            </p>
          </div>
        </section>

        {/* Search and filters */}
        <section className="cargomind-panel mt-5 rounded-[26px] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search shipment ID or hub..."
                className="h-12 w-full rounded-2xl border border-white/60 bg-white/45 pl-11 pr-4 text-[12px] text-[#111a20] outline-none transition-all placeholder:text-slate-400 focus:border-slate-300 focus:bg-white/70"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(!showFilters)
              }
              className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-5 text-[11px] font-medium transition-colors ${
                showFilters
                  ? "bg-[#111216] text-white"
                  : "bg-white/45 text-slate-600 hover:bg-white/70"
              }`}
            >
              <FilterIcon />
              Filters
            </button>

            <div className="hidden items-center gap-2 text-[10px] text-slate-400 xl:flex">
              <span>
                Showing
              </span>

              <span className="font-semibold text-slate-600">
                {filteredShipments.length}
              </span>

              <span>
                of
              </span>

              <span className="font-semibold text-slate-600">
                {shipments.length}
              </span>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 grid gap-3 border-t border-slate-300/20 pt-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as FilterStatus,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-white/60 bg-white/55 px-3 text-[11px] text-slate-600 outline-none"
                >
                  <option value="all">
                    All statuses
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="consolidated">
                    Consolidated
                  </option>

                  <option value="in_transit">
                    In Transit
                  </option>

                  <option value="delivered">
                    Delivered
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Temperature
                </label>

                <select
                  value={temperatureFilter}
                  onChange={(event) =>
                    setTemperatureFilter(
                      event.target
                        .value as FilterTemperature,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-white/60 bg-white/55 px-3 text-[11px] text-slate-600 outline-none"
                >
                  <option value="all">
                    All temperature classes
                  </option>

                  <option value="frozen">
                    Frozen
                  </option>

                  <option value="chilled">
                    Chilled
                  </option>

                  <option value="ambient">
                    Ambient
                  </option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Error */}
        {error && (
          <section className="mt-5 rounded-[25px] border border-rose-200/70 bg-rose-50/70 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[12px] font-semibold text-rose-700">
                  Unable to load shipments
                </p>

                <p className="mt-1 text-[10px] leading-5 text-rose-600/70">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadShipments()}
                className="h-10 rounded-xl bg-rose-600 px-4 text-[10px] font-semibold text-white transition-colors hover:bg-rose-700"
              >
                Try again
              </button>
            </div>
          </section>
        )}

        {/* Shipment table */}
        <section className="cargomind-panel mt-5 overflow-hidden rounded-[30px]">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-300/20 px-6 py-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Shipment registry
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                All shipments
              </h2>
            </div>

            <Link
              href="/consolidation"
              className="group inline-flex items-center gap-2 self-start rounded-xl bg-white/55 px-4 py-2.5 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-white/80"
            >
              Open consolidation
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowUpRightIcon />
              </span>
            </Link>
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3 p-6">
              {[1, 2, 3, 4, 5].map(
                (item) => (
                  <div
                    key={item}
                    className="h-[88px] animate-pulse rounded-2xl bg-white/40"
                  />
                ),
              )}
            </div>
          )}

          {/* Empty */}
          {!loading &&
            !error &&
            filteredShipments.length === 0 && (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/60 text-slate-400">
                  <PackageIcon />
                </div>

                <h3 className="mt-5 text-lg font-semibold tracking-[-0.03em] text-[#111a20]">
                  No shipments found
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-slate-400">
                  {search ||
                  statusFilter !== "all" ||
                  temperatureFilter !== "all"
                    ? "Try changing your search or filters."
                    : "Create your first shipment to start using the consolidation engine."}
                </p>

                {!search &&
                  statusFilter === "all" &&
                  temperatureFilter ===
                    "all" && (
                    <Link
                      href="/shipments/create"
                      className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#111216] px-4 text-[10px] font-semibold text-white"
                    >
                      <PlusIcon />
                      Create shipment
                    </Link>
                  )}
              </div>
            )}

          {/* Desktop table */}
          {!loading &&
            filteredShipments.length > 0 && (
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="border-b border-slate-300/20">
                      <th className="px-6 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                        Shipment
                      </th>

                      <th className="px-4 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                        Route
                      </th>

                      <th className="px-4 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                        Cargo
                      </th>

                      <th className="px-4 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                        SLA
                      </th>

                      <th className="px-4 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                        Budget
                      </th>

                      <th className="px-4 py-4 text-left text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-[9px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                        View
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredShipments.map(
                      (shipment) => {
                        const status =
                          getStatusStyle(
                            shipment.status,
                          );

                        const temperature =
                          getTemperatureStyle(
                            shipment.temp_class,
                          );

                        return (
                          <tr
                            key={shipment.id}
                            className="group border-b border-slate-300/15 transition-colors last:border-0 hover:bg-white/30"
                          >
                            <td className="px-6 py-5">
                              <Link
                                href={`/shipments/${shipment.id}`}
                                className="block"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/65 text-slate-500">
                                    <PackageIcon />
                                  </div>

                                  <div>
                                    <p className="text-[12px] font-semibold text-[#111a20]">
                                      {shipment.id}
                                    </p>

                                    <p className="mt-1 text-[9px] text-slate-400">
                                      Tenant:{" "}
                                      {shipment.tenant_id ||
                                        "—"}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </td>

                            <td className="px-4 py-5">
                              <div>
                                <p className="text-[11px] font-medium text-[#111a20]">
                                  {
                                    shipment.origin_hub_id
                                  }
                                  <span className="mx-2 text-slate-300">
                                    →
                                  </span>
                                  {
                                    shipment.dest_hub_id
                                  }
                                </p>

                                <p className="mt-1 text-[9px] text-slate-400">
                                  Hub-to-hub route
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${temperature.className}`}
                                  >
                                    {
                                      temperature.label
                                    }
                                  </span>
                                </div>

                                <p className="mt-2 text-[10px] text-slate-500">
                                  {shipment.weight_kg.toLocaleString(
                                    "en-IN",
                                  )}{" "}
                                  kg
                                  <span className="mx-1.5 text-slate-300">
                                    ·
                                  </span>
                                  {
                                    shipment.volume_cbm
                                  }{" "}
                                  m³
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-5">
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 text-slate-400">
                                  <ClockIcon />
                                </div>

                                <div>
                                  <p className="text-[10px] font-medium text-[#111a20]">
                                    {formatDate(
                                      shipment.sla_deadline,
                                    )}
                                  </p>

                                  <p className="mt-1 text-[9px] text-slate-400">
                                    Delivery deadline
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-5">
                              <p className="text-[11px] font-semibold text-[#111a20]">
                                {formatCurrency(
                                  shipment.max_cost,
                                )}
                              </p>

                              <p className="mt-1 text-[9px] text-slate-400">
                                Maximum cost
                              </p>
                            </td>

                            <td className="px-4 py-5">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-semibold ${status.className}`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                                />

                                {status.label}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-right">
                              <Link
                                href={`/shipments/${shipment.id}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/50 text-slate-500 opacity-70 transition-all group-hover:bg-white group-hover:opacity-100"
                              >
                                <ArrowUpRightIcon />
                              </Link>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}

          {/* Mobile / tablet cards */}
          {!loading &&
            filteredShipments.length > 0 && (
              <div className="divide-y divide-slate-300/15 lg:hidden">
                {filteredShipments.map(
                  (shipment) => {
                    const status =
                      getStatusStyle(
                        shipment.status,
                      );

                    const temperature =
                      getTemperatureStyle(
                        shipment.temp_class,
                      );

                    return (
                      <Link
                        key={shipment.id}
                        href={`/shipments/${shipment.id}`}
                        className="block p-5 transition-colors hover:bg-white/30"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/65 text-slate-500">
                              <PackageIcon />
                            </div>

                            <div>
                              <p className="text-[12px] font-semibold text-[#111a20]">
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
                          </div>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[9px] font-semibold ${status.className}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                            />

                            {status.label}
                          </span>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl bg-white/40 p-4">
                            <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">
                              Cargo
                            </p>

                            <p className="mt-2 text-[11px] font-semibold text-[#111a20]">
                              {shipment.weight_kg.toLocaleString(
                                "en-IN",
                              )}{" "}
                              kg
                            </p>

                            <span
                              className={`mt-2 inline-flex rounded-full px-2 py-1 text-[8px] font-semibold ${temperature.className}`}
                            >
                              {
                                temperature.label
                              }
                            </span>
                          </div>

                          <div className="rounded-2xl bg-white/40 p-4">
                            <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">
                              Max cost
                            </p>

                            <p className="mt-2 text-[11px] font-semibold text-[#111a20]">
                              {formatCurrency(
                                shipment.max_cost,
                              )}
                            </p>

                            <p className="mt-1 text-[9px] text-slate-400">
                              Budget
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 rounded-2xl bg-white/40 p-4">
                          <p className="text-[9px] uppercase tracking-[0.1em] text-slate-400">
                            SLA deadline
                          </p>

                          <p className="mt-2 text-[11px] font-semibold text-[#111a20]">
                            {formatDate(
                              shipment.sla_deadline,
                            )}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400">
                            Open shipment details
                          </span>

                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 text-slate-500">
                            <ArrowUpRightIcon />
                          </span>
                        </div>
                      </Link>
                    );
                  },
                )}
              </div>
            )}
        </section>
      </div>
    </main>
  );
}