"use client";

import React, { useState, useEffect } from "react";
import { evaluateStressDecay } from "../../lib/api/sensors";
import { PINNStressAssessment } from "../../types";
import {
  ThermometerIcon,
  SlidersIcon,
} from "../icons/Hugeicons";

interface PINNStressCardProps {
  temperature?: number;
  durationHrs?: number;
  vibrationRms?: number;
  peakAcceleration?: number;
}

export default function PINNStressCard({
  temperature = 32.0,
  durationHrs = 12.0,
  vibrationRms = 1.6,
  peakAcceleration = 3.8,
}: PINNStressCardProps) {
  const [pinnData, setPinnData] = useState<PINNStressAssessment | null>(null);
  const [sliderTemp, setSliderTemp] = useState<number>(temperature);
  const [sliderVibe, setSliderVibe] = useState<number>(vibrationRms);
  const [sliderDuration, setSliderDuration] = useState<number>(durationHrs);

  useEffect(() => {
    evaluateStressDecay({
      temperature_celsius: sliderTemp,
      vibration_rms: sliderVibe > 0 ? sliderVibe : undefined,
      peak_acceleration: sliderVibe > 0 ? sliderVibe * (peakAcceleration / Math.max(0.1, vibrationRms)) : peakAcceleration,
      duration_hrs: sliderDuration,
    })
      .then((res) => setPinnData(res))
      .catch(() => {});
  }, [sliderTemp, sliderVibe, sliderDuration, peakAcceleration, vibrationRms]);

  // Baseline Arrhenius / Q10 thermal calculation for produce (+4°C nominal chilled baseline)
  const targetTemp = 4.0;
  const nominalShelfLife = 168.0; // 7 days in hours
  const tempDiff = Math.max(0, sliderTemp - targetTemp);
  const q10Factor = Math.pow(2.0, tempDiff / 10.0);
  const effectiveThermalHours = sliderDuration * q10Factor;
  const baseThermalDecay = Math.min(1.0, effectiveThermalHours / nominalShelfLife);
  const baseShelfLifePct = Math.max(0, (1.0 - baseThermalDecay) * 100);

  // Coupled final calculation with PINN stress multiplier
  const stressMultiplier = pinnData ? pinnData.stress_multiplier : 1.0;
  const finalCoupledDecay = Math.min(1.0, baseThermalDecay * stressMultiplier);
  const finalShelfLifePct = Math.max(0, Math.round((1.0 - finalCoupledDecay) * 100));

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-surface-1 p-6 space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <ThermometerIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              FEATURE 02 // COLD-CHAIN KINETICS
            </div>
            <h3 className="text-sm font-semibold text-black dark:text-white uppercase tracking-tight">
              PINN Mechanical Stress-Decay Layer
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 border border-purple-300 dark:border-purple-700 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
            ADDITIVE MULTIPLIER ON ARRHENIUS BASELINE
          </span>
        </div>
      </div>

      {/* Physics Data Flow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-surface-2 text-xs">
        {/* Step 1: Thermal Arrhenius Baseline */}
        <div className="p-4 space-y-2">
          <div className="text-[10px] text-neutral-500 uppercase flex items-center justify-between">
            <span>1. Thermal Baseline</span>
            <span className="text-neutral-400">Arrhenius / Q₁₀</span>
          </div>
          <div className="text-xl font-bold text-black dark:text-white">
            {(baseThermalDecay * 100).toFixed(1)}% <span className="text-[10px] font-normal text-neutral-400">spoilage</span>
          </div>
          <div className="text-[11px] text-neutral-500">
            Thermal Shelf-Life: <strong>{baseShelfLifePct.toFixed(1)}%</strong> ({effectiveThermalHours.toFixed(1)} eff. hrs)
          </div>
        </div>

        {/* Step 2: PINN Mechanical Stress Layer */}
        <div className="p-4 space-y-2 bg-purple-50/30 dark:bg-purple-950/20">
          <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase flex items-center justify-between">
            <span>2. PINN Stress Layer</span>
            <span className="text-purple-500">Mechanical Multiplier</span>
          </div>
          <div className="text-xl font-bold text-purple-700 dark:text-purple-300 flex items-baseline gap-2">
            <span>&times; {stressMultiplier.toFixed(2)}x</span>
            <span className="text-xs text-neutral-400 font-normal">multiplier</span>
          </div>
          <div className="text-[11px] text-neutral-500">
            Fatigue Damage: <strong>{(pinnData?.mechanical_damage ? pinnData.mechanical_damage * 100 : 0).toFixed(1)}%</strong> &bull; {pinnData?.vibration_level || "Active"}
          </div>
        </div>

        {/* Step 3: Combined Final Spoilage Risk */}
        <div className="p-4 space-y-2 bg-rose-50/30 dark:bg-rose-950/20">
          <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase flex items-center justify-between">
            <span>3. Final Coupled Risk</span>
            <span className="text-rose-500">Coupled Kinetics</span>
          </div>
          <div className="text-xl font-bold text-rose-700 dark:text-rose-300">
            {(finalCoupledDecay * 100).toFixed(1)}% <span className="text-[10px] font-normal text-neutral-400">total risk</span>
          </div>
          <div className="text-[11px] text-neutral-500">
            Remaining Usable Life: <strong className="text-rose-600 dark:text-rose-400">{finalShelfLifePct}%</strong>
          </div>
        </div>
      </div>

      {/* Physics Formula Explanation */}
      <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-surface-2 text-xs space-y-1">
        <div className="flex items-center justify-between text-[11px] text-neutral-500">
          <span className="font-semibold text-black dark:text-white">Coupled Thermal-Mechanical Kinetics:</span>
          <span className="font-mono">FinalDecay = ThermalDecay &times; (1.0 + α·RMSᵝ·[1 + γ·ΔT])</span>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          The Arrhenius/$Q_{10}$ model computes biological respiration and enzymatic decay. The PINN layer injects physical cyclic fatigue and structural bruising from road shock. When vibration telemetry is zero or disconnected, the multiplier falls back to exactly <strong className="text-black dark:text-white">1.00x</strong> (zero added decay).
        </p>
      </div>

      {/* Interactive Sliders */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
        <div className="text-[11px] font-semibold text-black dark:text-white flex items-center gap-2">
          <SlidersIcon className="w-3.5 h-3.5 text-neutral-400" />
          <span>PINN Kinetics Live Parameters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
              <span>Ambient / Container Temp:</span>
              <span className="font-mono text-black dark:text-white">{sliderTemp}°C</span>
            </div>
            <input
              type="range"
              min={10}
              max={48}
              step={1}
              value={sliderTemp}
              onChange={(e) => setSliderTemp(parseFloat(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
              <span>Accelerometer Vibration (RMS):</span>
              <span className="font-mono text-black dark:text-white">{sliderVibe.toFixed(2)} m/s²</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={4.0}
              step={0.1}
              value={sliderVibe}
              onChange={(e) => setSliderVibe(parseFloat(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
              <span>Transit Exposure Duration:</span>
              <span className="font-mono text-black dark:text-white">{sliderDuration} hrs</span>
            </div>
            <input
              type="range"
              min={1}
              max={48}
              step={1}
              value={sliderDuration}
              onChange={(e) => setSliderDuration(parseFloat(e.target.value))}
              className="w-full accent-purple-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
