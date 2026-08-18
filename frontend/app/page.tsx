"use client";

import Link from "next/link";
import { useState } from "react";

const KPI_METRICS = [
  {
    label: "Active Consignments",
    value: "148",
    change: "+14.2%",
    description: "Across national corridors",
    accent: "text-[#101820]",
  },
  {
    label: "Cold-Chain On-Time SLA",
    value: "97.4%",
    change: "+3.8%",
    description: "Multi-modal schedule precision",
    accent: "text-emerald-700",
  },
  {
    label: "Active Thermal Excursions",
    value: "3",
    change: "-42.5%",
    description: "Proactively mitigated via IoT",
    accent: "text-rose-600",
  },
  {
    label: "Monthly Freight Savings",
    value: "₹4.18L",
    change: "+24.6%",
    description: "CP-SAT bundle optimization",
    accent: "text-[#101820]",
  },
];

const HUBS_DATA = [
  { id: "delhi", name: "Delhi Mega Hub", x: 260, y: 110, risk: "low", shipments: 42, tempCapacityKg: "45,000" },
  { id: "jaipur", name: "Jaipur Crossdock", x: 210, y: 150, risk: "low", shipments: 18, tempCapacityKg: "20,000" },
  { id: "ahmedabad", name: "Ahmedabad Terminal", x: 150, y: 220, risk: "medium", shipments: 24, tempCapacityKg: "30,000" },
  { id: "mumbai", name: "Mumbai JNPT Port", x: 140, y: 290, risk: "low", shipments: 56, tempCapacityKg: "80,000" },
  { id: "pune", name: "Pune Cold Park", x: 175, y: 320, risk: "low", shipments: 20, tempCapacityKg: "25,000" },
  { id: "hyderabad", name: "Hyderabad Logistics", x: 280, y: 310, risk: "low", shipments: 34, tempCapacityKg: "40,000" },
  { id: "bengaluru", name: "Bengaluru Cold Center", x: 250, y: 410, risk: "medium", shipments: 39, tempCapacityKg: "50,000" },
  { id: "chennai", name: "Chennai Harbor Hub", x: 320, y: 400, risk: "low", shipments: 44, tempCapacityKg: "60,000" },
  { id: "kolkata", name: "Kolkata Freight Hub", x: 440, y: 230, risk: "medium", shipments: 28, tempCapacityKg: "35,000" },
  { id: "bhubaneswar", name: "Bhubaneswar Depot", x: 410, y: 290, risk: "low", shipments: 15, tempCapacityKg: "15,000" },
];

const CORRIDOR_PATHS = [
  { from: "delhi", to: "jaipur", d: "M 260 110 L 210 150", mode: "road" },
  { from: "jaipur", to: "ahmedabad", d: "M 210 150 L 150 220", mode: "rail" },
  { from: "ahmedabad", to: "mumbai", d: "M 150 220 L 140 290", mode: "rail" },
  { from: "delhi", to: "mumbai", d: "M 260 110 Q 180 200 140 290", mode: "rail" },
  { from: "mumbai", to: "pune", d: "M 140 290 L 175 320", mode: "road" },
  { from: "mumbai", to: "hyderabad", d: "M 140 290 L 280 310", mode: "rail" },
  { from: "hyderabad", to: "bengaluru", d: "M 280 310 L 250 410", mode: "rail" },
  { from: "bengaluru", to: "chennai", d: "M 250 410 L 320 400", mode: "road" },
  { from: "delhi", to: "kolkata", d: "M 260 110 Q 360 160 440 230", mode: "rail" },
  { from: "kolkata", to: "bhubaneswar", d: "M 440 230 L 410 290", mode: "road" },
  { from: "bhubaneswar", to: "hyderabad", d: "M 410 290 L 280 310", mode: "rail" },
];

const RECENT_SHIPMENTS = [
  {
    id: "CM-00892",
    route: "Delhi Hub ➔ Mumbai Crossdock",
    type: "Frozen (-18°C)",
    eta: "14h 32m",
    risk: "Low",
    status: "In Transit",
    mode: "🚆 Rail DFC",
  },
  {
    id: "CM-00844",
    route: "Hyderabad ➔ Kolkata Terminal",
    type: "Chilled (+4°C)",
    eta: "08h 14m",
    risk: "High",
    status: "Rerouting",
    mode: "🚛 Road Reefer",
  },
  {
    id: "CM-00810",
    route: "Bengaluru ➔ Chennai Port",
    type: "Ambient (22°C)",
    eta: "04h 45m",
    risk: "Low",
    status: "Delivered",
    mode: "🚆 Rail Express",
  },
  {
    id: "CM-00795",
    route: "Jaipur ➔ Ahmedabad Hub",
    type: "Frozen (-18°C)",
    eta: "06h 18m",
    risk: "Medium",
    status: "In Transit",
    mode: "🚛 Road Reefer",
  },
];

export default function HomePage() {
  const [selectedHubId, setSelectedHubId] = useState<string>("delhi");
  const [activeModeFilter, setActiveModeFilter] = useState<"all" | "rail" | "road">("all");

  const selectedHub = HUBS_DATA.find((h) => h.id === selectedHubId) || HUBS_DATA[0];

  const visiblePaths = CORRIDOR_PATHS.filter((p) => {
    if (activeModeFilter === "all") return true;
    return p.mode === activeModeFilter;
  });

  return (
    <div className="cargomind-grid min-h-[calc(100vh-88px)] px-5 pb-16 pt-6 sm:px-8">
      <div className="mx-auto max-w-[1700px]">
        {/* Live Marquee Ticker */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/75 bg-white/45 py-2.5 backdrop-blur-md">
          <div className="animate-marquee flex items-center gap-10 whitespace-nowrap text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>🟢 Delhi ⇄ Mumbai Expressway: 8 Reefer trains on schedule (ETA: 19.4h • Temp: -18.2°C)</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span>⚠️ Western Ghats Monsoon Warning: Heavy precipitation • Automated modal shift to DFC Rail active</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>⚡ CP-SAT Consolidation Batch #410: Solved with 32.4% cost savings & 0% thermal contamination</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>🟢 Bengaluru Cold Storage Hub: 78% capacity utilized (32,000 kg cold payload available)</span>
            </span>
            {/* Repeat for continuous marquee loop */}
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>🟢 Delhi ⇄ Mumbai Expressway: 8 Reefer trains on schedule (ETA: 19.4h • Temp: -18.2°C)</span>
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="animate-fade-up flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              AI Logistics & Cold-Chain Consolidation
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-[#111a20] sm:text-5xl lg:text-6xl">
              Freight intelligence,
              <br />
              <span className="text-slate-500">without the guesswork.</span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Monitor shipments in real-time, predict Arrhenius spoilage decay, simulate weather disruptions, and consolidate freight with mathematical precision.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/simulator"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-5 text-xs font-semibold text-slate-700 backdrop-blur-md transition-all hover:bg-white"
            >
              ⚡ Open Stress Lab
            </Link>

            <Link
              href="/shipments/create"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-5 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(17,18,22,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#24252a]"
            >
              <span>+ New Shipment</span>
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">➔</span>
            </Link>
          </div>
        </section>

        {/* Operational KPI Cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPI_METRICS.map((kpi, idx) => (
            <div
              key={kpi.label}
              className="cargomind-panel-interactive rounded-[26px] p-5"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {kpi.change}
                </span>
              </div>

              <div className={`mt-5 text-3xl font-bold tracking-tight ${kpi.accent}`}>
                {kpi.value}
              </div>

              <p className="mt-1 text-[11px] text-slate-400">{kpi.description}</p>
            </div>
          ))}
        </section>

        {/* Interactive Network Visualizer & Hub Drawer */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_0.9fr]">
          {/* Animated SVG Map */}
          <div className="cargomind-panel relative min-h-[480px] overflow-hidden rounded-[30px] p-6">
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Real-Time Corridor Telemetry
                </span>
                <h2 className="mt-0.5 text-xl font-bold text-[#111a20]">
                  Live National Freight Grid
                </h2>
              </div>

              <div className="flex items-center gap-1.5 rounded-2xl bg-white/60 p-1 border border-white/70">
                {(["all", "rail", "road"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setActiveModeFilter(m)}
                    className={`rounded-xl px-3 py-1 text-[11px] font-semibold capitalize transition-all ${
                      activeModeFilter === m
                        ? "bg-[#111216] text-white shadow-sm"
                        : "text-slate-500 hover:text-[#111216]"
                    }`}
                  >
                    {m === "all" ? "All Modes" : m === "rail" ? "🚆 Rail DFC" : "🚛 Road Reefer"}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative mt-4 h-[380px] w-full overflow-hidden rounded-[24px] bg-[#d3e2e8]/40 border border-white/40">
              <svg viewBox="0 0 540 480" className="h-full w-full">
                {/* Connecting Corridor Paths with animated flow */}
                {visiblePaths.map((path, i) => (
                  <g key={i}>
                    {/* Base track */}
                    <path
                      d={path.d}
                      fill="none"
                      stroke={path.mode === "rail" ? "#111216" : "#64748b"}
                      strokeWidth={path.mode === "rail" ? "2.5" : "1.8"}
                      strokeOpacity="0.25"
                    />

                    {/* Animated moving dashed particle flow */}
                    <path
                      d={path.d}
                      fill="none"
                      stroke={path.mode === "rail" ? "#10b981" : "#f59e0b"}
                      strokeWidth={path.mode === "rail" ? "2.5" : "2"}
                      className="animate-dash-flow"
                    />
                  </g>
                ))}

                {/* Hub Nodes */}
                {HUBS_DATA.map((hub) => {
                  const isSelected = selectedHubId === hub.id;
                  const isMedium = hub.risk === "medium";

                  return (
                    <g
                      key={hub.id}
                      onClick={() => setSelectedHubId(hub.id)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      {/* Outer pulse */}
                      {isSelected && (
                        <circle
                          cx={hub.x}
                          cy={hub.y}
                          r="16"
                          fill="rgba(16, 185, 129, 0.25)"
                          className="animate-ping"
                        />
                      )}

                      {/* Node circle */}
                      <circle
                        cx={hub.x}
                        cy={hub.y}
                        r={isSelected ? "8" : "6"}
                        fill={isMedium ? "#f59e0b" : "#10b981"}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                      />

                      {/* Hub Label Pill */}
                      <rect
                        x={hub.x - 36}
                        y={hub.y + 10}
                        width="72"
                        height="18"
                        rx="9"
                        fill="rgba(255, 255, 255, 0.85)"
                        stroke="rgba(255, 255, 255, 0.9)"
                      />
                      <text
                        x={hub.x}
                        y={hub.y + 22}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontWeight="700"
                        fill="#111216"
                      >
                        {hub.name.split(" ")[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-3 left-3 flex items-center gap-4 rounded-xl border border-white/70 bg-white/70 px-3 py-1.5 text-[10px] text-slate-600 backdrop-blur-md">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Rail Corridor (Low Risk)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Road Corridor (Weather Alert)
                </span>
              </div>
            </div>
          </div>

          {/* Right Hub Inspection Drawer */}
          <div className="cargomind-panel rounded-[30px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Node Telemetry
                </span>
                <h3 className="text-xl font-bold text-[#111a20]">{selectedHub.name}</h3>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800 uppercase">
                {selectedHub.risk} Risk
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              <div className="rounded-2xl bg-white/60 p-4">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Active Shipments Handled</span>
                <p className="mt-1 text-2xl font-bold text-slate-800">{selectedHub.shipments} Units</p>
              </div>

              <div className="rounded-2xl bg-white/60 p-4">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Cold Storage Buffer Capacity</span>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{selectedHub.tempCapacityKg} kg</p>
              </div>

              <div className="rounded-2xl bg-white/60 p-4">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Supported Thermal Profiles</span>
                <div className="mt-2 flex gap-1.5">
                  <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Frozen (-18°C)</span>
                  <span className="rounded-lg bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">Chilled (+4°C)</span>
                  <span className="rounded-lg bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">Ambient (22°C)</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <Link
                href="/consolidation"
                className="flex-1 rounded-2xl bg-[#111216] py-3 text-center text-xs font-semibold text-white shadow-md hover:bg-[#24252a]"
              >
                Batch Consolidate
              </Link>
              <Link
                href="/network"
                className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-white"
              >
                Inspect All ➔
              </Link>
            </div>
          </div>
        </section>

        {/* Live Consignments & AI Decision Highlights */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
          {/* Active Shipments Stream */}
          <div className="cargomind-panel rounded-[30px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Live Operations Stream
                </span>
                <h3 className="mt-0.5 text-xl font-bold text-[#111a20]">Priority Consignments</h3>
              </div>

              <Link
                href="/shipments"
                className="text-xs font-semibold text-slate-600 underline underline-offset-4 hover:text-[#111216]"
              >
                View all shipments ➔
              </Link>
            </div>

            <div className="mt-5 divide-y divide-slate-200/50">
              {RECENT_SHIPMENTS.map((s) => (
                <Link
                  href={`/shipments/${s.id}`}
                  key={s.id}
                  className="flex items-center justify-between py-3.5 transition-colors hover:bg-white/40 rounded-2xl px-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{s.id}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-slate-600">{s.route}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{s.type}</span>
                      <span>•</span>
                      <span>{s.mode}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800">ETA: {s.eta}</span>
                    <div className="mt-0.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          s.risk === "Low"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.risk === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {s.risk} Risk
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* AI Decision Intelligence Highlight Card */}
          <div className="relative overflow-hidden rounded-[30px] bg-[#111216] p-7 text-white shadow-xl">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                ✨ Prescriptive AI Intelligence
              </span>

              <h3 className="mt-4 text-2xl font-bold tracking-tight">
                Autonomous Corridor Re-Routing Activated
              </h3>

              <p className="mt-3 text-xs leading-6 text-white/70">
                Heavy monsoon waterlogging detected along Western Expressway (NH-48). CargoMind has autonomously prepared 4 Pareto-ranked multimodal rail shift alternatives, safeguarding 100% of temperature-sensitive cargo.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/consolidation"
                  className="rounded-2xl bg-white px-5 py-3 text-xs font-bold text-[#111216] transition-all hover:bg-emerald-100"
                >
                  Review AI Consolidation Plans ➔
                </Link>
                <Link
                  href="/alerts"
                  className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold text-white hover:bg-white/20"
                >
                  Alert Triage (3 Active)
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}