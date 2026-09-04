"use client";

import React, { useState, useEffect } from "react";
import {
  MobileSensorCaptureEngine,
  SensorStreamState,
} from "../../lib/sensors/sensorCapture";
import { evaluateStressDecay } from "../../lib/api/sensors";
import { PINNStressAssessment } from "../../types";
import {
  PulseIcon,
} from "../icons/Hugeicons";

interface SensorCaptureCardProps {
  onVibrationUpdate?: (rms: number, peak: number, durationHrs: number) => void;
  ambientTemp?: number;
}

export default function SensorCaptureCard({
  onVibrationUpdate,
  ambientTemp = 32.0,
}: SensorCaptureCardProps) {
  const [sensorState, setSensorState] = useState<SensorStreamState>(
    MobileSensorCaptureEngine.getState()
  );
  const [pinnResult, setPinnResult] = useState<PINNStressAssessment | null>(null);
  const [activeSimulationMode, setActiveSimulationMode] = useState<"real" | "rough" | "moderate" | "smooth">("moderate");

  useEffect(() => {
    MobileSensorCaptureEngine.setWeatherTemperature(ambientTemp);
    const unsubscribe = MobileSensorCaptureEngine.subscribe((state) => {
      setSensorState(state);
      if (onVibrationUpdate && state.isRecording) {
        onVibrationUpdate(
          state.rmsAcceleration,
          state.peakAcceleration,
          state.durationSeconds / 3600.0
        );
      }
    });

    return () => unsubscribe();
  }, [ambientTemp, onVibrationUpdate]);

  // Recalculate PINN stress factor periodically or upon state change
  useEffect(() => {
    const durHrs = Math.max(0.1, sensorState.durationSeconds / 3600.0);
    evaluateStressDecay({
      temperature_celsius: ambientTemp,
      vibration_rms: sensorState.isRecording ? sensorState.rmsAcceleration : undefined,
      peak_acceleration: sensorState.isRecording ? sensorState.peakAcceleration : undefined,
      duration_hrs: durHrs,
    })
      .then((res) => setPinnResult(res))
      .catch(() => {});
  }, [sensorState.rmsAcceleration, sensorState.peakAcceleration, sensorState.durationSeconds, sensorState.isRecording, ambientTemp]);

  const handleToggleRecord = async () => {
    if (sensorState.isRecording) {
      MobileSensorCaptureEngine.stopRecording();
    } else {
      await MobileSensorCaptureEngine.startRecording(false);
    }
  };

  const handleSimulateMode = async (mode: "rough" | "moderate" | "smooth") => {
    setActiveSimulationMode(mode);
    await MobileSensorCaptureEngine.startRecording(true);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-surface-1 p-6 space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 border ${sensorState.isRecording ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-surface-2 text-neutral-500"}`}>
            <PulseIcon className={`w-4 h-4 ${sensorState.isRecording ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              FEATURE 03 // SMARTPHONE TELEMETRY
            </div>
            <h3 className="text-sm font-semibold text-black dark:text-white uppercase tracking-tight">
              Bumpy Road & Heat Sensor Tracking
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 border ${sensorState.isRecording ? "border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400" : "border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"}`}>
            {sensorState.isRecording ? (sensorState.isSimulated ? "SIMULATED SENSOR ACTIVE" : "LIVE ACCELEROMETER RECORDING") : "SENSOR IDLE"}
          </span>
          <span className="text-[10px] text-neutral-400">
            PERM: {sensorState.permissionState.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {/* RMS Vibration */}
        <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-surface-2 space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase">RMS Vibration</div>
          <div className="text-base font-bold text-black dark:text-white">
            {sensorState.rmsAcceleration.toFixed(2)} <span className="text-[10px] font-normal text-neutral-400">m/s²</span>
          </div>
          <div className="text-[10px] text-neutral-500">
            {sensorState.rmsAcceleration > 1.8 ? "High Roughness" : sensorState.rmsAcceleration > 0.8 ? "Moderate" : "Smooth Road"}
          </div>
        </div>

        {/* Peak Acceleration */}
        <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-surface-2 space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase">Peak Shock</div>
          <div className="text-base font-bold text-black dark:text-white">
            {sensorState.peakAcceleration.toFixed(2)} <span className="text-[10px] font-normal text-neutral-400">m/s²</span>
          </div>
          <div className="text-[10px] text-neutral-500">
            Max Dynamic Shock
          </div>
        </div>

        {/* Duration */}
        <div className="p-3 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-surface-2 space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase">Vibration Duration</div>
          <div className="text-base font-bold text-black dark:text-white">
            {formatTimer(sensorState.durationSeconds)}
          </div>
          <div className="text-[10px] text-neutral-500">
            {sensorState.sampleCount} samples logged
          </div>
        </div>

        {/* Heat / Temperature */}
        <div className="p-3 border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-1">
          <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase">Heat Telemetry</div>
          <div className="text-base font-bold text-amber-700 dark:text-amber-300">
            {ambientTemp.toFixed(1)}°C
          </div>
          <div className="text-[10px] text-neutral-500">
            Source: <strong className="text-black dark:text-white">Weather API</strong>
          </div>
        </div>
      </div>

      {/* Live 3-Axis & Magnitude Waveform Meter */}
      <div className="p-3.5 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-surface-2 text-xs space-y-2">
        <div className="flex justify-between items-center text-[11px] text-neutral-500">
          <span>Tri-Axial Live Acceleration:</span>
          <span className="font-mono text-black dark:text-white">
            X: {sensorState.currentX.toFixed(2)} &bull; Y: {sensorState.currentY.toFixed(2)} &bull; Z: {sensorState.currentZ.toFixed(2)} m/s²
          </span>
        </div>
        {/* Simple visual audio-level style meter */}
        <div className="flex items-end gap-1 h-8 bg-neutral-200 dark:bg-neutral-800 p-1 rounded-sm">
          {(sensorState.recentMagnitudes.length > 0 ? sensorState.recentMagnitudes : [0.2, 0.4, 0.6, 0.3, 0.5, 0.2]).map((m, idx) => {
            const pct = Math.min(100, Math.max(10, (m / 4.0) * 100));
            const barColor = m > 2.2 ? "bg-rose-500" : m > 1.0 ? "bg-amber-500" : "bg-emerald-500";
            return (
              <div
                key={idx}
                style={{ height: `${pct}%` }}
                className={`flex-1 ${barColor} transition-all duration-75`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-neutral-400">
          <span>Condition: <strong className="text-black dark:text-white">{sensorState.bumpinessLevel}</strong>{pinnResult ? ` • PINN Factor: ${pinnResult.stress_multiplier.toFixed(2)}x` : ""}</span>
          <span>Gravity Filter: Active (-9.81 m/s²)</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRecord}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              sensorState.isRecording
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
            }`}
          >
            {sensorState.isRecording ? "Stop Capture" : "Start Live Capture"}
          </button>
        </div>

        {/* Desktop Simulation Presets */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-neutral-500 text-[10px] uppercase mr-1">Simulate Road:</span>
          <button
            onClick={() => handleSimulateMode("rough")}
            className="px-2.5 py-1 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px]"
          >
            Rough / Potholes (2.4 m/s²)
          </button>
          <button
            onClick={() => handleSimulateMode("moderate")}
            className="px-2.5 py-1 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px]"
          >
            Bumpy Track (1.4 m/s²)
          </button>
          <button
            onClick={() => handleSimulateMode("smooth")}
            className="px-2.5 py-1 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[10px]"
          >
            Smooth (0.4 m/s²)
          </button>
        </div>
      </div>
    </div>
  );
}
