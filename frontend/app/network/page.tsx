"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HubType = "origin" | "destination" | "transfer" | string;
type RouteMode = "road" | "rail" | string;

interface Hub {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: HubType;
  cold_storage_capacity_kg?: number;
  is_active?: boolean;
}

interface Route {
  id: string;
  origin_hub_id: string;
  dest_hub_id: string;
  mode: RouteMode;
  avg_transit_hrs: number;
  base_cost_per_kg: number;
  reliability_score: number;

  // Some backend responses may already contain risk.
  risk_score?: number;
  risk?: number;
  delay_risk?: number;
  spoilage_risk?: number;
}

interface NetworkResponse {
  hubs?: Hub[];
  routes?: Route[];
  nodes?: Hub[];
  edges?: Route[];
  data?: {
    hubs?: Hub[];
    routes?: Route[];
    nodes?: Hub[];
    edges?: Route[];
  };
}

type RiskFilter = "all" | "low" | "medium" | "high";
type ModeFilter = "all" | "road" | "rail";

interface Point {
  x: number;
  y: number;
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

function MapPinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 10.5C20 15.5 12 21 12 21C12 21 4 15.5 4 10.5C4 6.36 7.58 3 12 3C16.42 3 20 6.36 20 10.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle
        cx="5"
        cy="18"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="19"
        cy="6"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7.5 18H10C13.5 18 14 15.5 14 12.5V11.5C14 8.5 15 6 16.5 6H16.5"
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

function TrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <rect
        x="5"
        y="3"
        width="14"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 20L10 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 20L14 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 8H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L20 7L12 11L4 7L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 12L12 16L20 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 17L12 21L20 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatNumber(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeRisk(value?: number) {
  if (value == null || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, value <= 1 ? value * 100 : value),
  );
}

function routeRisk(route: Route) {
  if (route.risk_score != null) {
    return normalizeRisk(route.risk_score);
  }

  if (route.risk != null) {
    return normalizeRisk(route.risk);
  }

  if (route.delay_risk != null) {
    return normalizeRisk(route.delay_risk);
  }

  /*
   * If the network endpoint doesn't return a direct route risk,
   * use reliability as a visual proxy.
   *
   * This is deliberately labelled as estimated below.
   */
  if (route.reliability_score != null) {
    return Math.max(
      0,
      Math.min(
        100,
        100 - normalizeRisk(route.reliability_score),
      ),
    );
  }

  return 0;
}

function riskLevel(score: number) {
  if (score < 35) {
    return {
      label: "Low",
      text: "text-emerald-700",
      bg: "bg-emerald-400/10",
      stroke: "#10b981",
    };
  }

  if (score <= 65) {
    return {
      label: "Moderate",
      text: "text-amber-700",
      bg: "bg-amber-400/10",
      stroke: "#f59e0b",
    };
  }

  return {
    label: "High",
    text: "text-rose-700",
    bg: "bg-rose-400/10",
    stroke: "#f43f5e",
  };
}

function normalizeNetwork(
  response: unknown,
): {
  hubs: Hub[];
  routes: Route[];
} {
  if (!response || typeof response !== "object") {
    return {
      hubs: [],
      routes: [],
    };
  }

  const object =
    response as NetworkResponse;

  const source =
    object.data &&
    typeof object.data === "object"
      ? object.data
      : object;

  const hubs =
    source.hubs ??
    source.nodes ??
    [];

  const routes =
    source.routes ??
    source.edges ??
    [];

  return {
    hubs: Array.isArray(hubs)
      ? hubs
      : [],
    routes: Array.isArray(routes)
      ? routes
      : [],
  };
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

export default function NetworkPage() {
  const [hubs, setHubs] =
    useState<Hub[]>([]);

  const [routes, setRoutes] =
    useState<Route[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [modeFilter, setModeFilter] =
    useState<ModeFilter>("all");

  const [riskFilter, setRiskFilter] =
    useState<RiskFilter>("all");

  const [selectedRouteId, setSelectedRouteId] =
    useState<string | null>(null);

  const [selectedHubId, setSelectedHubId] =
    useState<string | null>(null);

  const [showRoutes, setShowRoutes] =
    useState(true);

  async function loadNetwork(
    isRefresh = false,
  ) {
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
        `${baseUrl}/network/graph`,
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
          "Unable to load the logistics network.";

        try {
          const body =
            await response.json();

          if (
            typeof body?.detail ===
            "string"
          ) {
            message =
              body.detail;
          } else if (
            typeof body?.message ===
            "string"
          ) {
            message =
              body.message;
          }
        } catch {
          // Keep default.
        }

        throw new Error(message);
      }

      const data =
        await response.json();

      const normalized =
        normalizeNetwork(data);

      setHubs(normalized.hubs);
      setRoutes(normalized.routes);

      if (
        normalized.routes.length > 0
      ) {
        setSelectedRouteId(
          normalized.routes[0].id,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load the logistics network.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadNetwork();
  }, []);

  const filteredRoutes =
    useMemo(() => {
      return routes.filter((route) => {
        if (
          modeFilter !== "all" &&
          route.mode !== modeFilter
        ) {
          return false;
        }

        const risk =
          routeRisk(route);

        if (
          riskFilter === "low" &&
          risk >= 35
        ) {
          return false;
        }

        if (
          riskFilter === "medium" &&
          (risk < 35 || risk > 65)
        ) {
          return false;
        }

        if (
          riskFilter === "high" &&
          risk <= 65
        ) {
          return false;
        }

        return true;
      });
    }, [
      routes,
      modeFilter,
      riskFilter,
    ]);

  const selectedRoute =
    useMemo(() => {
      if (selectedRouteId) {
        return (
          routes.find(
            (route) =>
              route.id ===
              selectedRouteId,
          ) ?? null
        );
      }

      return routes[0] ?? null;
    }, [
      routes,
      selectedRouteId,
    ]);

  const selectedHub =
    useMemo(() => {
      if (!selectedHubId) {
        return null;
      }

      return (
        hubs.find(
          (hub) =>
            hub.id ===
            selectedHubId,
        ) ?? null
      );
    }, [hubs, selectedHubId]);

  const activeHubs = useMemo(
    () =>
      hubs.filter(
        (hub) =>
          hub.is_active !== false,
      ),
    [hubs],
  );

  const roadRoutes =
    useMemo(
      () =>
        routes.filter(
          (route) =>
            route.mode ===
            "road",
        ),
      [routes],
    );

  const railRoutes =
    useMemo(
      () =>
        routes.filter(
          (route) =>
            route.mode ===
            "rail",
        ),
      [routes],
    );

  const averageReliability =
    useMemo(() => {
      if (!routes.length) {
        return 0;
      }

      return (
        routes.reduce(
          (sum, route) =>
            sum +
            normalizeRisk(
              route.reliability_score,
            ),
          0,
        ) / routes.length
      );
    }, [routes]);

  const averageRisk =
    useMemo(() => {
      if (!routes.length) {
        return 0;
      }

      return (
        routes.reduce(
          (sum, route) =>
            sum + routeRisk(route),
          0,
        ) / routes.length
      );
    }, [routes]);

  const highRiskRoutes =
    useMemo(
      () =>
        routes.filter(
          (route) =>
            routeRisk(route) >
            65,
        ),
      [routes],
    );

  /*
   * Convert lat/lon into coordinates for a dependency-free
   * SVG network visualization.
   */
  const mapPoints =
    useMemo(() => {
      if (!hubs.length) {
        return new Map<
          string,
          Point
        >();
      }

      const lats = hubs.map(
        (hub) => hub.lat,
      );

      const lons = hubs.map(
        (hub) => hub.lon,
      );

      const minLat =
        Math.min(...lats);

      const maxLat =
        Math.max(...lats);

      const minLon =
        Math.min(...lons);

      const maxLon =
        Math.max(...lons);

      const padding = 55;

      const width = 900;
      const height = 520;

      const map = new Map<
        string,
        Point
      >();

      hubs.forEach((hub) => {
        const lonRange =
          maxLon - minLon || 1;

        const latRange =
          maxLat - minLat || 1;

        const x =
          padding +
          ((hub.lon - minLon) /
            lonRange) *
            (width -
              padding * 2);

        /*
         * SVG y-axis grows downwards,
         * therefore latitude is inverted.
         */
        const y =
          padding +
          ((maxLat - hub.lat) /
            latRange) *
            (height -
              padding * 2);

        map.set(hub.id, {
          x,
          y,
        });
      });

      return map;
    }, [hubs]);

  const visibleRoutes =
    useMemo(() => {
      return filteredRoutes.filter(
        (route) =>
          mapPoints.has(
            route.origin_hub_id,
          ) &&
          mapPoints.has(
            route.dest_hub_id,
          ),
      );
    }, [
      filteredRoutes,
      mapPoints,
    ]);

  if (loading) {
    return (
      <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
        <div className="mx-auto max-w-[1550px]">
          <div className="h-4 w-32 animate-pulse rounded bg-white/50" />

          <div className="mt-8 h-14 w-[550px] max-w-full animate-pulse rounded bg-white/50" />

          <div className="mt-4 h-5 w-[650px] max-w-full animate-pulse rounded bg-white/40" />

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <div className="cargomind-panel h-[650px] animate-pulse rounded-[32px]" />

            <div className="space-y-5">
              <div className="cargomind-panel h-[300px] animate-pulse rounded-[32px]" />
              <div className="cargomind-panel h-[300px] animate-pulse rounded-[32px]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
        <div className="mx-auto max-w-[900px]">
          <section className="mt-10 rounded-[32px] border border-rose-200/70 bg-rose-50/70 p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <RouteIcon />
            </div>

            <h1 className="mt-5 text-xl font-semibold text-rose-800">
              Network unavailable
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-[10px] leading-5 text-rose-700/70">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadNetwork()
              }
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-5 text-[10px] font-semibold text-white hover:bg-rose-700"
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
        {/* HEADER */}
        <section className="animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
                <MapPinIcon />
                Network intelligence
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[#111a20] sm:text-5xl lg:text-6xl">
                Logistics Network
              </h1>

              <p className="mt-4 max-w-3xl text-[14px] leading-7 text-slate-500">
                Explore the connected hub and route network used by
                CargoMind to evaluate consolidation and transport
                decisions.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadNetwork(true)
              }
              disabled={refreshing}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/70 bg-white/50 px-5 text-[10px] font-semibold text-slate-500 backdrop-blur-md transition hover:bg-white/80 disabled:opacity-50"
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

              Refresh network
            </button>
          </div>
        </section>

        {/* KPI STRIP */}
        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400">
                Active hubs
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-600">
                <MapPinIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {activeHubs.length}
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              Origin, transfer & destination
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400">
                Total routes
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10 text-sky-600">
                <RouteIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {routes.length}
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              Road + rail corridors
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400">
                Road routes
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-600">
                <TruckIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {roadRoutes.length}
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              Ground transportation
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400">
                Rail routes
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-600">
                <TrainIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {railRoutes.length}
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              Rail transportation
            </p>
          </div>

          <div className="cargomind-panel rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-400">
                High-risk routes
              </span>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-400/10 text-rose-600">
                <ShieldIcon />
              </div>
            </div>

            <p className="mt-4 text-2xl font-semibold tracking-[-0.045em] text-[#111a20]">
              {highRiskRoutes.length}
            </p>

            <p className="mt-1 text-[8px] text-slate-400">
              Risk score above 65%
            </p>
          </div>
        </section>

        {/* MAP + DETAILS */}
        <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          {/* NETWORK MAP */}
          <section className="cargomind-panel overflow-hidden rounded-[32px]">
            <div className="border-b border-slate-300/15 p-7">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-600">
                      <LayersIcon />
                    </div>

                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                        Live network
                      </p>

                      <h2 className="text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                        Route topology
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setModeFilter(
                        "all",
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-[9px] font-semibold transition ${
                      modeFilter ===
                      "all"
                        ? "bg-[#111216] text-white"
                        : "bg-white/50 text-slate-500 hover:bg-white/80"
                    }`}
                  >
                    All modes
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setModeFilter(
                        "road",
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-[9px] font-semibold transition ${
                      modeFilter ===
                      "road"
                        ? "bg-[#111216] text-white"
                        : "bg-white/50 text-slate-500 hover:bg-white/80"
                    }`}
                  >
                    Road
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setModeFilter(
                        "rail",
                      )
                    }
                    className={`rounded-xl px-3 py-2 text-[9px] font-semibold transition ${
                      modeFilter ===
                      "rail"
                        ? "bg-[#111216] text-white"
                        : "bg-white/50 text-slate-500 hover:bg-white/80"
                    }`}
                  >
                    Rail
                  </button>
                </div>
              </div>

              {/* Risk filter */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Risk
                  </span>

                  {(
                    [
                      ["all", "All"],
                      ["low", "Low"],
                      ["medium", "Moderate"],
                      ["high", "High"],
                    ] as const
                  ).map(
                    ([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setRiskFilter(
                            value,
                          )
                        }
                        className={`rounded-full px-3 py-1.5 text-[8px] font-semibold transition ${
                          riskFilter ===
                          value
                            ? "bg-slate-900 text-white"
                            : "bg-white/50 text-slate-500 hover:bg-white/80"
                        }`}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowRoutes(
                      (current) =>
                        !current,
                    )
                  }
                  className={`rounded-xl px-3 py-2 text-[8px] font-semibold ${
                    showRoutes
                      ? "bg-cyan-400/10 text-cyan-700"
                      : "bg-slate-400/10 text-slate-500"
                  }`}
                >
                  {showRoutes
                    ? "Routes visible"
                    : "Routes hidden"}
                </button>
              </div>
            </div>

            {/* SVG NETWORK */}
            <div className="relative min-h-[560px] overflow-hidden bg-[#edf4f1]">
              {/* Decorative map grid */}
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(100,116,139,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.08) 1px, transparent 1px)",
                  backgroundSize:
                    "42px 42px",
                }}
              />

              <svg
                viewBox="0 0 900 520"
                className="relative h-full min-h-[560px] w-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Routes */}
                {showRoutes &&
                  visibleRoutes.map(
                    (route) => {
                      const from =
                        mapPoints.get(
                          route.origin_hub_id,
                        );

                      const to =
                        mapPoints.get(
                          route.dest_hub_id,
                        );

                      if (!from || !to) {
                        return null;
                      }

                      const risk =
                        routeRisk(
                          route,
                        );

                      const riskInfo =
                        riskLevel(
                          risk,
                        );

                      const isSelected =
                        selectedRoute?.id ===
                        route.id;

                      const dx =
                        to.x -
                        from.x;

                      const dy =
                        to.y -
                        from.y;

                      const length =
                        Math.sqrt(
                          dx * dx +
                            dy * dy,
                        );

                      const nx =
                        -dy /
                        (length || 1);

                      const ny =
                        dx /
                        (length || 1);

                      const curve =
                        route.mode ===
                        "rail"
                          ? 14
                          : 0;

                      const midX =
                        (from.x +
                          to.x) /
                          2 +
                        nx *
                          curve;

                      const midY =
                        (from.y +
                          to.y) /
                          2 +
                        ny *
                          curve;

                      return (
                        <g
                          key={
                            route.id
                          }
                          onClick={() =>
                            setSelectedRouteId(
                              route.id,
                            )
                          }
                          className="cursor-pointer"
                        >
                          {/* Glow */}
                          {isSelected && (
                            <path
                              d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                              fill="none"
                              stroke={
                                riskInfo.stroke
                              }
                              strokeWidth="8"
                              strokeOpacity="0.12"
                              strokeLinecap="round"
                            />
                          )}

                          <path
                            d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                            fill="none"
                            stroke={
                              riskInfo.stroke
                            }
                            strokeWidth={
                              isSelected
                                ? 4
                                : 2.5
                            }
                            strokeOpacity={
                              isSelected
                                ? 1
                                : 0.62
                            }
                            strokeDasharray={
                              route.mode ===
                              "rail"
                                ? "7 6"
                                : undefined
                            }
                            strokeLinecap="round"
                          />
                        </g>
                      );
                    },
                  )}

                {/* Hubs */}
                {hubs.map((hub) => {
                  const point =
                    mapPoints.get(
                      hub.id,
                    );

                  if (!point) {
                    return null;
                  }

                  const isSelected =
                    selectedHub?.id ===
                    hub.id;

                  let fill =
                    "#64748b";

                  if (
                    hub.type ===
                    "origin"
                  ) {
                    fill =
                      "#8b5cf6";
                  }

                  if (
                    hub.type ===
                    "destination"
                  ) {
                    fill =
                      "#06b6d4";
                  }

                  if (
                    hub.type ===
                    "transfer"
                  ) {
                    fill =
                      "#f59e0b";
                  }

                  return (
                    <g
                      key={hub.id}
                      onClick={() =>
                        setSelectedHubId(
                          hub.id,
                        )
                      }
                      className="cursor-pointer"
                    >
                      {isSelected && (
                        <circle
                          cx={
                            point.x
                          }
                          cy={
                            point.y
                          }
                          r="15"
                          fill={
                            fill
                          }
                          opacity="0.15"
                        />
                      )}

                      <circle
                        cx={
                          point.x
                        }
                        cy={
                          point.y
                        }
                        r={
                          isSelected
                            ? 8
                            : 6
                        }
                        fill={
                          fill
                        }
                        stroke="white"
                        strokeWidth="3"
                      />

                      <text
                        x={
                          point.x
                        }
                        y={
                          point.y -
                          13
                        }
                        textAnchor="middle"
                        className="fill-slate-600"
                        style={{
                          fontSize:
                            "9px",
                          fontWeight:
                            600,
                        }}
                      >
                        {hub.name}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Map legend */}
              <div className="absolute bottom-5 left-5 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Route risk
                </p>

                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[8px] text-slate-500">
                      Low
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-[8px] text-slate-500">
                      Moderate
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="text-[8px] text-slate-500">
                      High
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-5 rounded-full bg-slate-400" />
                    <span className="text-[8px] text-slate-500">
                      Road
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-5 border-t-2 border-dashed border-slate-400" />
                    <span className="text-[8px] text-slate-500">
                      Rail
                    </span>
                  </div>
                </div>
              </div>

              {/* Hub legend */}
              <div className="absolute bottom-5 right-5 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-xl">
                <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Hubs
                </p>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                    <span className="text-[8px] text-slate-500">
                      Origin
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-[8px] text-slate-500">
                      Transfer
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                    <span className="text-[8px] text-slate-500">
                      Destination
                    </span>
                  </div>
                </div>
              </div>

              {hubs.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-2xl bg-white/75 px-7 py-6 text-center shadow-sm backdrop-blur-xl">
                    <MapPinIcon />

                    <p className="mt-3 text-[10px] font-semibold text-[#111a20]">
                      No network nodes available
                    </p>

                    <p className="mt-1 text-[8px] text-slate-400">
                      Add hubs and routes in the backend to populate
                      this visualization.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SELECTED ROUTE */}
          <aside className="space-y-5">
            <section className="cargomind-panel rounded-[32px] p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Selected corridor
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                    Route intelligence
                  </h2>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-600">
                  <RouteIcon />
                </div>
              </div>

              {selectedRoute ? (
                <div className="mt-7">
                  <div className="rounded-2xl bg-white/45 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold text-[#111a20]">
                        {selectedRoute.id}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[8px] font-semibold capitalize ${
                          selectedRoute.mode ===
                          "rail"
                            ? "bg-cyan-400/10 text-cyan-700"
                            : "bg-amber-400/10 text-amber-700"
                        }`}
                      >
                        {selectedRoute.mode}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] uppercase tracking-[0.1em] text-slate-400">
                          Origin
                        </p>

                        <p className="mt-1 truncate text-[10px] font-semibold text-[#111a20]">
                          {hubs.find(
                            (hub) =>
                              hub.id ===
                              selectedRoute.origin_hub_id,
                          )?.name ||
                            selectedRoute.origin_hub_id}
                        </p>
                      </div>

                      <div className="h-px flex-1 bg-slate-300/60" />

                      <div className="min-w-0 flex-1 text-right">
                        <p className="text-[8px] uppercase tracking-[0.1em] text-slate-400">
                          Destination
                        </p>

                        <p className="mt-1 truncate text-[10px] font-semibold text-[#111a20]">
                          {hubs.find(
                            (hub) =>
                              hub.id ===
                              selectedRoute.dest_hub_id,
                          )?.name ||
                            selectedRoute.dest_hub_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/45 p-4">
                      <p className="text-[8px] text-slate-400">
                        Transit
                      </p>

                      <p className="mt-2 text-[15px] font-semibold text-[#111a20]">
                        {formatNumber(
                          selectedRoute.avg_transit_hrs,
                          1,
                        )}{" "}
                        hrs
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/45 p-4">
                      <p className="text-[8px] text-slate-400">
                        Cost / kg
                      </p>

                      <p className="mt-2 text-[15px] font-semibold text-[#111a20]">
                        {formatCurrency(
                          selectedRoute.base_cost_per_kg,
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/45 p-4">
                      <p className="text-[8px] text-slate-400">
                        Reliability
                      </p>

                      <p className="mt-2 text-[15px] font-semibold text-[#111a20]">
                        {normalizeRisk(
                          selectedRoute.reliability_score,
                        ).toFixed(0)}
                        %
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/45 p-4">
                      <p className="text-[8px] text-slate-400">
                        Risk
                      </p>

                      <p
                        className={`mt-2 text-[15px] font-semibold ${
                          riskLevel(
                            routeRisk(
                              selectedRoute,
                            ),
                          ).text
                        }`}
                      >
                        {routeRisk(
                          selectedRoute,
                        ).toFixed(0)}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl bg-white/45 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-slate-400">
                        Route risk
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[8px] font-semibold ${
                          riskLevel(
                            routeRisk(
                              selectedRoute,
                            ),
                          ).bg
                        } ${
                          riskLevel(
                            routeRisk(
                              selectedRoute,
                            ),
                          ).text
                        }`}
                      >
                        {
                          riskLevel(
                            routeRisk(
                              selectedRoute,
                            ),
                          ).label
                        }
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/70">
                      <div
                        className={`h-full rounded-full ${
                          routeRisk(
                            selectedRoute,
                          ) > 65
                            ? "bg-rose-500"
                            : routeRisk(
                                  selectedRoute,
                                ) >= 35
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{
                          width: `${routeRisk(
                            selectedRoute,
                          )}%`,
                        }}
                      />
                    </div>

                    <p className="mt-3 text-[8px] leading-5 text-slate-400">
                      Route risk is based on the risk value returned
                      by the backend. If a direct route risk is not
                      provided, the visualization estimates risk from
                      route reliability.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-7 rounded-2xl bg-white/45 p-7 text-center">
                  <RouteIcon />

                  <p className="mt-3 text-[10px] font-semibold text-[#111a20]">
                    Select a route
                  </p>

                  <p className="mt-1 text-[8px] text-slate-400">
                    Click a route on the network visualization to
                    inspect its details.
                  </p>
                </div>
              )}
            </section>

            {/* NETWORK HEALTH */}
            <section className="cargomind-panel rounded-[32px] p-7">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Network health
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                Operational overview
              </h2>

              <div className="mt-7 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400">
                      Average reliability
                    </span>

                    <span className="text-[10px] font-semibold text-[#111a20]">
                      {averageReliability.toFixed(
                        0,
                      )}
                      %
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${averageReliability}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400">
                      Average route risk
                    </span>

                    <span
                      className={`text-[10px] font-semibold ${
                        riskLevel(
                          averageRisk,
                        ).text
                      }`}
                    >
                      {averageRisk.toFixed(
                        0,
                      )}
                      %
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className={`h-full rounded-full ${
                        averageRisk >
                        65
                          ? "bg-rose-500"
                          : averageRisk >=
                              35
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${averageRisk}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </section>

        {/* ROUTE TABLE */}
        <section className="mt-5 cargomind-panel overflow-hidden rounded-[32px]">
          <div className="flex flex-col justify-between gap-4 p-7 sm:flex-row sm:items-center">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Network corridors
              </p>

              <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                Route intelligence
              </h2>
            </div>

            <span className="rounded-full bg-white/60 px-3 py-2 text-[8px] font-semibold text-slate-500">
              {filteredRoutes.length} visible routes
            </span>
          </div>

          {filteredRoutes.length ===
          0 ? (
            <div className="border-t border-slate-300/15 p-10 text-center">
              <p className="text-[10px] font-semibold text-[#111a20]">
                No routes match your filters
              </p>

              <p className="mt-2 text-[8px] text-slate-400">
                Try selecting another transport mode or risk level.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-slate-300/15">
              <table className="w-full min-w-[850px] border-collapse">
                <thead>
                  <tr className="text-left">
                    <th className="px-7 py-4 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Route
                    </th>

                    <th className="px-4 py-4 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Mode
                    </th>

                    <th className="px-4 py-4 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Transit
                    </th>

                    <th className="px-4 py-4 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Cost / kg
                    </th>

                    <th className="px-4 py-4 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Reliability
                    </th>

                    <th className="px-4 py-4 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Risk
                    </th>

                    <th className="px-7 py-4" />
                  </tr>
                </thead>

                <tbody>
                  {filteredRoutes.map(
                    (route) => {
                      const risk =
                        routeRisk(
                          route,
                        );

                      const riskInfo =
                        riskLevel(
                          risk,
                        );

                      const origin =
                        hubs.find(
                          (hub) =>
                            hub.id ===
                            route.origin_hub_id,
                        );

                      const destination =
                        hubs.find(
                          (hub) =>
                            hub.id ===
                            route.dest_hub_id,
                        );

                      const isSelected =
                        selectedRoute?.id ===
                        route.id;

                      return (
                        <tr
                          key={
                            route.id
                          }
                          onClick={() =>
                            setSelectedRouteId(
                              route.id,
                            )
                          }
                          className={`cursor-pointer border-t border-slate-300/10 transition-colors ${
                            isSelected
                              ? "bg-white/60"
                              : "hover:bg-white/35"
                          }`}
                        >
                          <td className="px-7 py-5">
                            <div>
                              <p className="text-[10px] font-semibold text-[#111a20]">
                                {route.id}
                              </p>

                              <p className="mt-1 text-[8px] text-slate-400">
                                {origin?.name ||
                                  route.origin_hub_id}{" "}
                                →{" "}
                                {destination?.name ||
                                  route.dest_hub_id}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[8px] font-semibold capitalize ${
                                route.mode ===
                                "rail"
                                  ? "bg-cyan-400/10 text-cyan-700"
                                  : "bg-amber-400/10 text-amber-700"
                              }`}
                            >
                              {route.mode ===
                              "rail" ? (
                                <TrainIcon />
                              ) : (
                                <TruckIcon />
                              )}

                              {route.mode}
                            </span>
                          </td>

                          <td className="px-4 py-5 text-[9px] font-semibold text-[#111a20]">
                            {formatNumber(
                              route.avg_transit_hrs,
                              1,
                            )}{" "}
                            hrs
                          </td>

                          <td className="px-4 py-5 text-[9px] font-semibold text-[#111a20]">
                            {formatCurrency(
                              route.base_cost_per_kg,
                            )}
                          </td>

                          <td className="px-4 py-5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200/80">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{
                                    width: `${normalizeRisk(
                                      route.reliability_score,
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="text-[8px] font-semibold text-slate-500">
                                {normalizeRisk(
                                  route.reliability_score,
                                ).toFixed(
                                  0,
                                )}
                                %
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-5">
                            <span
                              className={`rounded-full px-2.5 py-1.5 text-[8px] font-semibold ${riskInfo.bg} ${riskInfo.text}`}
                            >
                              {risk.toFixed(
                                0,
                              )}
                              %
                            </span>
                          </td>

                          <td className="px-7 py-5 text-right">
                            <span className="inline-flex text-slate-400">
                              <ArrowUpRightIcon />
                            </span>
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* SELECTED HUB */}
        {selectedHub && (
          <section className="mt-5 rounded-[32px] bg-[#111216] p-7 text-white shadow-[0_20px_60px_rgba(17,18,22,0.12)]">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-cyan-300">
                  <MapPinIcon />
                </div>

                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-white/30">
                    Selected hub
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    {selectedHub.name}
                  </h2>

                  <p className="mt-2 text-[9px] capitalize text-white/40">
                    {selectedHub.type} hub ·{" "}
                    {selectedHub.lat.toFixed(
                      4,
                    )}
                    ,{" "}
                    {selectedHub.lon.toFixed(
                      4,
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 px-5 py-4">
                  <p className="text-[8px] text-white/30">
                    Status
                  </p>

                  <p className="mt-2 text-[10px] font-semibold text-emerald-300">
                    {selectedHub.is_active ===
                    false
                      ? "Inactive"
                      : "Active"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 px-5 py-4">
                  <p className="text-[8px] text-white/30">
                    Type
                  </p>

                  <p className="mt-2 text-[10px] font-semibold capitalize">
                    {selectedHub.type}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 px-5 py-4">
                  <p className="text-[8px] text-white/30">
                    Cold capacity
                  </p>

                  <p className="mt-2 text-[10px] font-semibold">
                    {selectedHub.cold_storage_capacity_kg !=
                    null
                      ? `${formatNumber(
                          selectedHub.cold_storage_capacity_kg,
                        )} kg`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* AI CONNECTION */}
        <section className="mt-5 overflow-hidden rounded-[32px] border border-white/60 bg-white/25 p-7 backdrop-blur-xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111216] text-white">
                <ShieldIcon />
              </div>

              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Route intelligence
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                  Use network risk inside the AI decision layer
                </h2>

                <p className="mt-2 max-w-3xl text-[9px] leading-5 text-slate-400">
                  Route reliability, transit time and risk are inputs
                  that can influence CargoMind's consolidation and
                  routing recommendations.
                </p>
              </div>
            </div>

            <Link
              href="/ai-intelligence"
              className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-5 text-[10px] font-semibold text-white transition-all hover:-translate-y-0.5"
            >
              Open AI Intelligence
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