"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [selectedRole, setSelectedRole] = useState<"shipper" | "carrier" | "admin">("shipper");
  const [tenantName, setTenantName] = useState<string>("ColdChain Logistics India Ltd.");
  const [frozenThreshold, setFrozenThreshold] = useState<number>(-15);
  const [chilledThreshold, setChilledThreshold] = useState<number>(6);
  const [slaBufferHours, setSlaBufferHours] = useState<number>(2.5);
  const [costWeight, setCostWeight] = useState<number>(50); // 50% cost, 50% risk
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("cargomind_tenant_role") as "shipper" | "carrier" | "admin" | null;
      if (storedRole) setSelectedRole(storedRole);
    }
  }, []);

  function handleSavePreferences() {
    if (typeof window !== "undefined") {
      localStorage.setItem("cargomind_tenant_role", selectedRole);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  }

  return (
    <main className="cargomind-grid min-h-[calc(100vh-88px)] px-6 pb-20 pt-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <section className="animate-fade-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
            <span>⚙️</span>
            System & Tenant Configuration
          </div>

          <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#111a20] sm:text-5xl">
            Platform Settings
          </h1>

          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-500">
            Configure multi-tenant access roles, temperature safety thresholds, optimization solver objective balance, and diagnostic services.
          </p>
        </section>

        {savedSuccess && (
          <div className="animate-fade-up mt-6 rounded-2xl bg-emerald-500 px-5 py-3.5 text-xs font-semibold text-white shadow-md">
            ✓ Preferences saved successfully. Active tenant context updated.
          </div>
        )}

        {/* Main Settings Sections */}
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            {/* Multi-Tenant Role Switcher */}
            <div className="cargomind-panel rounded-[28px] p-7">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Multi-Tenancy & Access Control
              </span>
              <h2 className="mt-1 text-xl font-semibold text-[#111a20]">
                Active Tenant Identity
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Switching roles demonstrates row-level isolation and commercial data masking.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  {
                    key: "shipper",
                    title: "Shipper Tenant",
                    org: "ColdChain Logistics India",
                    desc: "Full access to shipments, plans, and commercial budget caps.",
                  },
                  {
                    key: "carrier",
                    title: "Carrier Tenant",
                    org: "Indian Rail Express",
                    desc: "Operational vehicle payload access; shipper budgets are masked.",
                  },
                  {
                    key: "admin",
                    title: "Platform Admin",
                    org: "ShipMerge Global",
                    desc: "Global network oversight, telemetry, and corridor management.",
                  },
                ].map((role) => {
                  const isActive = selectedRole === role.key;
                  return (
                    <button
                      key={role.key}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role.key as any);
                        setTenantName(role.org);
                      }}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        isActive
                          ? "border-[#111216] bg-[#111216] text-white shadow-lg"
                          : "border-white/70 bg-white/40 text-slate-700 hover:bg-white/70"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{role.title}</span>
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isActive ? "bg-emerald-400" : "bg-slate-300"
                          }`}
                        />
                      </div>
                      <p className={`mt-2 text-[11px] font-medium ${isActive ? "text-white/80" : "text-slate-600"}`}>
                        {role.org}
                      </p>
                      <p className={`mt-2 text-[10px] leading-4 ${isActive ? "text-white/50" : "text-slate-400"}`}>
                        {role.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-white/50 p-4 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Simulated Header:</span>{" "}
                <code className="font-mono text-slate-800">X-Tenant-Role: {selectedRole}</code>
              </div>
            </div>

            {/* Cold-Chain Threshold Preferences */}
            <div className="cargomind-panel rounded-[28px] p-7">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Telemetry Parameters
              </span>
              <h2 className="mt-1 text-xl font-semibold text-[#111a20]">
                Thermal Anomaly Alarm Envelopes
              </h2>

              <div className="mt-6 grid grid-cols-2 gap-5">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Frozen Excursion Alarm Threshold (°C)
                  </label>
                  <p className="mb-2 text-[10px] text-slate-400">Alert if cargo rises above this temperature</p>
                  <input
                    type="number"
                    step={0.5}
                    value={frozenThreshold}
                    onChange={(e) => setFrozenThreshold(Number(e.target.value))}
                    className="h-11 w-full rounded-2xl border border-white/70 bg-white/60 px-4 text-xs font-bold text-rose-600 outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                    Chilled Excursion Alarm Threshold (°C)
                  </label>
                  <p className="mb-2 text-[10px] text-slate-400">Alert if chilled pharma/produce rises above</p>
                  <input
                    type="number"
                    step={0.5}
                    value={chilledThreshold}
                    onChange={(e) => setChilledThreshold(Number(e.target.value))}
                    className="h-11 w-full rounded-2xl border border-white/70 bg-white/60 px-4 text-xs font-bold text-amber-600 outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* SLA Lead Buffer */}
              <div className="mt-5">
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Predicted SLA Buffer Warning (Hours)
                </label>
                <input
                  type="number"
                  step={0.5}
                  value={slaBufferHours}
                  onChange={(e) => setSlaBufferHours(Number(e.target.value))}
                  className="h-11 w-full rounded-2xl border border-white/70 bg-white/60 px-4 text-xs font-bold text-slate-800 outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* CP-SAT Solver Objective Weights */}
            <div className="cargomind-panel rounded-[28px] p-7">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Optimizer Weights
              </span>
              <h2 className="mt-1 text-xl font-semibold text-[#111a20]">
                CP-SAT Pareto Objective Balancing
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Configure default multi-objective weight distribution between transport cost minimization and transit risk mitigation.
              </p>

              <div className="mt-6">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-emerald-700">Cost Focus ({costWeight}%)</span>
                  <span className="text-rose-700">Risk Mitigation ({100 - costWeight}%)</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={costWeight}
                  onChange={(e) => setCostWeight(Number(e.target.value))}
                  className="mt-3 w-full"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSavePreferences}
              className="h-12 w-full rounded-2xl bg-[#111216] text-xs font-bold text-white shadow-xl transition-all hover:bg-[#24252a]"
            >
              Save Configuration Changes
            </button>
          </div>

          {/* Right: Diagnostics & Architecture Status */}
          <div className="space-y-6">
            <div className="cargomind-panel rounded-[28px] p-7">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Infrastructure Health
              </span>
              <h3 className="mt-1 text-lg font-semibold text-[#111a20]">
                Engine Diagnostics
              </h3>

              <div className="mt-6 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                  <span className="text-slate-600">FastAPI Gateway</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Operational
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                  <span className="text-slate-600">OR-Tools CP-SAT Solver</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> v9.10 Loaded
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                  <span className="text-slate-600">XGBoost & Delay Classifier</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Trained Artifact Ready
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
                  <span className="text-slate-600">Arrhenius Q10 Kinetics</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" /> Online
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Database Connection</span>
                  <span className="font-mono text-slate-700">AsyncPG / SQLite+aiosqlite</span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] bg-[#111216] p-7 text-white shadow-xl">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Data Seeder Utility
              </span>
              <h3 className="mt-1 text-lg font-semibold">Demo Topology Seeder</h3>
              <p className="mt-2 text-xs leading-5 text-white/60">
                To populate 15 Indian logistics hubs, 50 pre-built pending shipments, and 180-day corridor performance logs, run:
              </p>
              <div className="mt-4 rounded-xl bg-black/40 p-3 font-mono text-[11px] text-emerald-300">
                python -m scripts.seed_demo_data
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
