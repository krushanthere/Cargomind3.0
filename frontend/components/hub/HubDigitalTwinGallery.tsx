"use client";

import React, { useState, useMemo } from "react";
import { AccordionGallery, AccordionGalleryItem } from "../ui/AccordionGallery";
import { CubeIcon, ThermometerIcon, TruckIcon, SunIcon, RouteIcon } from "../icons/Hugeicons";

export interface HubGalleryCategory {
  id: string;
  label: string;
  icon: string;
  items: AccordionGalleryItem[];
}

const HUB_IMAGE_CATEGORIES: HubGalleryCategory[] = [
  {
    id: "all",
    label: "Strategic Gateways",
    icon: "🏢",
    items: [
      {
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
        label: "Guwahati Central Multimodal Hub (Assam)",
        subtitle: "Rail container siding, Air cargo & NW-2 Brahmaputra connectivity",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80",
        label: "Siliguri Fulcrum Gateway (Chicken's Neck)",
        subtitle: "Intermodal transshipment crossdock connecting NER to Mainland India",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80",
        label: "Dibrugarh Rail Freight Terminal (Upper Assam)",
        subtitle: "Broad-gauge container logistics & tea garden aggregation",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        label: "Kolkata Maritime Port & Inland Siding",
        subtitle: "Coastal export gateway for tea, organic agro & ginger",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=1200&q=80",
        label: "Delhi NCR Mega Logistics Terminal",
        subtitle: "Dedicated Freight Corridor (DFC) temperature-controlled staging",
        link: "#network"
      }
    ]
  },
  {
    id: "cold_chain",
    label: "Cold Vaults & Pharma Chambers",
    icon: "❄️",
    items: [
      {
        image: "https://images.unsplash.com/photo-1584467741285-c54d00e1a476?auto=format&fit=crop&w=1200&q=80",
        label: "Guwahati Biotech Vaccine Vault (+2°C to +8°C)",
        subtitle: "Maternal & pediatric vaccine active thermal buffer",
        link: "#kinetics"
      },
      {
        image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
        label: "Tezpur Perishables Cold Chamber (+4°C)",
        subtitle: "Litchi, fresh horticulture & farm greens preservation",
        link: "#kinetics"
      },
      {
        image: "https://images.unsplash.com/photo-1590496793929-36417d3117de?auto=format&fit=crop&w=1200&q=80",
        label: "Mawlynnong Solar-Hybrid Cold Vault",
        subtitle: "Zero-emission solar microgrid powered cold chain",
        link: "#kinetics"
      },
      {
        image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=1200&q=80",
        label: "Jorhat Upper Assam Orthodox Tea Vault (+15°C)",
        subtitle: "Controlled relative humidity buffer for GI-tagged tea",
        link: "#kinetics"
      },
      {
        image: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
        label: "Gangtok Organic Highland Vault (-25°C Deep Freeze)",
        subtitle: "Large cardamom & high-potency ginger cold retention",
        link: "#kinetics"
      }
    ]
  },
  {
    id: "waterway",
    label: "Riverine Jetties & Berths (NW-2)",
    icon: "🚢",
    items: [
      {
        image: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80",
        label: "Pandu Inland Waterway Port (NW-2 Brahmaputra)",
        subtitle: "Multi-ton cargo barge berth & heavy crane transshipment",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1200&q=80",
        label: "Majuli Char Island Ro-Pax Ferry Terminal",
        subtitle: "Island agricultural evacuation & riverine vehicle shuttle",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
        label: "Dhubri Riverine Gateway Siding",
        subtitle: "Lower Assam inland waterway & cross-border transit",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d17?auto=format&fit=crop&w=1200&q=80",
        label: "Silchar Barak Riverine Siding",
        subtitle: "Barak Valley multimodal water-rail interface",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80",
        label: "Tezpur Koliabhomor River Siding",
        subtitle: "Inter-bank transshipment connecting North & South Assam",
        link: "#network"
      }
    ]
  },
  {
    id: "mountain",
    label: "Highland & Mountain Corridors",
    icon: "⛰️",
    items: [
      {
        image: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
        label: "Tawang High-Altitude Sela Pass Depot (3,048m)",
        subtitle: "Gradeability-certified 4x4 staging for extreme terrain",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
        label: "Shillong Ridge Transit Hub (1,525m)",
        subtitle: "Jaintia Hills Lakadong turmeric aggregation center",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
        label: "Kohima–Imphal Mountain Pass Corridor",
        subtitle: "NH-29 steep hairpin curves & bio-climatic monitoring",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        label: "Aizawl Highland Aggregation Depot (1,132m)",
        subtitle: "Mizoram mountain floriculture & dragon fruit cold staging",
        link: "#network"
      },
      {
        image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80",
        label: "Sevoke–Gangtok Teesta River Gorge Pass",
        subtitle: "Sikkim organic cardamom lifeline corridor",
        link: "#network"
      }
    ]
  }
];

export const HubDigitalTwinGallery: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const currentCategory = useMemo(() => {
    return HUB_IMAGE_CATEGORIES.find((c) => c.id === activeCategory) || HUB_IMAGE_CATEGORIES[0];
  }, [activeCategory]);

  return (
    <div className="p-6 sm:p-8 bg-white dark:bg-surface-1 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold">
              PHYSICAL HUB DIGITAL TWIN // MULTI-SECTION RECONNAISSANCE
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-900 dark:text-white mt-1">
            Northeast India Freight Nodes & Facilities
          </h3>
          <p className="text-xs font-sans text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Inspect physical yard layouts, solar-hybrid cold vaults, Brahmaputra riverine berths (NW-2), and high-altitude mountain access corridors before dispatching consignments.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {HUB_IMAGE_CATEGORIES.map((cat) => {
            const isSelected = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm scale-102"
                    : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion Gallery Component */}
      <div className="w-full">
        <AccordionGallery
          key={activeCategory}
          items={currentCategory.items}
          defaultIndex={0}
          expandRatio={0.5}
          trigger="hover"
          accentColor="#22c55e"
          overlayColor="#09090b"
          height={430}
          radius={16}
          grayscale={true}
        />
      </div>

      {/* Operational Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-surface-2 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
            14
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Multimodal Hubs</div>
            <div className="font-bold text-neutral-900 dark:text-white">Active Telemetry</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-surface-2 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
            -25°C
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Deep Freeze Vaults</div>
            <div className="font-bold text-neutral-900 dark:text-white">Bio-Pharma Active</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-surface-2 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
            NW-2
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Inland Waterways</div>
            <div className="font-bold text-neutral-900 dark:text-white">Brahmaputra Berths</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-surface-2 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
            3,048m
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Sela Pass Peak</div>
            <div className="font-bold text-neutral-900 dark:text-white">Gradeability 4x4</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubDigitalTwinGallery;
