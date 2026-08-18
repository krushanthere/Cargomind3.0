"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type AlertSeverity = "critical" | "warning" | "info" | "resolved";

interface AnomalyAlert {
  id: string;
  shipmentId: string;
  corridor: string;
  tempClass: "frozen" | "chilled" | "ambient";
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  currentTempC: number;
  targetTempC: number;
  recommendedAction: string;
  resolved: boolean;
}

const INITIAL_ALERTS: AnomalyAlert[] = [
  {
    id: "ALT-9042",
    shipmentId: "CM-00892",
    corridor: "Delhi Hub ➔ Mumbai Crossdock",
    tempClass: "frozen",
    severity: "critical",
    title: "Reefer Compressor Power Excursion (+6.8°C breach)",
    description: "Container internal temperature reached -11.2°C against target -18.0°C. Arrhenius decay rate accelerated by 2.4x.",
    timestamp: "4 mins ago",
    currentTempC: -11.2,
    targetTempC: -18.0,
    recommendedAction: "Dispatch emergency mobile cryogenic chiller or reroute to Surat Cold Storage Hub (38 km away).",
    resolved: false,
  },
  {
    id: "ALT-9041",
    shipmentId: "CM-00844",
    corridor: "Hyderabad Hub ➔ Kolkata Terminal",
    tempClass: "chilled",
    severity: "critical",
    title: "Monsoon Landslide Corridor Blockage (NH-16)",
    description: "Severe waterlogging and landslide reported near Visakhapatnam bypass. Predicted transit delay +7.5 hours.",
    timestamp: "18 mins ago",
    currentTempC: 5.8,
    targetTempC: 4.0,
    recommendedAction: "Proactively shift remaining corridor leg to South Eastern Dedicated Rail Freight Corridor.",
    resolved: false,
  },
  {
    id: "ALT-9039",
    shipmentId: "CM-00781",
    corridor: "Bengaluru Cold Park ➔ Chennai Port",
    tempClass: "chilled",
    severity: "warning",
    title: "Port Gate In Congestion Exceeding 3 Hours",
    description: "Container queue delay at Chennai Harbor terminal. Reefer battery reserve at 38% capacity.",
    timestamp: "42 mins ago",
    currentTempC: 4.9,
    targetTempC: 4.0,
    recommendedAction: "Authorize priority green-channel terminal entry or plug into port reefers yard power grid.",
    resolved: false,
  },
  {
    id: "ALT-9038",
    shipmentId: "CM-00755",
    corridor: "Jaipur Center ➔ Ahmedabad Hub",
    tempClass: "frozen",
    severity: "warning",
    title: "Thermal Insulation Seal Degradation Warning",
    description: "Continuous ambient exposure (44°C) causing steady 0.4°C/hr thermal creep inside reefer unit 4B.",
    timestamp: "1 hour ago",
    currentTempC: -15.4,
    targetTempC: -18.0,
    recommendedAction: "Increase compressor sub-cooling cycle output by +20% until Ahmedabad hub arrival.",
    resolved: false,
  },
  {
    id: "ALT-9035",
    shipmentId: "CM-00690",
    corridor: "Mumbai Crossdock ➔ Pune Hub",
    tempClass: "ambient",
    severity: "info",
    title: "Optimal Multimodal Consolidation Opportunity",
    description: "3 compatible ambient shipments can be merged onto Pune Express Rail freight leg to save ₹8,400.",
    timestamp: "2 hours ago",
    currentTempC: 23.1,
    targetTempC: 22.0,
    recommendedAction: "Review CP-SAT batch consolidation plan in Optimizer workspace.",
    resolved: false,
  },
  {
    id: "ALT-9029",
    shipmentId: "CM-00512",
    corridor: "Delhi Hub ➔ Jaipur Crossdock",
    tempClass: "chilled",
    severity: "resolved",
    title: "Temperature Restabilized after Auxiliary Chiller Deployment",
    description: "Cold-chain restored to +3.8°C at Gurugram inspection checkpoint. Cargo integrity preserved.",
    timestamp: "3 hours ago",
    currentTempC: 3.8,
    targetTempC: 4.0,
    recommendedAction: "Issue compliance certificate upon final delivery.",
    resolved: true,
  },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(INITIAL_ALERTS);
  const [activeSeverity, setActiveSeverity] = useState<string>("all");
  const [selectedAlertId, setSelectedAlertId] = useState<string>("ALT-9042");
  const [actionToast, setActionToast] = useState<string | null>(null);

  const filteredAlerts = useMemo(() => {
    if (activeSeverity === "all") return alerts;
    if (activeSeverity === "resolved") return alerts.filter((a) => a.resolved);
    return alerts.filter((a) => a.severity === activeSeverity && !a.resolved);
  }, [alerts, activeSeverity]);

  const selectedAlert = useMemo(
    () => alerts.find((a) => a.id === selectedAlertId) || alerts[0],
    [alerts, selectedAlertId]
  );

  const counts = useMemo(
    () => ({
      all: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical" && !a.resolved).length,
      warning: alerts.filter((a) => a.severity === "warning" && !a.resolved).length,
      info: alerts.filter((a) => a.severity === "info" && !a.resolved).length,
      resolved: alerts.filter((a) => a.resolved).length,
    }),
    [alerts]
  );

  function handleResolveAlert(id: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true, severity: "resolved" } : a))
    );
    showToast(`Alert ${id} marked as resolved. Mitigation log updated.`);
  }

  function handleExecuteMitigation(actionText: string) {
    showToast(`Action dispatched: "${actionText}". Field telemetry updated.`);
  }

  function showToast(msg: string) {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 4500);
  }

  return (
    <main className="cargomind-grid min-h-[calc(100vh-88px)] px-6 pb-20 pt-8">
      <div className="mx-auto max-w-[1700px]">
        {/* Toast Notification */}
        {actionToast && (
          <div className="animate-fade-up fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-2xl bg-[#111216] px-5 py-3.5 text-xs font-semibold text-white shadow-2xl">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{actionToast}</span>
          </div>
        )}

        {/* Header */}
        <section className="animate-fade-up flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-rose-500" />
              </span>
              Real-Time Cold-Chain Operations Center
            </div>

            <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#111a20] sm:text-5xl">
              Active Alerts & Anomalies
            </h1>

            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-500">
              Live IoT telemetry anomaly monitoring, thermal excursion risk alerts, and 1-click mitigation controls across Indian cold-chain corridors.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/simulator"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/60 px-4 text-xs font-semibold text-slate-600 backdrop-blur-md transition-all hover:bg-white"
            >
              ⚡ Open Stress Lab Simulator
            </Link>
            <Link
              href="/consolidation"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-5 text-xs font-semibold text-white shadow-lg transition-all hover:bg-[#24252a]"
            >
              + Launch Re-Routing Batch
            </Link>
          </div>
        </section>

        {/* Filter Pills */}
        <section className="mt-7 flex flex-wrap items-center gap-2.5">
          {[
            { key: "all", label: "All Alerts", count: counts.all, color: "text-slate-700" },
            { key: "critical", label: "Critical Excursions", count: counts.critical, color: "text-rose-600 font-bold" },
            { key: "warning", label: "Warnings", count: counts.warning, color: "text-amber-600 font-semibold" },
            { key: "info", label: "Advisories", count: counts.info, color: "text-cyan-600" },
            { key: "resolved", label: "Resolved", count: counts.resolved, color: "text-emerald-600" },
          ].map((tab) => {
            const isActive = activeSeverity === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveSeverity(tab.key)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[#111216] text-white shadow-sm"
                    : "border border-white/70 bg-white/50 text-slate-600 hover:bg-white/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </section>

        {/* Main Alert Triage Workspace */}
        <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_1.3fr]">
          {/* Left: Alerts Stream */}
          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <div className="cargomind-panel rounded-[28px] p-12 text-center">
                <span className="text-3xl">🎉</span>
                <h3 className="mt-3 text-sm font-semibold text-[#111a20]">No active alerts</h3>
                <p className="mt-1 text-xs text-slate-400">All corridors operating within normal thermal and SLA envelopes.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isSelected = selectedAlert?.id === alert.id;
                const isCritical = alert.severity === "critical";
                const isWarning = alert.severity === "warning";

                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlertId(alert.id)}
                    className={`cargomind-panel cursor-pointer rounded-[24px] p-5 transition-all ${
                      isSelected
                        ? "border-slate-800 bg-white/90 shadow-md ring-1 ring-slate-800/10"
                        : "hover:bg-white/70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            alert.resolved
                              ? "bg-emerald-500"
                              : isCritical
                              ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                              : isWarning
                              ? "bg-amber-500"
                              : "bg-cyan-500"
                          }`}
                        />
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {alert.id}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-medium text-slate-600">
                          {alert.shipmentId}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            alert.resolved
                              ? "bg-emerald-100 text-emerald-800"
                              : isCritical
                              ? "bg-rose-100 text-rose-800"
                              : isWarning
                              ? "bg-amber-100 text-amber-800"
                              : "bg-cyan-100 text-cyan-800"
                          }`}
                        >
                          {alert.resolved ? "Resolved" : alert.severity}
                        </span>
                      </div>
                    </div>

                    <h3 className="mt-3 text-sm font-semibold text-[#111a20]">{alert.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {alert.description}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-200/50 pt-2.5 text-[11px] text-slate-500">
                      <span>📍 {alert.corridor}</span>
                      <span className="font-semibold text-slate-700">
                        Temp: <span className={isCritical ? "text-rose-600" : ""}>{alert.currentTempC}°C</span>{" "}
                        <span className="text-[10px] font-normal text-slate-400">(target {alert.targetTempC}°C)</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Detailed Inspection & Emergency Controls */}
          {selectedAlert && (
            <div className="space-y-5">
              {/* Alert Inspector Panel */}
              <div className="cargomind-panel-strong rounded-[28px] p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          selectedAlert.resolved
                            ? "bg-emerald-100 text-emerald-800"
                            : selectedAlert.severity === "critical"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {selectedAlert.severity}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        {selectedAlert.id}
                      </span>
                    </div>

                    <h2 className="mt-2 text-xl font-bold tracking-tight text-[#111a20]">
                      {selectedAlert.title}
                    </h2>
                  </div>

                  {!selectedAlert.resolved && (
                    <button
                      type="button"
                      onClick={() => handleResolveAlert(selectedAlert.id)}
                      className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      ✓ Mark Resolved
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs leading-6 text-slate-600">
                  {selectedAlert.description}
                </p>

                {/* Telemetry Snapshot Cards */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/60 p-3.5">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Current Reading</span>
                    <p className="mt-1 text-xl font-bold text-rose-600">{selectedAlert.currentTempC}°C</p>
                  </div>
                  <div className="rounded-2xl bg-white/60 p-3.5">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Target Envelope</span>
                    <p className="mt-1 text-xl font-bold text-slate-700">{selectedAlert.targetTempC}°C</p>
                  </div>
                  <div className="rounded-2xl bg-white/60 p-3.5">
                    <span className="text-[10px] font-semibold uppercase text-slate-400">Temp Class</span>
                    <p className="mt-1 text-xl font-bold capitalize text-slate-800">{selectedAlert.tempClass}</p>
                  </div>
                </div>

                {/* Excursion Graph Visualization (SVG) */}
                <div className="mt-6 rounded-2xl bg-white/40 p-4">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>IoT Sensor Temperature Curve (Last 6 Hours)</span>
                    <span className="text-rose-600">+{(selectedAlert.currentTempC - selectedAlert.targetTempC).toFixed(1)}°C Thermal Delta</span>
                  </div>

                  <svg viewBox="0 0 400 120" className="mt-3 h-28 w-full overflow-visible">
                    {/* Safe zone line */}
                    <line x1="0" y1="80" x2="400" y2="80" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 4" />
                    <text x="5" y="75" fill="#10b981" fontSize="9" fontWeight="600">Target Baseline ({selectedAlert.targetTempC}°C)</text>

                    {/* Excursion wave */}
                    <path
                      d="M 0 80 Q 80 80 150 70 T 260 40 T 340 25 T 400 20"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                    />

                    {/* Breach area shading */}
                    <path
                      d="M 0 80 Q 80 80 150 70 T 260 40 T 340 25 T 400 20 L 400 80 L 0 80 Z"
                      fill="rgba(244, 63, 94, 0.12)"
                    />

                    {/* Current point */}
                    <circle cx="400" cy="20" r="5" fill="#f43f5e" />
                    <circle cx="400" cy="20" r="10" fill="rgba(244, 63, 94, 0.25)" className="animate-ping" />
                  </svg>
                </div>

                {/* Recommended Mitigation & Action Hub */}
                <div className="mt-6 rounded-[24px] bg-[#111216] p-6 text-white shadow-xl">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <span>⚡</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Prescriptive Mitigation Action
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-white/80">
                    {selectedAlert.recommendedAction}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleExecuteMitigation("Emergency Mobile Cryo-Chiller Unit Dispatched")}
                      className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#111216] transition-all hover:bg-slate-100"
                    >
                      🚀 Dispatch Emergency Chiller
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExecuteMitigation("Corridor Proactive Reroute Triggered")}
                      className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20"
                    >
                      🔄 Reroute to Cold Hub
                    </button>

                    <Link
                      href={`/shipments/${selectedAlert.shipmentId}`}
                      className="rounded-xl border border-white/25 px-4 py-2 text-xs font-medium text-white/75 hover:bg-white/10"
                    >
                      View Shipment ➔
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
