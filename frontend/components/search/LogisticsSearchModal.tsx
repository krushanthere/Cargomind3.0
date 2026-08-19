"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  SearchIcon,
  CloseIcon,
  RouteIcon,
  TrainIcon,
  TruckIcon,
  CubeIcon,
  AiBrainIcon,
  PulseIcon,
  ShieldCheckIcon,
  ThermometerIcon,
  SlidersIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from "../icons/Hugeicons";

interface SearchItem {
  id: string;
  category: "Consignment" | "Hub" | "Section" | "Action";
  title: string;
  subtitle: string;
  targetHref: string;
  badge?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const SEARCH_DATABASE: SearchItem[] = [
  // SECTIONS
  { id: "s-overview", category: "Section", title: "00 // Hero Portal & Kinetic Reticle", subtitle: "Live Odisha corridor telemetry & rate estimator", targetHref: "/#overview", badge: "PORTAL", icon: PulseIcon },
  { id: "s-network", category: "Section", title: "01 // National Hub Matrix & Capacity", subtitle: "Bhubaneswar Central, Cuttack, Paradeep Port & Villages A-D", targetHref: "/#network", badge: "TOPOLOGY", icon: RouteIcon },
  { id: "s-shipments", category: "Section", title: "02 // Active Consignments & Manifest", subtitle: "Live waybill ledger and rapid consignment creation", targetHref: "/#shipments", badge: "LEDGER", icon: CubeIcon },
  { id: "s-consolidation", category: "Section", title: "03 // CP-SAT Combinatorial Solver", subtitle: "Multi-modal DFC rail vs road reefer bundle optimizer", targetHref: "/#consolidation", badge: "SOLVER", icon: SlidersIcon },
  { id: "s-sensors", category: "Section", title: "04 // Arrhenius Thermal Kinetics", subtitle: "Chemical reaction velocity & real-time IoT thermistor feed", targetHref: "/#sensors", badge: "KINETICS", icon: ThermometerIcon },
  { id: "s-simulator", category: "Section", title: "05 // Disruption Stress Lab", subtitle: "Synthetic shock injection and autonomous AI mitigation", targetHref: "/#simulator", badge: "LAB", icon: ShieldCheckIcon },
  { id: "s-alerts", category: "Section", title: "06 // Real-Time Incident & Risk Alerts", subtitle: "Chronological audited log of logistics alerts", targetHref: "/#alerts", badge: "AUDIT", icon: AlertCircleIcon },
  { id: "s-ai", category: "Section", title: "AI Intelligence Suite", subtitle: "Deep neural dispatch and mathematical Pareto frontier", targetHref: "/ai-intelligence", badge: "AI CONSOLE", icon: AiBrainIcon },
  { id: "s-about", category: "Section", title: "About CargoMind Manifesto", subtitle: "Mathematical freight certainty & architecture blueprint", targetHref: "/about", badge: "MANIFESTO", icon: RouteIcon },

  // HUBS & VILLAGES
  { id: "h-bbs", category: "Hub", title: "Bhubaneswar Central Cold Hub", subtitle: "BBS-HUB // Central Multi-Temp 120T facility (-25°C / +4°C / +2°C)", targetHref: "/#network", badge: "HUB", icon: RouteIcon },
  { id: "h-va", category: "Hub", title: "Village A (Pipili Rural Cluster)", subtitle: "VIL-A // Export floriculture & betel leaves rural aggregation", targetHref: "/#network", badge: "VILLAGE", icon: RouteIcon },
  { id: "h-vb", category: "Hub", title: "Village B (Khordha Dairy Cluster)", subtitle: "VIL-B // Chilled raw milk & dairy tanker aggregation node", targetHref: "/#network", badge: "VILLAGE", icon: RouteIcon },
  { id: "h-vc", category: "Hub", title: "Village C (Nimapada Agro Belt)", subtitle: "VIL-C // Organic vegetables & traditional sweets cold-chain node", targetHref: "/#network", badge: "VILLAGE", icon: RouteIcon },
  { id: "h-vd", category: "Hub", title: "Village D (Banki Riverine Farms)", subtitle: "VIL-D // Mahanadi riverine freshwater fisheries node", targetHref: "/#network", badge: "VILLAGE", icon: RouteIcon },
  { id: "h-pdp", category: "Hub", title: "Paradeep Port Deepwater Terminal", subtitle: "PDP-PORT // Marine export gateway for black tiger prawns", targetHref: "/#network", badge: "PORT", icon: RouteIcon },
  { id: "h-ctc", category: "Hub", title: "Cuttack Crossdock Terminal", subtitle: "CTC-XDK // NH-16 Intermodal transfer crossdock (85T)", targetHref: "/#network", badge: "TERMINAL", icon: RouteIcon },
  { id: "h-puri", category: "Hub", title: "Puri Coastal Depot", subtitle: "PURI-DEPOT // Coastal fisheries storage & tourist logistics (45T)", targetHref: "/#network", badge: "DEPOT", icon: RouteIcon },

  // CONSIGNMENTS
  { id: "c-90141", category: "Consignment", title: "WB-90141 // Village A → Bhubaneswar Hub", subtitle: "Floriculture & Betel Leaves (+12.0°C) // Road Reefer // 0h 40m", targetHref: "/#shipments", badge: "IN TRANSIT", icon: TruckIcon },
  { id: "c-90142", category: "Consignment", title: "WB-90142 // Village B → Paradeep Port", subtitle: "Chilled Raw Dairy (+3.5°C) // Road Reefer // 02h 15m", targetHref: "/#shipments", badge: "IN TRANSIT", icon: TruckIcon },
  { id: "c-90143", category: "Consignment", title: "WB-90143 // Bhubaneswar → Paradeep Port", subtitle: "Black Tiger Prawns (-22.0°C) // Rail DFC // 02h 10m", targetHref: "/#shipments", badge: "IN TRANSIT", icon: TrainIcon },
  { id: "c-90144", category: "Consignment", title: "WB-90144 // Village C → Cuttack Terminal", subtitle: "Organic Vegetables (+4.0°C) // Pre-cooling Active", targetHref: "/#shipments", badge: "PRE-COOL", icon: TruckIcon },
  { id: "c-90145", category: "Consignment", title: "WB-90145 // Village D → Bhubaneswar Hub", subtitle: "Fresh Riverine Catch (+2.0°C) // Road Reefer // 0h 50m", targetHref: "/#shipments", badge: "IN TRANSIT", icon: TruckIcon },
];

interface LogisticsSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogisticsSearchModal({
  isOpen,
  onClose,
}: LogisticsSearchModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered results
  const filteredResults = SEARCH_DATABASE.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const q = query.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesQuery =
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  const handleSelect = (item: SearchItem) => {
    onClose();
    if (item.targetHref.startsWith("/#")) {
      const sectionId = item.targetHref.replace("/#", "");
      if (pathname === "/") {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        router.push(item.targetHref);
      }
    } else {
      router.push(item.targetHref);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === "Enter" && filteredResults[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredResults[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="w-full max-w-2xl bg-white border border-neutral-900 shadow-2xl overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Input Bar */}
        <div className="relative flex items-center px-5 py-4 border-b border-neutral-200">
          <SearchIcon size={18} className="text-black shrink-0 mr-3" strokeWidth={1.8} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search consignments, hubs, villages, solvers, or alerts... (e.g. Pipili, WB-90141)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-black placeholder-neutral-400 outline-none font-mono"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-neutral-400 hover:text-black transition-colors mr-2 cursor-pointer"
            >
              <CloseIcon size={14} />
            </button>
          )}
          <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-neutral-200">
            <span className="px-1.5 py-0.5 rounded bg-neutral-100 font-mono text-[9px] text-neutral-500 font-semibold uppercase">
              ESC
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-neutral-50 border-b border-neutral-200 overflow-x-auto font-mono text-[10px]">
          {["All", "Consignment", "Hub", "Section"].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-black text-white font-semibold"
                  : "text-neutral-500 hover:text-black bg-white border border-neutral-200"
              }`}
            >
              {cat}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-neutral-400 font-mono hidden sm:inline">
            {filteredResults.length} MATCHES
          </span>
        </div>

        {/* Search Results List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100">
          {filteredResults.length === 0 ? (
            <div className="p-10 text-center font-mono text-xs text-neutral-400 space-y-1">
              <div>NO MATCHES FOUND FOR &quot;{query}&quot;</div>
              <div className="text-[10px] text-neutral-400">
                Try searching for Pipili, Khordha, WB-90141, CP-SAT, or Kinetics
              </div>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors ${
                    isSelected ? "bg-neutral-100/90" : "hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-4">
                    <div className={`p-1.5 rounded-full border shrink-0 ${
                      isSelected ? "border-black bg-black text-white" : "border-neutral-200 bg-white text-neutral-600"
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-black truncate font-mono">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[8.5px] uppercase font-mono tracking-wider bg-neutral-200/70 text-neutral-700 font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-neutral-500 truncate font-sans font-light mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 font-mono text-[10px] text-neutral-400">
                    <span className="hidden sm:inline">JUMP</span>
                    <ArrowRightIcon size={12} className={isSelected ? "text-black translate-x-0.5" : "text-neutral-300"} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-neutral-50 border-t border-neutral-200 font-mono text-[9.5px] text-neutral-400">
          <div className="flex items-center gap-3">
            <span>↑↓ NAVIGATE</span>
            <span>↵ SELECT</span>
            <span>ESC CLOSE</span>
          </div>
          <div>SWISS FREIGHT DIRECTORY</div>
        </div>
      </div>
    </div>
  );
}
