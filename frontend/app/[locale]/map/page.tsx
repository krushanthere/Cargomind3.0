"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import CargoMindOsmMap from "../../../components/map/CargoMindOsmMap";
import { ArrowLeftIcon } from "lucide-react";

export default function OsmCommandCenterPage() {
  const locale = useLocale();

  return (
    <main className="min-h-screen bg-[#07070a] text-neutral-100 flex flex-col">
      {/* Top mini-bar for route navigation */}
      <div className="h-10 bg-[#0c0c12] border-b border-neutral-800 px-4 flex items-center justify-between font-mono text-xs z-30">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon size={14} />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-neutral-700">/</span>
          <span className="text-emerald-400 font-semibold">
            Northeast India Digital Logistics Twin (OpenStreetMap GIS)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <span className="hidden sm:inline">Real-time GPS • RoadSense IRI • Dynamic Multi-Modal Rerouting</span>
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
            LIVE ONLINE
          </span>
        </div>
      </div>

      {/* Full-bleed OSM Digital Twin */}
      <div className="flex-1 w-full h-[calc(100vh-2.5rem)] relative">
        <CargoMindOsmMap isFullScreenMode={true} />
      </div>
    </main>
  );
}
