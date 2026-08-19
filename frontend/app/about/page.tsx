"use client";

import Link from "next/link";
import { useState } from "react";
import {
  StarburstIcon,
  AiBrainIcon,
  CpuIcon,
  ShieldCheckIcon,
  PulseIcon,
  RouteIcon,
  ThermometerIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  CheckmarkCircleIcon,
  SendIcon,
} from "../../components/icons/Hugeicons";

export default function AboutPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    fleetSize: "100+ Reefers",
    inquiry: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="min-h-[calc(100vh-76px)] bg-white text-[#0a0a0a]">
      {/* Top Breadcrumb & Status */}
      <div className="border-b border-neutral-200 bg-neutral-50/50">
        <div className="mx-auto max-w-[1600px] px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="text-black font-semibold">MODULE: ABOUT_CARGOMIND</span>
            <span>//</span>
            <span>SPECIFICATIONS, METHODOLOGY & ENTERPRISE ARCHITECTURE</span>
          </div>
          <div className="font-mono text-neutral-600">VERSION: 3.0.4 PRODUCTION</div>
        </div>
      </div>

      {/* HERO MANIFESTO (Large Typography, Swiss Editorial) */}
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 py-16 sm:py-24 border-b border-neutral-200">
        <div className="max-w-4xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-4">
            OUR MANIFESTO
          </div>
          <h1 className="text-4xl sm:text-6xl font-light tracking-[-0.04em] text-black leading-[1.06]">
            Mathematical certainty for <span className="font-semibold">chaotic supply chains.</span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-neutral-600 font-light leading-relaxed">
            Global freight networks lose over $1.2B annually to thermal degradation, reactive rerouting, and sub-optimal multi-modal asset utilization. CargoMind replaces heuristic dispatch with physics-informed Arrhenius kinetics and Google OR-Tools CP-SAT solvers.
          </p>
        </div>
      </div>

      {/* THE THREE CORE PILLARS (CARD-FREE 1px SPLIT GRID) */}
      <div className="mx-auto max-w-[1600px] border-b border-neutral-200">
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          
          {/* PILLAR 1 */}
          <div className="p-8 sm:p-12 space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              PILLAR 01 // OPTIMIZATION
            </div>
            <div className="flex items-center gap-3 text-black">
              <CpuIcon size={24} strokeWidth={1.5} />
              <h2 className="text-xl font-medium tracking-tight">
                Combinatorial CP-SAT
              </h2>
            </div>
            <p className="text-sm text-neutral-600 font-light leading-relaxed">
              Formulated as a Constraint Programming Satisfiability problem. Schedules crossdock dwell times, dedicated freight corridor (DFC) rail wagons, and road reefers within 15ms.
            </p>
            <div className="pt-4 border-t border-neutral-100 font-mono text-[10px] text-neutral-500">
              OPTIMALITY GAP: &lt; 0.05%
            </div>
          </div>

          {/* PILLAR 2 */}
          <div className="p-8 sm:p-12 space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              PILLAR 02 // PHYSICS KINETICS
            </div>
            <div className="flex items-center gap-3 text-black">
              <ThermometerIcon size={24} strokeWidth={1.5} />
              <h2 className="text-xl font-medium tracking-tight">
                Arrhenius Thermal Decay
              </h2>
            </div>
            <p className="text-sm text-neutral-600 font-light leading-relaxed">
              Continuous chemical reaction velocity modeling based on ambient weather, container insulation, and commodity activation energy ($E_a$). Eliminates unexpected spoilage events.
            </p>
            <div className="pt-4 border-t border-neutral-100 font-mono text-[10px] text-neutral-500">
              THERMAL DEFECT RATE: 0.02%
            </div>
          </div>

          {/* PILLAR 3 */}
          <div className="p-8 sm:p-12 space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              PILLAR 03 // AUTONOMY
            </div>
            <div className="flex items-center gap-3 text-black">
              <AiBrainIcon size={24} strokeWidth={1.5} />
              <h2 className="text-xl font-medium tracking-tight">
                Agentic Auto-Resolution
              </h2>
            </div>
            <p className="text-sm text-neutral-600 font-light leading-relaxed">
              Autonomous neural agents monitor sensor streams. When Highway delays occur, the system automatically triggers micro-adjustments, pre-cooling shifts, or intermodal transfers.
            </p>
            <div className="pt-4 border-t border-neutral-100 font-mono text-[10px] text-neutral-500">
              AUTONOMOUS REROUTING: 100% UNATTENDED
            </div>
          </div>
        </div>
      </div>

      {/* ARCHITECTURAL PIPELINE (LINEAR FLOW, NO CARDS) */}
      <div className="mx-auto max-w-[1600px] p-8 sm:p-14 border-b border-neutral-200">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
          SYSTEM BLUEPRINT
        </div>
        <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-black mb-10">
          The CargoMind End-to-End Pipeline
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 divide-neutral-100">
          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black">01. INGESTION</div>
            <div className="text-sm font-medium text-black">IoT & Satellite Telemetry</div>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              Real-time GPS coordinates, sub-zero thermistors, atmospheric humidity, and corridor traffic streams ingested via WebSocket buffers.
            </p>
          </div>

          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black">02. KINETICS</div>
            <div className="text-sm font-medium text-black">Arrhenius Degradation Layer</div>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              Calculates instant spoilage reaction coefficients $k(T)$ and dynamic shelf-life decay curves against temperature gradients.
            </p>
          </div>

          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black">03. CP-SAT SOLVER</div>
            <div className="text-sm font-medium text-black">Combinatorial Optimization</div>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              Solves multi-commodity vehicle routing, DFC train wagon assignments, and consolidation batches with guaranteed mathematical bounds.
            </p>
          </div>

          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black">04. DISPATCH</div>
            <div className="text-sm font-medium text-black">Autonomous EDI Execution</div>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              Generates electronic consignment notes, updates driver telemetry HUDs, and reserves crossdock berths without human delay.
            </p>
          </div>
        </div>
      </div>

      {/* TECHNICAL BENCHMARK TABLE (CARD-FREE SWISS TABLE) */}
      <div className="mx-auto max-w-[1600px] p-8 sm:p-14 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-6 border-b border-neutral-200 gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              BENCHMARK PERFORMANCE
            </div>
            <h3 className="text-2xl font-light tracking-tight text-black mt-1">
              Operational Metrics vs Industry Baseline
            </h3>
          </div>
          <div className="font-mono text-xs text-neutral-500">
            AUDITED Q3 2026
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[10px] tracking-wider">
                <th className="py-4 font-normal">Metric Specification</th>
                <th className="py-4 font-normal">Conventional 3PL</th>
                <th className="py-4 font-normal">CargoMind AI v3.0</th>
                <th className="py-4 font-normal text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr className="hover:bg-neutral-50/80 transition-colors">
                <td className="py-4 font-semibold text-black font-sans text-sm">
                  Average Freight Consolidation Cost
                </td>
                <td className="py-4 text-neutral-500">₹8.40 / Ton-Km</td>
                <td className="py-4 font-semibold text-black">₹5.65 / Ton-Km</td>
                <td className="py-4 text-right text-emerald-600 font-bold">-32.7%</td>
              </tr>
              <tr className="hover:bg-neutral-50/80 transition-colors">
                <td className="py-4 font-semibold text-black font-sans text-sm">
                  Cold-Chain Thermal Breach Rate
                </td>
                <td className="py-4 text-neutral-500">4.80% of loads</td>
                <td className="py-4 font-semibold text-black">0.02% of loads</td>
                <td className="py-4 text-right text-emerald-600 font-bold">-99.5%</td>
              </tr>
              <tr className="hover:bg-neutral-50/80 transition-colors">
                <td className="py-4 font-semibold text-black font-sans text-sm">
                  Optimization Dispatch Latency
                </td>
                <td className="py-4 text-neutral-500">3.5 to 6.0 Hours</td>
                <td className="py-4 font-semibold text-black">14 Milliseconds</td>
                <td className="py-4 text-right text-emerald-600 font-bold">&gt; 10,000x</td>
              </tr>
              <tr className="hover:bg-neutral-50/80 transition-colors">
                <td className="py-4 font-semibold text-black font-sans text-sm">
                  Multi-Modal Carbon Abatement
                </td>
                <td className="py-4 text-neutral-500">Baseline Road Heavy</td>
                <td className="py-4 font-semibold text-black">68% Rail DFC Shift</td>
                <td className="py-4 text-right text-emerald-600 font-bold">-44.1% CO₂</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ENTERPRISE INQUIRY FORM (Golden Suisse Style Underline Inputs + Circular Button) */}
      <div className="mx-auto max-w-[1600px] p-8 sm:p-14">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
              ENTERPRISE INTEGRATION
            </div>
            <h3 className="text-3xl sm:text-4xl font-light tracking-tight text-black leading-tight">
              Connect your fleet to <br />
              <span className="font-semibold">the CargoMind intelligence grid.</span>
            </h3>
            <p className="mt-4 text-neutral-600 font-light leading-relaxed max-w-md text-sm sm:text-base">
              Deploy our CP-SAT solvers and Arrhenius sensors across your temperature-controlled corridors. Enterprise SLA, on-premise solver deployments, and bespoke ERP integrations.
            </p>

            <div className="mt-8 font-mono text-xs text-neutral-500 space-y-2">
              <div>LOCATION: SWISS-GRADE NEURAL CLOUD</div>
              <div>API SPECS: REST / WEBSOCKET / EDI 214</div>
              <div>SECURITY: AES-256 / SOC2 TYPE II CERTIFIED</div>
            </div>
          </div>

          {/* Golden Suisse Style Underline Form */}
          <div className="pt-2">
            {submitted ? (
              <div className="p-8 border border-neutral-200 bg-neutral-50 text-center space-y-3">
                <CheckmarkCircleIcon size={32} className="mx-auto text-black" />
                <h4 className="text-lg font-medium text-black">Inquiry Transmitted</h4>
                <p className="text-xs font-mono text-neutral-500">
                  Our engineering team will calibrate a proof-of-concept for your fleet within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mark Johnson"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full swiss-input text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Enterprise Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="mark.johnson@enterprise.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full swiss-input text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Fleet Size & Reefer Units
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 150 Reefer Trucks / 12 DFC Wagons"
                    value={formData.fleetSize}
                    onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                    className="w-full swiss-input text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Specific Corridors or Objectives
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Cold-chain optimization across Western & Southern Indian freight routes..."
                    value={formData.inquiry}
                    onChange={(e) => setFormData({ ...formData, inquiry: e.target.value })}
                    className="w-full swiss-input text-sm resize-none"
                  />
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <div className="text-xs text-neutral-400 font-mono">
                    PRESS TRANSMIT TO DISPATCH INQUIRY
                  </div>

                  <button
                    type="submit"
                    className="swiss-circle-btn flex-col gap-0.5"
                    title="Transmit enterprise inquiry"
                  >
                    <span>CONNECT</span>
                    <ArrowRightIcon size={12} strokeWidth={2} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
