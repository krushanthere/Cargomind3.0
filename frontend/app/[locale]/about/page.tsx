"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  StarburstIcon,
  AiBrainIcon,
  CpuIcon,
  ShieldCheckIcon,
  PulseIcon,
  RouteIcon,
  ThermometerIcon,
  ArrowRightIcon,
  CheckmarkCircleIcon,
  SendIcon,
  SunIcon,
  LeafIcon,
} from "../../../components/icons/Hugeicons";

export default function AboutPage() {
  const t = useTranslations("about");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    fleetSize: "Local Cooperative Fleet",
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
            <span className="text-black font-semibold">{t("breadcrumb.module")}</span>
            <span>//</span>
            <span>{t("breadcrumb.subtitle")}</span>
          </div>
          <div className="font-mono text-neutral-600">{t("breadcrumb.version")}</div>
        </div>
      </div>

      {/* HERO MANIFESTO (Large Typography, Swiss Editorial) */}
      <div className="mx-auto max-w-[1600px] px-6 sm:px-10 py-16 sm:py-24 border-b border-neutral-200">
        <div className="max-w-4xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 mb-4">
            {t("hero.label")}
          </div>
          <h1 className="text-4xl sm:text-6xl font-light tracking-[-0.04em] text-black leading-[1.06]">
            {t("hero.headline")} <br />
            <span className="font-semibold">{t("hero.headlineBold")}</span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-neutral-600 font-light leading-relaxed">
            {t("hero.description")}
          </p>
        </div>
      </div>

      {/* THE THREE CORE PILLARS (CARD-FREE 1px SPLIT GRID) */}
      <div className="mx-auto max-w-[1600px] border-b border-neutral-200">
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200">
          
          {/* PILLAR 1: Dynamic Matching */}
          <div className="p-8 sm:p-12 space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              PILLAR 01 // DYNAMIC MATCHING
            </div>
            <div className="flex items-center gap-3 text-black">
              <CpuIcon size={24} strokeWidth={1.5} />
              <h2 className="text-xl font-medium tracking-tight">
                Continuous Allocation
              </h2>
            </div>
            <p className="text-sm text-neutral-600 font-light leading-relaxed">
              Dynamically matches pickups and vehicles as they appear, optimizing for urgency (critical medicines &gt; perishable produce &gt; routine goods), road conditions, vehicle payload, and cost.
            </p>
            <div className="pt-4 border-t border-neutral-100 font-mono text-[10px] text-neutral-500">
              MATCHING LATENCY: &lt; 15ms
            </div>
          </div>

          {/* PILLAR 2: Fairness & Equity */}
          <div className="p-8 sm:p-12 space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              PILLAR 02 // PROVABLE FAIRNESS
            </div>
            <div className="flex items-center gap-3 text-black">
              <ShieldCheckIcon size={24} strokeWidth={1.5} />
              <h2 className="text-xl font-medium tracking-tight">
                Starvation Prevention
              </h2>
            </div>
            <p className="text-sm text-neutral-600 font-light leading-relaxed">
              Every pickup query draws from historical community wait times. Producers with extended wait times receive automated fairness boosts (+15pts/hour) to guarantee equitable access.
            </p>
            <div className="pt-4 border-t border-neutral-100 font-mono text-[10px] text-neutral-500">
              REGIONAL FAIRNESS INDEX: 0.96
            </div>
          </div>

          {/* PILLAR 3: Offline-First Reliability */}
          <div className="p-8 sm:p-12 space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
              PILLAR 03 // OFFLINE RESILIENCE
            </div>
            <div className="flex items-center gap-3 text-black">
              <AiBrainIcon size={24} strokeWidth={1.5} />
              <h2 className="text-xl font-medium tracking-tight">
                Store-and-Forward Sync
              </h2>
            </div>
            <p className="text-sm text-neutral-600 font-light leading-relaxed">
              Field agents and drivers can register shipments, log road hazards, and record temperature telemetry completely offline with automatic conflict-free synchronization upon reconnection.
            </p>
            <div className="pt-4 border-t border-neutral-100 font-mono text-[10px] text-neutral-500">
              IDEMPOTENT SYNC: CLIENT-ID BACKED
            </div>
          </div>
        </div>
      </div>

      {/* ARCHITECTURAL PIPELINE (LINEAR FLOW, NO CARDS) */}
      <div className="mx-auto max-w-[1600px] p-8 sm:p-14 border-b border-neutral-200">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
          SYSTEM ARCHITECTURE
        </div>
        <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-black mb-10">
          The Rural Last-Mile Dispatch Architecture
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 divide-neutral-100">
          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black">01. COMMUNITY NODES</div>
            <div className="text-sm font-medium text-black">Village Aggregation Points</div>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              Producers drop produce and health sub-centres queue vaccines at solar-powered aggregation points and decentralized cold stores.
            </p>
          </div>

          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black">02. TERRAIN SURVEILLANCE</div>
            <div className="text-sm font-medium text-black">Road Condition Feeds</div>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              Real-time terrain monitoring tracks unpaved mud tracks, seasonal washouts, and flood hazards to select capable vehicles.
            </p>
          </div>

          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black">03. MULTI-OBJECTIVE SOLVER</div>
            <div className="text-sm font-medium text-black">Urgency & Fairness Optimization</div>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              CP-SAT solver matches pickups to available tempos, tractors, autos, and motorbikes with hard cold-chain validation for medicines.
            </p>
          </div>

          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black">04. TRANSPARENT AUDIT</div>
            <div className="text-sm font-medium text-black">Explainable Allocation Feed</div>
            <p className="text-xs text-neutral-500 leading-relaxed font-light">
              Publishes plain-language rationales for every match and logs community wait-time metrics for cooperative oversight.
            </p>
          </div>
        </div>
      </div>

      {/* COOPERATIVE & NGO INQUIRY FORM */}
      <div className="mx-auto max-w-[1600px] p-8 sm:p-14">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
              COMMUNITY DEPLOYMENT
            </div>
            <h3 className="text-3xl sm:text-4xl font-light tracking-tight text-black leading-tight">
              Connect your farmer cooperative or health network <br />
              <span className="font-semibold">to CargoMind.</span>
            </h3>
            <p className="mt-4 text-neutral-600 font-light leading-relaxed max-w-md text-sm sm:text-base">
              Deploy our decentralized dispatch algorithms and solar cold-chain sensors across your rural block or district. Compatible with lightweight mobile devices and offline field tablets.
            </p>

            <div className="mt-8 font-mono text-xs text-neutral-500 space-y-2">
              <div>PROTOCOL: OFFLINE-FIRST REST / JSON-RPC</div>
              <div>DEPLOYMENT: EDGE TABLET / SOLAR GATEWAY</div>
              <div>OPEN GOVERNANCE: AUDITABLE FAIRNESS METRICS</div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="pt-2">
            {submitted ? (
              <div className="p-8 border border-neutral-200 bg-neutral-50 text-center space-y-3">
                <CheckmarkCircleIcon size={32} className="mx-auto text-black" />
                <h4 className="text-lg font-medium text-black">Deployment Request Received</h4>
                <p className="text-xs font-mono text-neutral-500">
                  Our rural logistics engineering team will calibrate node topology for your district.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Contact Name / Organization
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maa Mangala Farmers Cooperative"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full swiss-input text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Email / Contact
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contact@ruralcoop.org"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full swiss-input text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    Rural Cluster / District
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 14 villages in Khordha/Puri belt with solar cold stores and 12 local tempos..."
                    value={formData.inquiry}
                    onChange={(e) => setFormData({ ...formData, inquiry: e.target.value })}
                    className="w-full swiss-input text-sm resize-none"
                  />
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <div className="text-xs text-neutral-400 font-mono">
                    TRANSMIT COOPERATIVE REQUEST
                  </div>

                  <button
                    type="submit"
                    className="swiss-circle-btn flex-col gap-0.5"
                    title="Transmit request"
                  >
                    <span>SUBMIT</span>
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
