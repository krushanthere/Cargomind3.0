"use client";

import Link from "next/link";
import { useState } from "react";

const CORRIDOR_LEADERBOARD = [
  {
    corridor: "Delhi Logistics Hub ⇄ Mumbai Crossdock",
    volumeMonthlyTonnes: 1420,
    costPerKgKm: "₹2.12",
    avgTransitHours: 21.4,
    onTimeSla: "96.8%",
    status: "Optimal",
    modeMix: "65% Rail / 35% Road",
  },
  {
    corridor: "Hyderabad Industrial Hub ⇄ Bengaluru Cold Park",
    volumeMonthlyTonnes: 890,
    costPerKgKm: "₹1.88",
    avgTransitHours: 11.2,
    onTimeSla: "98.4%",
    status: "Optimal",
    modeMix: "80% Rail / 20% Road",
  },
  {
    corridor: "Jaipur Center ⇄ Ahmedabad Hub",
    volumeMonthlyTonnes: 730,
    costPerKgKm: "₹2.45",
    avgTransitHours: 10.5,
    onTimeSla: "94.2%",
    status: "Monitored",
    modeMix: "45% Rail / 55% Road",
  },
  {
    corridor: "Bengaluru Cold Park ⇄ Chennai Harbor Hub",
    volumeMonthlyTonnes: 1150,
    costPerKgKm: "₹1.65",
    avgTransitHours: 5.6,
    onTimeSla: "97.1%",
    status: "Optimal",
    modeMix: "70% Rail / 30% Road",
  },
  {
    corridor: "Kolkata Terminal ⇄ Bhubaneswar Hub",
    volumeMonthlyTonnes: 540,
    costPerKgKm: "₹2.80",
    avgTransitHours: 8.2,
    onTimeSla: "91.8%",
    status: "Weather Alert",
    modeMix: "30% Rail / 70% Road",
  },
];

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<"30d" | "90d" | "1y">("30d");

  return (
    <main className="cargomind-grid min-h-[calc(100vh-88px)] px-6 pb-20 pt-8">
      <div className="mx-auto max-w-[1700px]">
        {/* Header */}
        <section className="animate-fade-up flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Executive Logistics Intelligence
            </div>

            <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#111a20] sm:text-5xl">
              Command Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-500">
              High-level freight network efficiency, fleet capacity utilization, carbon abatement, and inter-city corridor performance benchmarks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl bg-white/50 p-1 border border-white/70">
              {(["30d", "90d", "1y"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold uppercase transition-all ${
                    timeRange === r ? "bg-[#111216] text-white shadow-sm" : "text-slate-500 hover:text-[#111216]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <Link
              href="/consolidation"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-5 text-xs font-semibold text-white shadow-lg transition-all hover:bg-[#24252a]"
            >
              + Create Consolidation Plan
            </Link>
          </div>
        </section>

        {/* Executive KPI Scorecard */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="cargomind-panel rounded-[26px] p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Freight Cost Saved</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                +22.4% MoM
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#111a20]">₹42.8 Lakhs</p>
            <p className="mt-1 text-[11px] text-slate-400">Achieved via CP-SAT bundle optimization</p>
          </div>

          <div className="cargomind-panel rounded-[26px] p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Fleet Volume Consolidation</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                89.4% Avg
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#111a20]">1,480 Tonnes</p>
            <p className="mt-1 text-[11px] text-slate-400">Zero dead-weight payload waste</p>
          </div>

          <div className="cargomind-panel rounded-[26px] p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Carbon Abatement</span>
              <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold text-cyan-700">
                -68% vs Road
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-cyan-700">184.2 MT CO₂e</p>
            <p className="mt-1 text-[11px] text-slate-400">Shift to Electric Dedicated Rail Corridors</p>
          </div>

          <div className="cargomind-panel rounded-[26px] p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Cold-Chain SLA Compliance</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                97.8% On-Time
              </span>
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight text-[#111a20]">0.02% Spoilage</p>
            <p className="mt-1 text-[11px] text-slate-400">Zero unmitigated thermal excursion breach</p>
          </div>
        </section>

        {/* Corridor Leaderboard & Modal Mix */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          {/* Corridor Performance Table */}
          <div className="cargomind-panel rounded-[30px] p-7">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Performance Benchmarks
                </span>
                <h2 className="mt-1 text-xl font-semibold text-[#111a20]">
                  High-Velocity Freight Corridors
                </h2>
              </div>

              <Link
                href="/network"
                className="text-xs font-semibold text-slate-600 underline underline-offset-4 hover:text-[#111216]"
              >
                Network Map ➔
              </Link>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/70 pb-3 text-[10px] font-semibold uppercase text-slate-400">
                    <th className="pb-3">Corridor</th>
                    <th className="pb-3">Monthly Vol</th>
                    <th className="pb-3">Cost / kg-km</th>
                    <th className="pb-3">Avg ETA</th>
                    <th className="pb-3">SLA %</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50">
                  {CORRIDOR_LEADERBOARD.map((row) => (
                    <tr key={row.corridor} className="transition-colors hover:bg-white/40">
                      <td className="py-4 font-semibold text-slate-800">
                        {row.corridor}
                        <div className="text-[10px] font-normal text-slate-400">{row.modeMix}</div>
                      </td>
                      <td className="py-4 text-slate-600">{row.volumeMonthlyTonnes} T</td>
                      <td className="py-4 font-mono font-semibold text-slate-700">{row.costPerKgKm}</td>
                      <td className="py-4 text-slate-600">{row.avgTransitHours} hrs</td>
                      <td className="py-4 font-semibold text-emerald-600">{row.onTimeSla}</td>
                      <td className="py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            row.status === "Optimal"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Split & Quick Command Launchers */}
          <div className="space-y-6">
            {/* Modal Split Card */}
            <div className="cargomind-panel rounded-[30px] p-7">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Modal Distribution
              </span>
              <h3 className="mt-1 text-lg font-semibold text-[#111a20]">
                Rail vs Road Tonne-Km Split
              </h3>

              <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-slate-200">
                <div className="bg-[#111216] transition-all" style={{ width: "64%" }} />
                <div className="bg-cyan-500 transition-all" style={{ width: "36%" }} />
              </div>

              <div className="mt-4 flex justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#111216]" />
                  <span className="font-semibold text-slate-700">Dedicated Rail (64%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-cyan-500" />
                  <span className="font-semibold text-slate-700">Road Reefer (36%)</span>
                </div>
              </div>

              <p className="mt-4 text-[11px] leading-5 text-slate-500">
                Rail transit provides 94% on-time reliability during peak monsoon months and shields temperature-controlled payloads from highway congestion.
              </p>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-[30px] bg-[#111216] p-7 text-white shadow-xl">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Quick Shortcuts
              </span>
              <h3 className="mt-1 text-lg font-semibold">Operations Command Hub</h3>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Link
                  href="/simulator"
                  className="rounded-2xl border border-white/20 bg-white/10 p-3.5 text-center text-xs font-semibold text-white transition-all hover:bg-white hover:text-[#111216]"
                >
                  ⚡ Stress Simulator
                </Link>
                <Link
                  href="/alerts"
                  className="rounded-2xl border border-white/20 bg-white/10 p-3.5 text-center text-xs font-semibold text-white transition-all hover:bg-white hover:text-[#111216]"
                >
                  🚨 Live Alert Center
                </Link>
                <Link
                  href="/shipments/create"
                  className="rounded-2xl border border-white/20 bg-white/10 p-3.5 text-center text-xs font-semibold text-white transition-all hover:bg-white hover:text-[#111216]"
                >
                  📦 Intake Cargo
                </Link>
                <Link
                  href="/ai-intelligence"
                  className="rounded-2xl border border-white/20 bg-white/10 p-3.5 text-center text-xs font-semibold text-white transition-all hover:bg-white hover:text-[#111216]"
                >
                  ✨ AI Explainer
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
