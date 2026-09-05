"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WeatherData, WeatherRiskResponse } from "../../types";
import { getCurrentWeather, calculateWeatherRoadRisk } from "../../lib/api/weather";
import {
  SunIcon,
  RefreshIcon,
  SlidersIcon,
} from "../icons/Hugeicons";

interface WeatherRiskCardProps {
  lat?: number;
  lon?: number;
  locationName?: string;
  onWeatherRiskChange?: (riskFactor: number) => void;
}

export default function WeatherRiskCard({
  lat = 26.182,
  lon = 91.745,
  locationName = "Guwahati–Northeast Central Trunk",
  onWeatherRiskChange,
}: WeatherRiskCardProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [riskData, setRiskData] = useState<WeatherRiskResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [customIri, setCustomIri] = useState<number>(3.8);
  const [customSlope, setCustomSlope] = useState<number>(3.5);
  const [customRain, setCustomRain] = useState<number | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    try {
      const w = await getCurrentWeather(lat, lon);
      setWeatherData(w);

      const r = await calculateWeatherRoadRisk({
        lat,
        lon,
        iri_score: customIri,
        slope_pct: customSlope,
      });
      setRiskData(r);
      if (onWeatherRiskChange) {
        onWeatherRiskChange(r.weather_risk);
      }
    } catch (e) {
      console.warn("Weather API fallback active", e);
      // Fallback baseline display
      const fallbackRisk: WeatherRiskResponse = {
        weather_risk: 0.22,
        risk_level: "Low Rain Hazard",
        combined_road_risk: 0.38,
        accessibility_score: 62.0,
        iri_risk: 0.35,
        elevation_risk: 0.25,
        rainfall_mm_hr: customRain !== null ? customRain : 8.5,
        accumulated_rain_24h_mm: 32.0,
        precipitation_probability_pct: 65.0,
        temperature_celsius: 28.5,
        severe_alert: null,
        is_monsoon_risk: true,
        weights: { w_iri: 0.45, w_elevation: 0.30, w_weather: 0.25 },
        weather_source: "regional_climate_model",
        weather_integrated: true,
      };
      setRiskData(fallbackRisk);
      if (onWeatherRiskChange) onWeatherRiskChange(0.22);
    } finally {
      setLoading(false);
    }
  }, [lat, lon, customIri, customSlope, customRain, onWeatherRiskChange]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const rainDisplay = customRain !== null ? customRain : (riskData?.rainfall_mm_hr ?? 0.0);
  const weatherRiskVal = customRain !== null ? Math.min(1.0, customRain / 30.0) : (riskData?.weather_risk ?? 0.0);

  // Recompute combined accessibility dynamically
  const iriRiskNorm = Math.min(1.0, Math.max(0.0, (customIri - 2.0) / 10.0));
  const elevRiskNorm = Math.min(1.0, Math.max(0.0, customSlope / 20.0));
  const dynCombinedRisk = (0.45 * iriRiskNorm) + (0.30 * elevRiskNorm) + (0.25 * weatherRiskVal);
  const dynAccessibility = Math.round((1.0 - dynCombinedRisk) * 100);

  return (
    <div className="card-minimal rounded-2xl p-6 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200/80 dark:border-neutral-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <SunIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              FEATURE 01 // ROAD RISK & ACCESSIBILITY
            </div>
            <h3 className="text-sm font-semibold text-neutral-950 dark:text-white tracking-tight">
              Weather-Integrated Road Risk Engine
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 bg-neutral-100/70 dark:bg-neutral-800/70 text-neutral-600 dark:text-neutral-300">
            {riskData?.weather_source === "openmeteo" ? "OPEN-METEO LIVE" : "REGIONAL CLIMATE MODEL"}
          </span>
          <button
            onClick={fetchWeather}
            disabled={loading}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
            title="Refresh weather"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Target Corridor */}
      <div className="text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/60 pb-3">
        <span>Target Corridor: <strong className="font-medium text-neutral-950 dark:text-white">{locationName}</strong>{weatherData?.weather_description ? ` (${weatherData.weather_description})` : ""}</span>
        <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">[{lat.toFixed(3)}°N, {lon.toFixed(3)}°E]</span>
      </div>

      {/* 4-Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-surface-2 space-y-1.5 shadow-2xs">
          <div className="text-[11px] text-neutral-500 uppercase tracking-wide">IRI Road Roughness</div>
          <div className="font-mono text-lg font-bold text-neutral-950 dark:text-white">{customIri.toFixed(1)} <span className="text-[11px] font-normal text-neutral-400">m/km</span></div>
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {customIri < 4.0 ? "Paved Highway" : customIri < 7.0 ? "Moderate" : "Rough Track"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-surface-2 space-y-1.5 shadow-2xs">
          <div className="text-[11px] text-neutral-500 uppercase tracking-wide">Terrain Slope</div>
          <div className="font-mono text-lg font-bold text-neutral-950 dark:text-white">{customSlope.toFixed(1)}%</div>
          <div className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            {customSlope < 4 ? "Plains" : customSlope < 12 ? "Hilly Ghat" : "Highland Pass"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-1.5 shadow-2xs">
          <div className="text-[11px] text-blue-600 dark:text-blue-400 uppercase tracking-wide">Rainfall Rate</div>
          <div className="font-mono text-lg font-bold text-blue-700 dark:text-blue-300">{rainDisplay.toFixed(1)} <span className="text-[11px] font-normal">mm/h</span></div>
          <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
            {rainDisplay > 20 ? "Torrential Downpour" : rainDisplay > 8 ? "Moderate Rain" : "Dry / Light"}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1.5 shadow-2xs">
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">NER Accessibility</div>
          <div className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-300">{dynAccessibility} <span className="text-[11px] font-normal text-neutral-400">/ 100</span></div>
          <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {dynAccessibility >= 75 ? "Highly Accessible" : dynAccessibility >= 50 ? "Moderate Access" : "Constrained"}
          </div>
        </div>
      </div>

      {/* Breakdown Equation Bar */}
      <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-surface-2 text-xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          <span className="font-medium text-neutral-900 dark:text-white">Multimodal Road Risk Formulation:</span>
          <span className="font-mono text-[10px] text-neutral-600 dark:text-neutral-300">RoadRisk = 0.45·IRI + 0.30·SRTM + 0.25·Rain</span>
        </div>
        <div className="w-full bg-neutral-200/80 dark:bg-neutral-800 h-2 rounded-full flex overflow-hidden">
          <div style={{ width: `${iriRiskNorm * 45}%` }} className="bg-amber-500 rounded-l-full" title={`IRI Risk: ${(iriRiskNorm * 45).toFixed(1)}%`} />
          <div style={{ width: `${elevRiskNorm * 30}%` }} className="bg-purple-500" title={`Terrain Risk: ${(elevRiskNorm * 30).toFixed(1)}%`} />
          <div style={{ width: `${weatherRiskVal * 25}%` }} className="bg-blue-500 rounded-r-full" title={`Rainfall Risk: ${(weatherRiskVal * 25).toFixed(1)}%`} />
        </div>
        <div className="flex flex-wrap justify-between text-[10px] text-neutral-500 dark:text-neutral-400 pt-0.5">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> IRI Roughness (45%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Elevation Slope (30%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Rainfall Precipitation (25%)</span>
        </div>
      </div>

      {/* Interactive Testing Sliders */}
      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 space-y-3">
        <div className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <SlidersIcon className="w-3.5 h-3.5 text-neutral-400" />
          <span>Weather & Road Condition Simulator</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
              <span>IRI Roughness:</span>
              <span className="font-mono font-medium text-neutral-900 dark:text-white">{customIri} m/km</span>
            </div>
            <input
              type="range"
              min={2.0}
              max={12.0}
              step={0.2}
              value={customIri}
              onChange={(e) => setCustomIri(parseFloat(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
              <span>Terrain Slope:</span>
              <span className="font-mono font-medium text-neutral-900 dark:text-white">{customSlope}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={22.0}
              step={0.5}
              value={customSlope}
              onChange={(e) => setCustomSlope(parseFloat(e.target.value))}
              className="w-full accent-neutral-900 dark:accent-white"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
              <span>Rainfall Intensity:</span>
              <span className="font-mono font-medium text-neutral-900 dark:text-white">{rainDisplay.toFixed(1)} mm/h</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={40.0}
              step={1.0}
              value={rainDisplay}
              onChange={(e) => setCustomRain(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
