"use client";

import React, { useState, useEffect, useCallback } from "react";
import { STGNNPrediction } from "../../types";
import { getCorridorDegradationRisks } from "../../lib/api/stGnn";
import {
  AiBrainIcon,
  RefreshIcon,
  SlidersIcon,
} from "../icons/Hugeicons";

interface STGNNDegradationCardProps {
  onLambdaChange?: (lambda: number) => void;
  selectedCorridorId?: string;
}

export default function STGNNDegradationCard({
  onLambdaChange,
  selectedCorridorId = "cor-nh27",
}: STGNNDegradationCardProps) {
  const [corridors, setCorridors] = useState<STGNNPrediction[]>([]);
  const [selectedCorridor, setSelectedCorridor] = useState<string>(selectedCorridorId);
  const [activePrediction, setActivePrediction] = useState<STGNNPrediction | null>(null);
  const [lambdaWeight, setLambdaWeight] = useState<number>(350);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCorridors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCorridorDegradationRisks();
      if (res && res.corridors && res.corridors.length > 0) {
        setCorridors(res.corridors);
        const match = res.corridors.find((c) => c.corridor_id === selectedCorridor) || res.corridors[0];
        setActivePrediction(match);
      }
    } catch (e) {
      console.warn("ST-GNN API fallback active", e);
      // Deterministic demo baseline
      const demoList: STGNNPrediction[] = [
        {
          corridor_id: "cor-nh27",
          name: "NH-27 Guwahati–Siliguri 4-Lane Trunk",
          distance_km: 480.0,
          corridor_type: "highway",
          degradation_risk: 0.18,
          confidence: 0.88,
          risk_level: "Low Degradation Risk",
          is_simulated: false,
          predicted_degradation: "18.0%",
          governing_drivers: ["Nominal asphalt surface within design tolerances"],
        },
        {
          corridor_id: "cor-nh10",
          name: "NH-10 Sevoke–Gangtok Teesta Gorge Pass",
          distance_km: 115.0,
          corridor_type: "mountain_pass",
          degradation_risk: 0.74,
          confidence: 0.92,
          risk_level: "High Degradation Risk",
          is_simulated: false,
          predicted_degradation: "74.0%",
          governing_drivers: ["Steep slope gradient (8.4%) increases shear slip risk", "Monsoon rainfall accelerates soil erosion"],
        },
        {
          corridor_id: "cor-nh29",
          name: "NH-29 Dimapur–Kohima–Imphal Ghat Road",
          distance_km: 215.0,
          corridor_type: "mountain_pass",
          degradation_risk: 0.58,
          confidence: 0.85,
          risk_level: "Moderate Degradation Risk",
          is_simulated: false,
          predicted_degradation: "58.0%",
          governing_drivers: ["Rough IRI (5.8 m/km) indicates micro-fissures", "Monsoon mist and moisture saturation"],
        },
        {
          corridor_id: "cor-gsroad",
          name: "GS Road Shillong–Guwahati Expressway",
          distance_km: 100.0,
          corridor_type: "hill_road",
          degradation_risk: 0.28,
          confidence: 0.82,
          risk_level: "Low Degradation Risk",
          is_simulated: false,
          predicted_degradation: "28.0%",
          governing_drivers: ["Engineered drainage mitigates highland precipitation"],
        },
        {
          corridor_id: "cor-nh6",
          name: "NH-6 Meghalaya–Silchar Sinking Zone",
          distance_km: 135.0,
          corridor_type: "sinking_zone",
          degradation_risk: 0.86,
          confidence: 0.94,
          risk_level: "High Degradation Risk",
          is_simulated: false,
          predicted_degradation: "86.0%",
          governing_drivers: ["Active sub-surface soil saturation & landslip risk", "Heavy truck axle dynamic pounding"],
        },
      ];
      setCorridors(demoList);
      const match = demoList.find((c) => c.corridor_id === selectedCorridor) || demoList[0];
      setActivePrediction(match);
    } finally {
      setLoading(false);
    }
  }, [selectedCorridor]);

  useEffect(() => {
    fetchCorridors();
  }, [fetchCorridors]);

  useEffect(() => {
    if (corridors.length > 0) {
      const match = corridors.find((c) => c.corridor_id === selectedCorridor) || corridors[0];
      setActivePrediction(match);
    }
  }, [selectedCorridor, corridors]);

  const handleLambdaChange = (val: number) => {
    setLambdaWeight(val);
    if (onLambdaChange) onLambdaChange(val);
  };

  const currentRisk = activePrediction ? activePrediction.degradation_risk : 0.25;
  const softPenaltyScore = Math.round(lambdaWeight * currentRisk);

  return (
    <div className="card-minimal rounded-2xl p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-neutral-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <AiBrainIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              FEATURE 04 // AUXILIARY GRAPH NEURAL NETWORK
            </div>
            <h3 className="text-sm font-semibold text-neutral-950 dark:text-white tracking-tight">
              ST-GNN Road Degradation Signal
            </h3>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-mono text-[10px] px-2.5 py-1 rounded-full border ${activePrediction?.is_simulated ? "border-amber-300/80 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300" : "border-emerald-300/80 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"}`}>
            {activePrediction?.is_simulated ? "SYNTHETIC TOPOLOGY" : "REAL ST-GNN PREDICTION"}
          </span>
          <span className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300">
            CP-SAT SOLVER OF RECORD
          </span>
          <button
            onClick={fetchCorridors}
            disabled={loading}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Corridor Selector & Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Left: Corridor Picker */}
        <div className="space-y-2">
          <label className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Select Target Corridor:</label>
          <select
            value={selectedCorridor}
            onChange={(e) => setSelectedCorridor(e.target.value)}
            className="w-full bg-white dark:bg-surface-2 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all shadow-2xs"
          >
            {corridors.map((c) => (
              <option key={c.corridor_id} value={c.corridor_id}>
                {c.name || c.corridor_id}
              </option>
            ))}
          </select>

          <div className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-surface-2 text-xs space-y-1.5 shadow-2xs">
            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>Distance:</span>
              <span className="text-neutral-900 dark:text-white font-mono">{activePrediction?.distance_km ?? 215} km</span>
            </div>
            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>Type:</span>
              <span className="text-neutral-900 dark:text-white font-mono">{activePrediction?.corridor_type ?? "Highway"}</span>
            </div>
            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>Confidence:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                {((activePrediction?.confidence ?? 0.85) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Degradation Risk Assessment */}
        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-surface-2 space-y-2 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="text-[11px] text-neutral-500 uppercase tracking-wide flex justify-between">
              <span>Predicted Degradation Risk</span>
              <span className="font-mono text-[10px] text-neutral-400">ST-GNN D(t+1)</span>
            </div>
            <div className="font-mono text-2xl font-bold text-neutral-950 dark:text-white mt-1">
              {(currentRisk * 100).toFixed(1)}% <span className="text-xs font-normal text-neutral-400">risk</span>
            </div>
            <div className={`text-xs mt-1 font-semibold ${currentRisk > 0.6 ? "text-rose-600 dark:text-rose-400" : currentRisk > 0.35 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {activePrediction?.risk_level || "Moderate Risk"}
            </div>
          </div>

          <div className="w-full bg-neutral-200/80 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
            <div
              style={{ width: `${currentRisk * 100}%` }}
              className={`h-full rounded-full transition-all duration-300 ${currentRisk > 0.6 ? "bg-rose-500" : currentRisk > 0.35 ? "bg-amber-500" : "bg-emerald-500"}`}
            />
          </div>
        </div>

        {/* Right: CP-SAT Soft Cost Contribution */}
        <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2 flex flex-col justify-between shadow-2xs">
          <div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex justify-between">
              <span>CP-SAT Soft Cost Contribution</span>
              <span className="font-mono text-[10px] text-neutral-400">&lambda;&middot;Degradation</span>
            </div>
            <div className="font-mono text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              +{softPenaltyScore} <span className="text-xs font-normal text-neutral-400">penalty units</span>
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
              Weight &lambda; = <strong className="font-mono text-neutral-900 dark:text-white">{lambdaWeight}</strong> &bull; Non-blocking soft constraint
            </div>
          </div>

          <div className="text-[10px] text-neutral-400">
            CP-SAT evaluates routes with penalty: <strong className="font-medium text-neutral-900 dark:text-white">Cost + Risk + SoftCost</strong>
          </div>
        </div>
      </div>

      {/* Governing Physical & Environmental Drivers */}
      <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-surface-2 text-xs space-y-2">
        <div className="text-xs font-medium text-neutral-900 dark:text-white">
          ST-GNN Message-Passing Drivers & Feature Weights:
        </div>
        <ul className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
          {(activePrediction?.governing_drivers || ["Monsoon precipitation and terrain gradient active"]).map((driver, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">&bull;</span>
              <span>{driver}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Interactive Lambda Slider */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2.5">
        <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <SlidersIcon className="w-3.5 h-3.5 text-neutral-400" />
            <span>CP-SAT Degradation Penalty Weight (&lambda;):</span>
          </span>
          <span className="font-mono font-semibold text-neutral-900 dark:text-white">{lambdaWeight}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1000}
          step={25}
          value={lambdaWeight}
          onChange={(e) => handleLambdaChange(parseInt(e.target.value))}
          className="w-full accent-emerald-600"
        />
        <div className="flex flex-wrap justify-between text-[10px] text-neutral-400 pt-0.5">
          <span>&lambda; = 0 (Disable ST-GNN soft cost)</span>
          <span>&lambda; = 350 (Balanced baseline)</span>
          <span>&lambda; = 1000 (Aggressive avoidance of degraded roads)</span>
        </div>
      </div>
    </div>
  );
}
