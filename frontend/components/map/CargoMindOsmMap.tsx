"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  OSM_NER_STATES_DATA,
  OSM_LOGISTICS_HUBS,
  OSM_RURAL_CLUSTERS,
  OSM_LOGISTICS_CORRIDORS,
  OSM_DISASTER_RISK_ZONES,
  OSM_FLEET_VEHICLES,
  OSM_RETURN_LOAD_OPPORTUNITIES,
  OSM_ESSENTIAL_POIS,
  OsmLogisticsHub,
  OsmVehicleTelemetry,
  OsmEssentialPoi,
} from "./data/nerOsmLogisticsData";

// Safe dynamic Leaflet types
type LeafletMap = any;
type LeafletLayerGroup = any;

// Tile Provider URLs (Free, no API key required)
const TILE_URLS: Record<string, string> = {
  carto_light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  osm_standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

const TILE_ATTRIBUTIONS: Record<string, string> = {
  carto_light: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  osm_standard: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
};

// SIH Guided Tour Steps
const TOUR_STEPS = [
  {
    title: "1. The Mainland & Siliguri 'Chicken's Neck' Gateway",
    center: [26.7271, 88.3953] as [number, number],
    zoom: 9,
    narration:
      "All rail, road, and utility lifelines connecting mainland India (Delhi, Kolkata, Patna) to the 8 North Eastern states must pass through the narrow 22-km Siliguri Corridor. CargoMind operates an active pre-clearance buffer and multi-modal transfer terminal here to prevent regional supply choking.",
    highlight: "Siliguri Gateway & NH-27 Arterial Entry",
  },
  {
    title: "2. Guwahati Primary NER Multimodal Mega-Hub",
    center: [26.1445, 91.7362] as [number, number],
    zoom: 10,
    narration:
      "Guwahati acts as the beating heart of NER freight distribution. It unites NH-27 road freight, Broad Gauge Railway, the Brahmaputra NW-2 Inland Waterway terminal at Pandu Port, and Lokpriya Gopinath Bordoloi Air Cargo.",
    highlight: "Guwahati Hub (Road + Rail + Inland Waterway + Air)",
  },
  {
    title: "3. 8 State Capital Hubs & Critical Mountain Passes",
    center: [25.5788, 91.8933] as [number, number], // Shillong
    zoom: 8,
    narration:
      "From Guwahati, high-capacity corridors branch out across severe elevations to Itanagar, Shillong, Imphal, Aizawl, Kohima, Agartala, and Gangtok. Our digital twin tracks road slope gradients, bridge load capacities, and monsoon susceptibility in real time.",
    highlight: "8 State Capital Hubs & Highway Spines",
  },
  {
    title: "4. 186 Rural Logistics Clusters & PHC Health Clinic Access",
    center: [25.467, 92.35] as [number, number], // Jaintia / Lakadong
    zoom: 9,
    narration:
      "CargoMind goes beyond capital cities to map 186 remote village clusters (e.g. Lakadong Turmeric, Majuli River Island, Ziro Organic Kiwi, Mizo Hill Oranges). Each cluster features an AI Accessibility Index factoring in RoadSense IRI road roughness, elevation, and clinic vaccine demands.",
    highlight: "186 Deep Rural Logistics Clusters",
  },
  {
    title: "5. Active Disaster Alerts & Autonomous AI Dynamic Rerouting",
    center: [25.15, 92.42] as [number, number], // Sonapur landslide
    zoom: 10,
    narration:
      "When severe landslides block critical lifelines like NH-6 Sonapur or flash floods submerge Majuli, the CargoMind AI Engine dynamically reroutes perishable freight onto alternate hill rail corridors (Lumding-Badarpur) or inland waterways, saving up to 48 hours of spoilage.",
    highlight: "Sonapur Landslide Zone & AI Detour Engine",
  },
  {
    title: "6. Circular Backhaul Matching (Zero-Deadhead Return Trips)",
    center: [26.5, 92.3] as [number, number],
    zoom: 8,
    narration:
      "Historically, 64% of trucks returning from remote NER hill stations run empty. CargoMind pairs empty return legs with high-value agricultural cooperatives (FPOs) and artisanal handlooms, cutting deadhead freight costs by 38% and saving over 40 tons of CO2 monthly.",
    highlight: "Circular Backhauls & Return Load Optimization",
  },
];

interface CargoMindOsmMapProps {
  selectedHubId?: string;
  onSelectHub?: (hub: OsmLogisticsHub) => void;
  className?: string;
  isFullScreenMode?: boolean;
}

export default function CargoMindOsmMap({
  selectedHubId,
  onSelectHub,
  className = "",
  isFullScreenMode = false,
}: CargoMindOsmMapProps) {
  // DOM Container Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const leafletLibRef = useRef<any>(null);

  // Layer Group Refs
  const hubsGroupRef = useRef<LeafletLayerGroup | null>(null);
  const clustersGroupRef = useRef<LeafletLayerGroup | null>(null);
  const corridorsGroupRef = useRef<LeafletLayerGroup | null>(null);
  const risksGroupRef = useRef<LeafletLayerGroup | null>(null);
  const fleetGroupRef = useRef<LeafletLayerGroup | null>(null);
  const backhaulsGroupRef = useRef<LeafletLayerGroup | null>(null);
  const poisGroupRef = useRef<LeafletLayerGroup | null>(null);
  const baseTileLayerRef = useRef<any>(null);

  // State Management - Default to clean light Swiss tile theme
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [mapLoading, setMapLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState<number>(0);
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedTier] = useState<string>("all");
  const [selectedMode] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "topology" | "clusters" | "corridors" | "risks" | "fleet" | "backhaul" | "pois"
  >("topology");
  const [tileProvider, setTileProvider] = useState<
    "carto_light" | "osm_standard" | "satellite"
  >("carto_light");

  // Layer Visibility Toggles
  const [showHubs, setShowHubs] = useState<boolean>(true);
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [showCorridors, setShowCorridors] = useState<boolean>(true);
  const [showRisks, setShowRisks] = useState<boolean>(true);
  const [showFleet, setShowFleet] = useState<boolean>(true);
  const [showBackhauls, setShowBackhauls] = useState<boolean>(true);
  const [showPois, setShowPois] = useState<boolean>(true);

  // Selection & Telemetry State
  const [selectedEntity, setSelectedEntity] = useState<{
    type: "hub" | "cluster" | "corridor" | "risk" | "vehicle" | "backhaul" | "poi";
    data: any;
  } | null>(null);

  // SIH Guided Tour State
  const [tourActive, setTourActive] = useState<boolean>(false);
  const [tourStep, setTourStep] = useState<number>(0);

  // Animated Fleet Positions (interpolated along waypoints)
  const [fleetVehicles, setFleetVehicles] = useState<OsmVehicleTelemetry[]>(
    OSM_FLEET_VEHICLES
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [waypointIndices, setWaypointIndices] = useState<Record<string, number>>({});

  // Live Metric Aggregates
  const totalHubsCount = OSM_LOGISTICS_HUBS.length;
  const totalClustersCount = OSM_RURAL_CLUSTERS.length;
  const activeDisasterCount = OSM_DISASTER_RISK_ZONES.filter(
    (z) => z.severity === "high" || z.severity === "critical"
  ).length;
  const avgAccessibility = Math.round(
    OSM_RURAL_CLUSTERS.reduce((acc, c) => acc + c.accessibilityScore, 0) /
      OSM_RURAL_CLUSTERS.length
  );

  const retryInitMap = useCallback(() => {
    setMapError(null);
    setMapLoading(true);
    setRetryNonce((n) => n + 1);
  }, []);

  // ---------------------------------------------------------------------------
  // 1. Initialize Leaflet Map (SSR Safe with Robust Lifecycle)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const handleResize = () => {
      if (mapInstanceRef.current && mapInstanceRef.current.invalidateSize) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    window.addEventListener("resize", handleResize);

    // Attach ResizeObserver to container element for layout changes
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    async function initMap() {
      if (!mapContainerRef.current) return;

      // Clean up any dangling Leaflet internal state on container
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }

      setMapLoading(true);
      setMapError(null);

      try {
        const L = await import("leaflet");
        leafletLibRef.current = L;

        if (!isMounted || !mapContainerRef.current) return;

        // Fix default Leaflet icon paths in bundlers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        // Default center: Northeast India command perspective
        const map = L.map(mapContainerRef.current, {
          center: [26.2, 92.5],
          zoom: 7,
          minZoom: 5,
          maxZoom: 18,
          zoomControl: false,
          attributionControl: true,
        });

        // Position Zoom Controls on bottom-right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Base Tile Layer (Clean light Positron default)
        const activeTileUrl = TILE_URLS[tileProvider] || TILE_URLS.carto_light;
        const activeAttribution = TILE_ATTRIBUTIONS[tileProvider] || TILE_ATTRIBUTIONS.carto_light;

        const baseTile = L.tileLayer(activeTileUrl, {
          attribution: activeAttribution,
          maxZoom: 19,
          subdomains: "abcd",
        }).addTo(map);

        baseTileLayerRef.current = baseTile;

        // Create Layer Groups
        corridorsGroupRef.current = L.layerGroup().addTo(map);
        backhaulsGroupRef.current = L.layerGroup().addTo(map);
        risksGroupRef.current = L.layerGroup().addTo(map);
        clustersGroupRef.current = L.layerGroup().addTo(map);
        hubsGroupRef.current = L.layerGroup().addTo(map);
        fleetGroupRef.current = L.layerGroup().addTo(map);
        poisGroupRef.current = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        setMapReady(true);
        setMapLoading(false);

        setTimeout(() => {
          if (map && map.invalidateSize) {
            map.invalidateSize();
          }
        }, 250);
      } catch (err: any) {
        console.error("Failed to initialize Leaflet GIS map:", err);
        if (isMounted) {
          setMapError(err?.message || "Failed to initialize OpenStreetMap GIS container.");
          setMapLoading(false);
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {}
        mapInstanceRef.current = null;
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, [retryNonce]);

  // ---------------------------------------------------------------------------
  // 2. Handle Tile Provider Switching
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const map = mapInstanceRef.current;

    map.removeLayer(baseTileLayerRef.current);
    const activeTileUrl = TILE_URLS[tileProvider] || TILE_URLS.carto_light;
    const activeAttribution = TILE_ATTRIBUTIONS[tileProvider] || TILE_ATTRIBUTIONS.carto_light;

    const newBaseTile = L.tileLayer(activeTileUrl, {
      attribution: activeAttribution,
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    baseTileLayerRef.current = newBaseTile;
  }, [tileProvider]);

  // ---------------------------------------------------------------------------
  // 3. Filtered Datasets
  // ---------------------------------------------------------------------------
  const filteredHubs = useMemo(() => {
    return OSM_LOGISTICS_HUBS.filter((hub) => {
      if (selectedState !== "all") {
        if (selectedState === "siliguri_corridor" && !hub.isSiliguri) return false;
        if (selectedState !== "siliguri_corridor" && hub.state.toLowerCase() !== selectedState.toLowerCase() && !hub.isGuwahati) {
          return false;
        }
      }
      if (selectedTier !== "all") {
        if (selectedTier === "gateways" && hub.tier !== "mainland_gateway" && hub.tier !== "siliguri_gateway") return false;
        if (selectedTier === "state_hubs" && hub.tier !== "state_hub" && hub.tier !== "primary_ner_hub") return false;
        if (selectedTier === "regional_hubs" && hub.tier !== "regional_district_hub") return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          hub.name.toLowerCase().includes(q) ||
          hub.code.toLowerCase().includes(q) ||
          hub.state.toLowerCase().includes(q) ||
          hub.roleTag.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedState, selectedTier, searchQuery]);

  const filteredClusters = useMemo(() => {
    return OSM_RURAL_CLUSTERS.filter((cluster) => {
      if (selectedState !== "all" && selectedState !== "siliguri_corridor") {
        if (cluster.state.toLowerCase() !== selectedState.toLowerCase()) return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          cluster.name.toLowerCase().includes(q) ||
          cluster.district.toLowerCase().includes(q) ||
          cluster.primaryCommodity.toLowerCase().includes(q) ||
          cluster.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedState, searchQuery]);

  const filteredCorridors = useMemo(() => {
    return OSM_LOGISTICS_CORRIDORS.filter((corridor) => {
      if (selectedMode !== "all" && corridor.mode !== selectedMode) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          corridor.name.toLowerCase().includes(q) ||
          corridor.fromHubId.toLowerCase().includes(q) ||
          corridor.toHubId.toLowerCase().includes(q) ||
          corridor.weatherCondition.toLowerCase().includes(q)
        );
      }
      if (selectedState !== "all" && selectedState !== "siliguri_corridor") {
        const fromHub = OSM_LOGISTICS_HUBS.find((h) => h.id === corridor.fromHubId);
        const toHub = OSM_LOGISTICS_HUBS.find((h) => h.id === corridor.toHubId);
        if (fromHub?.state.toLowerCase() !== selectedState.toLowerCase() && toHub?.state.toLowerCase() !== selectedState.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [selectedMode, selectedState, searchQuery]);

  const filteredPois = useMemo(() => {
    return OSM_ESSENTIAL_POIS.filter((poi) => {
      if (selectedState !== "all" && selectedState !== "siliguri_corridor") {
        if (poi.state.toLowerCase() !== selectedState.toLowerCase()) return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        return (
          poi.name.toLowerCase().includes(q) ||
          poi.district.toLowerCase().includes(q) ||
          poi.categoryLabel.toLowerCase().includes(q) ||
          poi.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [selectedState, searchQuery]);

  // ---------------------------------------------------------------------------
  // 4. Render Corridors Layer (Restrained Palette & Clean Lines)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !corridorsGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = corridorsGroupRef.current;
    group.clearLayers();

    if (!showCorridors) return;

    filteredCorridors.forEach((corridor) => {
      // Default: Clean muted dark gray solid line for road
      let strokeColor = "#27272a";
      let weight = 1.5;
      let dashArray: string | undefined = undefined;
      let opacity = 0.8;

      if (corridor.status === "blocked_critical") {
        strokeColor = "#ef4444"; // Red accent for critical disruption
        weight = 2;
        opacity = 0.95;
      } else if (corridor.status === "moderate_risk") {
        strokeColor = "#d97706"; // Amber accent for warning
        weight = 1.5;
        opacity = 0.85;
      }

      if (corridor.mode === "rail") {
        strokeColor = "#52525b"; // Muted dark gray
        dashArray = "4, 6";
        weight = 1.5;
      } else if (corridor.mode === "waterway") {
        strokeColor = "#2563eb"; // Blue accent for waterways
        dashArray = "6, 6";
        weight = 1.5;
      } else if (corridor.mode === "air") {
        strokeColor = "#a1a1aa";
        dashArray = "3, 4";
        weight = 1;
        opacity = 0.6;
      }

      const polyline = L.polyline(corridor.coordinates, {
        color: strokeColor,
        weight,
        opacity,
        dashArray,
        lineCap: "round",
        lineJoin: "round",
      });

      polyline.bindTooltip(
        `<div class="p-1 text-xs font-mono">
          <div class="font-bold uppercase tracking-wider text-[10px] text-neutral-500">${corridor.id.toUpperCase()} • ${corridor.mode.toUpperCase()}</div>
          <div class="text-neutral-900 font-semibold text-xs">${corridor.name}</div>
          <div class="text-[10px] text-neutral-600 mt-1">Status: <span class="${
            corridor.status === "blocked_critical" ? "text-red-600 font-bold" : corridor.status === "moderate_risk" ? "text-amber-600 font-semibold" : "text-neutral-900"
          }">${corridor.status.replace("_", " ").toUpperCase()}</span> • ETA: ${corridor.currentEtaHours}h</div>
          <div class="text-[9px] text-neutral-500">${corridor.distanceKm} km • Gradient: ${corridor.gradientPct}% • IRI: ${corridor.roadRoughnessIRI}</div>
        </div>`,
        { sticky: true }
      );

      polyline.on("click", () => {
        setSelectedEntity({ type: "corridor", data: corridor });
      });

      group.addLayer(polyline);
    });
  }, [mapReady, filteredCorridors, showCorridors]);

  // ---------------------------------------------------------------------------
  // 5. Render Disaster Risk Zones Layer (Subtle Outline & Minimal Alert Mark)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !risksGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = risksGroupRef.current;
    group.clearLayers();

    if (!showRisks) return;

    OSM_DISASTER_RISK_ZONES.forEach((risk) => {
      const isCritical = risk.severity === "critical";
      const color = "#ef4444";

      // Subtle light red dashed perimeter
      const circle = L.circle([risk.lat, risk.lng], {
        radius: risk.radiusMeters,
        color: color,
        fillColor: color,
        fillOpacity: 0.08,
        weight: 1.2,
        dashArray: "3, 3",
      });

      // Minimal alert marker: crisp white dot with red outline, no heavy always-on floating labels
      const riskIcon = L.divIcon({
        className: "custom-risk-icon",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-4 h-4 rounded-full border border-red-500 bg-white flex items-center justify-center text-red-600 text-[9px] font-mono font-bold shadow-xs">
              !
            </div>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([risk.lat, risk.lng], { icon: riskIcon });

      marker.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="flex items-center gap-1.5 mb-1">
            <span class="border border-red-500 text-red-600 bg-white text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded">
              ${risk.name.split(" ")[0]} ALERT
            </span>
            <span class="text-neutral-500 text-[10px] uppercase">${risk.severity}</span>
          </div>
          <div class="text-neutral-900 font-semibold">${risk.name}</div>
          <div class="text-neutral-600 text-[10px] mt-1">${risk.impactSummary}</div>
          <div class="text-neutral-500 text-[10px] mt-0.5">Location: ${risk.locationDescription} (${risk.state})</div>
          <div class="text-neutral-800 text-[10px] mt-1 font-semibold">Detour: ${risk.aiRerouteRecommendation}</div>
        </div>`,
        { sticky: true }
      );

      marker.on("click", () => {
        setSelectedEntity({ type: "risk", data: risk });
      });

      group.addLayer(circle);
      group.addLayer(marker);
    });
  }, [mapReady, showRisks]);

  // ---------------------------------------------------------------------------
  // 6. Render Logistics Hubs (Simplified Swiss Markers, No Floating Text Clutter)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !hubsGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = hubsGroupRef.current;
    group.clearLayers();

    if (!showHubs) return;

    filteredHubs.forEach((hub) => {
      let markerHtml = "";
      let iconSize: [number, number] = [16, 16];
      let iconAnchor: [number, number] = [8, 8];

      if (hub.isGuwahati) {
        // Guwahati: Primary Mega-Hub — Crisp black dot with subtle outer ring
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-5 h-5 rounded-full border border-neutral-900/30"></div>
            <div class="w-2.5 h-2.5 rounded-full bg-neutral-950 border border-white shadow-xs"></div>
          </div>
        `;
        iconSize = [20, 20];
        iconAnchor = [10, 10];
      } else if (hub.isSiliguri) {
        // Siliguri: Mainland Gateway Fulcrum — Crisp dark square/diamond
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-4.5 h-4.5 rotate-45 border border-neutral-900/30"></div>
            <div class="w-2.5 h-2.5 rotate-45 bg-neutral-900 border border-white shadow-xs"></div>
          </div>
        `;
        iconSize = [18, 18];
        iconAnchor = [9, 9];
      } else if (hub.tier === "state_hub") {
        // State Capital Hubs — Clean solid dark circle
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-white shadow-xs hover:scale-125 transition-transform"></div>
          </div>
        `;
        iconSize = [14, 14];
        iconAnchor = [7, 7];
      } else {
        // Regional Hubs / Mainland Gateways — Small solid dark dot
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-2 h-2 rounded-full bg-neutral-700 border border-white shadow-xs hover:scale-125 transition-transform"></div>
          </div>
        `;
        iconSize = [12, 12];
        iconAnchor = [6, 6];
      }

      const hubIcon = L.divIcon({
        className: "custom-hub-marker",
        html: markerHtml,
        iconSize,
        iconAnchor,
      });

      const marker = L.marker([hub.lat, hub.lng], { icon: hubIcon });

      // Clean tooltip showing on hover only
      marker.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">${hub.tier.replace("_", " ")} • ${hub.state}</div>
          <div class="text-neutral-900 font-semibold text-xs mt-0.5">${hub.name} (${hub.code})</div>
          <div class="text-neutral-600 text-[10px] mt-0.5">${hub.roleTag}</div>
          <div class="text-neutral-500 text-[9px] mt-1">Elev: ${hub.elevation_m}m | Docks: ${hub.activeDocks} | Cap: ${(hub.capacityKg / 1000).toFixed(0)}T (${Math.round((hub.usedKg / hub.capacityKg) * 100)}% Used)</div>
          <div class="flex gap-1 mt-1 text-[8px]">
            ${hub.capabilities.road ? '<span class="bg-neutral-100 text-neutral-800 border border-neutral-300 px-1 py-0.5 rounded">Road</span>' : ""}
            ${hub.capabilities.rail ? '<span class="bg-neutral-100 text-neutral-800 border border-neutral-300 px-1 py-0.5 rounded">Rail</span>' : ""}
            ${hub.capabilities.inland_waterway ? '<span class="bg-neutral-100 text-neutral-800 border border-neutral-300 px-1 py-0.5 rounded">NW-2</span>' : ""}
            ${hub.capabilities.air ? '<span class="bg-neutral-100 text-neutral-800 border border-neutral-300 px-1 py-0.5 rounded">Air</span>' : ""}
            ${hub.capabilities.cold_storage ? '<span class="bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.5 rounded">Reefer</span>' : ""}
          </div>
        </div>`,
        { sticky: true }
      );

      marker.on("click", () => {
        setSelectedEntity({ type: "hub", data: hub });
        if (onSelectHub) onSelectHub(hub);
      });

      group.addLayer(marker);
    });
  }, [mapReady, filteredHubs, showHubs, onSelectHub]);

  // ---------------------------------------------------------------------------
  // 7. Render Rural Logistics Clusters (Clean Minimal Dots, No Floating Text)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !clustersGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = clustersGroupRef.current;
    group.clearLayers();

    if (!showClusters) return;

    filteredClusters.forEach((cluster) => {
      const isLowAccess = cluster.accessibilityScore < 50;

      const clusterIcon = L.divIcon({
        className: "custom-cluster-marker",
        html: `
          <div class="relative flex items-center justify-center group cursor-pointer">
            <div class="w-1.5 h-1.5 rounded-full ${
              isLowAccess ? "bg-red-600 ring-2 ring-red-100" : "bg-neutral-600"
            }"></div>
          </div>
        `,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      });

      const marker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon });

      marker.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="flex justify-between items-center text-[9px] text-neutral-500">
            <span>${cluster.district}, ${cluster.state}</span>
            <span class="font-bold ${cluster.accessibilityScore < 50 ? "text-red-600" : "text-neutral-900"}">
              Score: ${cluster.accessibilityScore}/100
            </span>
          </div>
          <div class="text-neutral-900 font-bold text-xs mt-0.5">${cluster.name}</div>
          <div class="text-neutral-700 text-[10px] mt-0.5">Produce: ${cluster.primaryCommodity} (${cluster.weeklyAgroOutputTons} T/wk)</div>
          <div class="text-neutral-500 text-[9px] mt-0.5">Elev: ${cluster.elevation_m}m • IRI: ${cluster.roadSenseIRI} • Clinics: ${cluster.healthCentresCount}</div>
        </div>`,
        { sticky: true }
      );

      marker.on("click", () => {
        setSelectedEntity({ type: "cluster", data: cluster });
      });

      group.addLayer(marker);
    });
  }, [mapReady, filteredClusters, showClusters]);

  // ---------------------------------------------------------------------------
  // 8. Render Return-Load Opportunities Layer (Backhauls)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !backhaulsGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = backhaulsGroupRef.current;
    group.clearLayers();

    if (!showBackhauls) return;

    OSM_RETURN_LOAD_OPPORTUNITIES.forEach((opp) => {
      const circle = L.circle([opp.lat, opp.lng], {
        radius: 6000,
        color: "#18181b",
        weight: 1,
        fillColor: "#18181b",
        fillOpacity: 0.03,
        dashArray: "3, 5",
      });

      circle.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="text-neutral-500 font-bold uppercase tracking-wider text-[9px]">CIRCULAR BACKHAUL</div>
          <div class="text-neutral-900 font-semibold">${opp.availableReturnCargo}</div>
          <div class="text-neutral-600 text-[10px] mt-0.5">${opp.destinationLocation} &rarr; ${opp.targetDestination}</div>
          <div class="text-neutral-900 text-[10px] mt-1 font-semibold">Savings: &#8377;${opp.fuelCostSavingsInr.toLocaleString("en-US")} • -${opp.co2ReductionKg}kg CO2</div>
        </div>`,
        { sticky: true }
      );

      circle.on("click", () => {
        setSelectedEntity({ type: "backhaul", data: opp });
      });

      group.addLayer(circle);
    });
  }, [mapReady, showBackhauls]);

  // ---------------------------------------------------------------------------
  // 9. Moving Fleet Telemetry Simulation & Layer (Clean Minimal Dot)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setWaypointIndices((prev) => {
        const nextIndices = { ...prev };
        fleetVehicles.forEach((v) => {
          const currentIdx = nextIndices[v.id] || 0;
          const nextIdx = (currentIdx + 1) % (v.routeWaypoints.length || 1);
          nextIndices[v.id] = nextIdx;
        });
        return nextIndices;
      });

      setFleetVehicles((prev) =>
        prev.map((v) => {
          const currentIdx = waypointIndices[v.id] || 0;
          const nextWp = v.routeWaypoints[currentIdx] || [v.lat, v.lng];
          return {
            ...v,
            lat: nextWp[0],
            lng: nextWp[1],
            batteryOrFuelPct: Math.max(15, (v.batteryOrFuelPct - 0.1) % 100),
          };
        })
      );
    }, 2400);

    return () => clearInterval(interval);
  }, [isSimulating, fleetVehicles, waypointIndices]);

  useEffect(() => {
    if (!mapReady || !fleetGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = fleetGroupRef.current;
    group.clearLayers();

    if (!showFleet) return;

    fleetVehicles.forEach((vehicle) => {
      const isReefer = vehicle.tempControlled;

      const vehicleIcon = L.divIcon({
        className: "custom-fleet-marker",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-2.5 h-2.5 rounded-full ${
              isReefer ? "bg-blue-600" : "bg-neutral-900"
            } border border-white shadow-xs"></div>
          </div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = L.marker([vehicle.lat, vehicle.lng], { icon: vehicleIcon });

      marker.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="flex justify-between items-center text-[9px] text-neutral-500">
            <span>${vehicle.name}</span>
            <span class="text-neutral-900 font-bold">${vehicle.speedKmH} km/h</span>
          </div>
          <div class="text-neutral-900 font-bold mt-0.5">${vehicle.type}</div>
          <div class="text-neutral-600 text-[10px] mt-0.5">${vehicle.currentLocationName}</div>
          <div class="text-neutral-500 text-[9px] mt-0.5">Load: ${vehicle.usedKg}kg / ${vehicle.capacityKg}kg (${vehicle.utilizationPct}%)</div>
          ${
            vehicle.tempControlled
              ? `<div class="text-blue-600 text-[9px] mt-0.5 font-semibold">Cold Chain: ${vehicle.chamberTempC}°C (Target: ${vehicle.targetTempC}°C)</div>`
              : ""
          }
        </div>`,
        { sticky: true }
      );

      marker.on("click", () => {
        setSelectedEntity({ type: "vehicle", data: vehicle });
      });

      group.addLayer(marker);
    });
  }, [mapReady, fleetVehicles, showFleet]);

  // ---------------------------------------------------------------------------
  // 9b. Render Essential Healthcare & Agri-Market POIs (Clean Minimal Dot)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !poisGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = poisGroupRef.current;
    group.clearLayers();

    if (!showPois) return;

    filteredPois.forEach((poi) => {
      const isHospital = poi.category === "hospital" || poi.category === "phc_clinic";

      const poiIcon = L.divIcon({
        className: "custom-poi-marker",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-2 h-2 rounded-full ${
              isHospital ? "bg-red-600" : "bg-neutral-800"
            } border border-white shadow-xs"></div>
          </div>
        `,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const marker = L.marker([poi.lat, poi.lng], { icon: poiIcon });

      marker.bindTooltip(
        `<div class="p-1 font-mono text-xs max-w-xs">
          <div class="flex justify-between items-center text-[9px] text-neutral-500">
            <span>${poi.categoryLabel}</span>
            <span class="font-bold text-neutral-900">Score: ${poi.accessibilityScore}/100</span>
          </div>
          <div class="text-neutral-900 font-bold text-xs mt-0.5">${poi.name}</div>
          <div class="text-neutral-600 text-[10px] mt-0.5">${poi.district}, ${poi.state} • Elev: ${poi.elevation_m}m</div>
          <div class="text-neutral-500 text-[9px] mt-0.5">${poi.operationalCapacity}</div>
        </div>`,
        { sticky: true }
      );

      marker.on("click", () => {
        setSelectedEntity({ type: "poi", data: poi });
      });

      group.addLayer(marker);
    });
  }, [mapReady, filteredPois, showPois]);

  // ---------------------------------------------------------------------------
  // 10. Pan & Zoom Handlers for States & SIH Guided Tour
  // ---------------------------------------------------------------------------
  const handleStateSelect = useCallback((stateId: string) => {
    setSelectedState(stateId);
    if (!mapInstanceRef.current) return;

    if (stateId === "all") {
      mapInstanceRef.current.flyTo([26.2, 92.5], 7, { duration: 1.2 });
    } else if (stateId === "siliguri_corridor") {
      mapInstanceRef.current.flyTo([26.7271, 88.3953], 9, { duration: 1.2 });
    } else {
      const stateObj = OSM_NER_STATES_DATA.find((s) => s.id === stateId);
      if (stateObj) {
        mapInstanceRef.current.flyTo(stateObj.center, stateObj.zoom, { duration: 1.2 });
      }
    }
  }, []);

  const handleNextTourStep = useCallback(() => {
    const nextStep = (tourStep + 1) % TOUR_STEPS.length;
    setTourStep(nextStep);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(TOUR_STEPS[nextStep].center, TOUR_STEPS[nextStep].zoom, {
        duration: 1.5,
      });
    }
  }, [tourStep]);

  const handlePrevTourStep = useCallback(() => {
    const prevStep = (tourStep - 1 + TOUR_STEPS.length) % TOUR_STEPS.length;
    setTourStep(prevStep);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(TOUR_STEPS[prevStep].center, TOUR_STEPS[prevStep].zoom, {
        duration: 1.5,
      });
    }
  }, [tourStep]);

  const handleStartTour = useCallback(() => {
    setTourActive(true);
    setTourStep(0);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(TOUR_STEPS[0].center, TOUR_STEPS[0].zoom, { duration: 1.5 });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 11. Sync Selected Hub from External Props
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedHubId) return;
    const hub = OSM_LOGISTICS_HUBS.find((h) => h.id === selectedHubId);
    if (hub) {
      setSelectedEntity({ type: "hub", data: hub });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([hub.lat, hub.lng], 10, { duration: 1.2 });
      }
    }
  }, [selectedHubId]);

  return (
    <div
      className={`relative w-full ${
        isFullScreenMode ? "h-screen" : "h-[860px] rounded-2xl border border-neutral-200 shadow-xl"
      } bg-[#fafafa] overflow-hidden text-neutral-900 flex flex-col ${className}`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP SITUATIONAL CONTROL BAR (Swiss Minimalist Light)                */}
      {/* ===================================================================== */}
      <header className="z-20 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left Brand & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-900 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-neutral-900"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm font-bold tracking-wider text-neutral-900 uppercase">
                  CargoMind 3.0 <span className="text-neutral-500 font-normal">/ GIS Digital Twin</span>
                </h1>
                <span className="border border-neutral-300 text-neutral-700 bg-neutral-50 text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider">
                  LIVE NER
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 font-mono hidden sm:block">
                8 States + Siliguri Corridor • 186 Rural Clusters • High Precision GIS
              </p>
            </div>
          </div>
        </div>

        {/* State Quick-Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full lg:max-w-2xl text-xs font-mono scrollbar-thin">
          <button
            onClick={() => handleStateSelect("all")}
            className={`px-2.5 py-1 rounded transition-all whitespace-nowrap cursor-pointer text-xs font-mono ${
              selectedState === "all"
                ? "bg-neutral-900 text-white font-medium"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            All NER
          </button>
          <button
            onClick={() => handleStateSelect("siliguri_corridor")}
            className={`px-2.5 py-1 rounded transition-all whitespace-nowrap cursor-pointer text-xs font-mono ${
              selectedState === "siliguri_corridor"
                ? "bg-neutral-900 text-white font-medium"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            Siliguri Gateway
          </button>
          {OSM_NER_STATES_DATA.map((st) => (
            <button
              key={st.id}
              onClick={() => handleStateSelect(st.id)}
              className={`px-2.5 py-1 rounded transition-all whitespace-nowrap cursor-pointer text-xs font-mono ${
                selectedState === st.id
                  ? "bg-neutral-900 text-white font-medium"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>

        {/* Right Actions (SIH Tour Button & Tile Selector) */}
        <div className="flex items-center gap-2">
          <button
            onClick={tourActive ? () => setTourActive(false) : handleStartTour}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              tourActive
                ? "bg-neutral-900 text-white"
                : "bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs"
            }`}
          >
            <span>{tourActive ? "⏹ Exit Tour" : "▶ Guided Tour"}</span>
          </button>

          {/* Tile Selector */}
          <select
            value={tileProvider}
            onChange={(e) => setTileProvider(e.target.value as any)}
            className="bg-white text-neutral-800 border border-neutral-200 text-xs font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-neutral-900 cursor-pointer shadow-2xs"
          >
            <option value="carto_light">Carto Positron (Light)</option>
            <option value="osm_standard">OpenStreetMap Standard</option>
            <option value="satellite">Esri Satellite</option>
          </select>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. KPI RIBBON & AGGREGATE SUMMARY (Swiss Light)                       */}
      {/* ===================================================================== */}
      <div className="z-10 bg-neutral-50/90 border-b border-neutral-200 px-4 py-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 border-r border-neutral-200 pr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-900"></div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Strategic Hubs</div>
            <div className="font-bold text-neutral-900 text-xs">{totalHubsCount} Monitored</div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-neutral-200 pr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-900"></div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Rural Clusters</div>
            <div className="font-bold text-neutral-900 text-xs">{totalClustersCount} Connected</div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-neutral-200 pr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-900"></div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Avg Access Score</div>
            <div className="font-bold text-neutral-900 text-xs">{avgAccessibility}/100 [High]</div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-neutral-200 pr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Disaster Alerts</div>
            <div className="font-bold text-red-600 text-xs">{activeDisasterCount} Active Bottlenecks</div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-neutral-200 pr-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-900"></div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Live Fleet</div>
            <div className="font-bold text-neutral-900 text-xs">{fleetVehicles.length} Units En-Route</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-neutral-900"></div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Backhaul Savings</div>
            <div className="font-bold text-neutral-900 text-xs">&#8377;4.82L/mo • -38% Co2</div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MAIN MAP CONTAINER & FLOATING WORKSPACES                           */}
      {/* ===================================================================== */}
      <div className="relative flex-1 w-full h-full min-h-0">
        {/* Leaflet Map Target */}
        <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#f4f4f5]" />

        {/* Loading Overlay */}
        {mapLoading && !mapReady && !mapError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs font-mono text-xs text-neutral-700 gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
            <div className="text-neutral-900 font-semibold tracking-wider uppercase text-xs">Loading GIS Digital Twin...</div>
            <div className="text-[11px] text-neutral-500">Initializing Leaflet Topology Layers</div>
          </div>
        )}

        {/* Error Fallback */}
        {mapError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/95 p-6 font-mono text-center space-y-4">
            <div className="p-3 rounded-full bg-red-50 border border-red-200 text-red-600 text-xl">
              ⚠️
            </div>
            <div className="text-red-600 font-semibold text-sm">GIS Map Engine Initialization Failed</div>
            <p className="text-xs text-neutral-600 max-w-md">
              {mapError}
            </p>
            <button
              onClick={retryInitMap}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-md"
            >
              🔄 Retry Map Initialization
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* LEFT WORKSPACE / CONTROLS DECK (Swiss White Aesthetic)              */}
        {/* =================================================================== */}
        <div className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100%-2rem)] flex flex-col bg-white/95 backdrop-blur-md rounded-xl border border-neutral-200 shadow-xl overflow-hidden font-mono text-neutral-900">
          {/* Search Box */}
          <div className="p-2.5 border-b border-neutral-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter hubs, clusters, produce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-200 bg-neutral-50 text-[10px] uppercase font-bold overflow-x-auto scrollbar-none">
            {[
              { id: "topology", label: "Hubs" },
              { id: "pois", label: "POIs (12)" },
              { id: "clusters", label: "Clusters (186)" },
              { id: "corridors", label: "Corridors" },
              { id: "risks", label: "Risks (5)" },
              { id: "fleet", label: "Fleet" },
              { id: "backhaul", label: "Backhauls" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? "border-neutral-900 text-neutral-900 bg-white font-bold"
                    : "border-transparent text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-72 scrollbar-thin">
            {activeTab === "topology" && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-500 uppercase tracking-wider pb-1">
                  <span>SHOWING {filteredHubs.length} HUBS</span>
                  <label className="flex items-center gap-1 cursor-pointer lowercase">
                    <input
                      type="checkbox"
                      checked={showHubs}
                      onChange={(e) => setShowHubs(e.target.checked)}
                      className="accent-neutral-900 w-3 h-3 cursor-pointer"
                    />
                    <span>visible</span>
                  </label>
                </div>
                {filteredHubs.map((hub) => (
                  <div
                    key={hub.id}
                    onClick={() => {
                      setSelectedEntity({ type: "hub", data: hub });
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([hub.lat, hub.lng], 10, { duration: 1.2 });
                      }
                    }}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedEntity?.data?.id === hub.id
                        ? "bg-neutral-100 border-neutral-900 shadow-2xs"
                        : "bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/80"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-neutral-900">{hub.name}</span>
                      <span className="text-[10px] text-neutral-500 uppercase font-mono">{hub.code}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 flex justify-between">
                      <span>{hub.state} • Elev {hub.elevation_m}m</span>
                      <span className="text-neutral-800 font-medium">{hub.activeDocks} Docks</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "pois" && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-500 uppercase tracking-wider pb-1">
                  <span>SHOWING {filteredPois.length} ESSENTIAL POIS</span>
                  <label className="flex items-center gap-1 cursor-pointer lowercase">
                    <input
                      type="checkbox"
                      checked={showPois}
                      onChange={(e) => setShowPois(e.target.checked)}
                      className="accent-neutral-900 w-3 h-3 cursor-pointer"
                    />
                    <span>visible</span>
                  </label>
                </div>
                {filteredPois.map((poi) => (
                  <div
                    key={poi.id}
                    onClick={() => {
                      setSelectedEntity({ type: "poi", data: poi });
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([poi.lat, poi.lng], 12, { duration: 1.2 });
                      }
                    }}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedEntity?.data?.id === poi.id
                        ? "bg-neutral-100 border-neutral-900 shadow-2xs"
                        : "bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/80"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-neutral-900 truncate max-w-[180px]">{poi.name}</span>
                      <span
                        className={`text-[10px] font-medium ${
                          poi.accessibilityScore >= 75
                            ? "text-neutral-900"
                            : poi.accessibilityScore >= 50
                            ? "text-neutral-700"
                            : "text-red-600"
                        }`}
                      >
                        Score {poi.accessibilityScore}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 flex justify-between">
                      <span>{poi.district}, {poi.state}</span>
                      <span className="text-neutral-600 text-[9px] uppercase">{poi.category.replace("_", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "clusters" && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-500 uppercase tracking-wider pb-1">
                  <span>SHOWING {filteredClusters.length} CLUSTERS</span>
                  <label className="flex items-center gap-1 cursor-pointer lowercase">
                    <input
                      type="checkbox"
                      checked={showClusters}
                      onChange={(e) => setShowClusters(e.target.checked)}
                      className="accent-neutral-900 w-3 h-3 cursor-pointer"
                    />
                    <span>visible</span>
                  </label>
                </div>
                {filteredClusters.slice(0, 30).map((cluster) => (
                  <div
                    key={cluster.id}
                    onClick={() => {
                      setSelectedEntity({ type: "cluster", data: cluster });
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([cluster.lat, cluster.lng], 11, {
                          duration: 1.2,
                        });
                      }
                    }}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedEntity?.data?.id === cluster.id
                        ? "bg-neutral-100 border-neutral-900 shadow-2xs"
                        : "bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/80"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-neutral-900">{cluster.name}</span>
                      <span
                        className={`text-[10px] font-medium ${
                          cluster.accessibilityScore < 50
                            ? "text-red-600"
                            : "text-neutral-800"
                        }`}
                      >
                        {cluster.accessibilityScore}/100
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      {cluster.primaryCommodity} ({cluster.weeklyAgroOutputTons}T/wk) • {cluster.district}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "corridors" && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-500 uppercase tracking-wider pb-1">
                  <span>CORRIDORS ({filteredCorridors.length})</span>
                  <label className="flex items-center gap-1 cursor-pointer lowercase">
                    <input
                      type="checkbox"
                      checked={showCorridors}
                      onChange={(e) => setShowCorridors(e.target.checked)}
                      className="accent-neutral-900 w-3 h-3 cursor-pointer"
                    />
                    <span>visible</span>
                  </label>
                </div>
                {filteredCorridors.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedEntity({ type: "corridor", data: c });
                      if (mapInstanceRef.current && c.coordinates.length > 0) {
                        const mid = c.coordinates[Math.floor(c.coordinates.length / 2)];
                        mapInstanceRef.current.flyTo(mid, 8, { duration: 1.2 });
                      }
                    }}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedEntity?.data?.id === c.id
                        ? "bg-neutral-100 border-neutral-900 shadow-2xs"
                        : "bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/80"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-neutral-900">{c.name}</span>
                      <span className="text-[9px] uppercase font-mono px-1 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                        {c.mode}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 flex justify-between">
                      <span>{c.distanceKm} km • {c.currentEtaHours} hrs</span>
                      <span className={c.status === "blocked_critical" ? "text-red-600 font-bold" : c.status === "moderate_risk" ? "text-amber-600 font-medium" : "text-neutral-800 font-medium"}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "risks" && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-500 uppercase tracking-wider pb-1">
                  <span>DISASTER WARNING ZONES</span>
                  <label className="flex items-center gap-1 cursor-pointer lowercase">
                    <input
                      type="checkbox"
                      checked={showRisks}
                      onChange={(e) => setShowRisks(e.target.checked)}
                      className="accent-red-600 w-3 h-3 cursor-pointer"
                    />
                    <span>visible</span>
                  </label>
                </div>
                {OSM_DISASTER_RISK_ZONES.map((risk) => (
                  <div
                    key={risk.id}
                    onClick={() => {
                      setSelectedEntity({ type: "risk", data: risk });
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([risk.lat, risk.lng], 11, { duration: 1.2 });
                      }
                    }}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedEntity?.data?.id === risk.id
                        ? "bg-red-50/50 border-red-500 shadow-2xs"
                        : "bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/80"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-neutral-900">{risk.name}</span>
                      <span className="border border-red-500 text-red-600 bg-white text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded">
                        {risk.severity}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      {risk.category.replace("_", " ")} • {risk.locationDescription}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "fleet" && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-500 uppercase tracking-wider pb-1">
                  <span>TELEMETRY UNITS</span>
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`text-[9px] px-2 py-0.5 rounded font-mono cursor-pointer transition-colors ${
                      isSimulating ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    {isSimulating ? "SIMULATING" : "PAUSED"}
                  </button>
                </div>
                {fleetVehicles.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedEntity({ type: "vehicle", data: v });
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([v.lat, v.lng], 10, { duration: 1.2 });
                      }
                    }}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedEntity?.data?.id === v.id
                        ? "bg-neutral-100 border-neutral-900 shadow-2xs"
                        : "bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/80"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-neutral-900">{v.name}</span>
                      <span className="text-neutral-900 font-medium text-[10px]">{v.speedKmH} km/h</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      {v.type} • {v.usedKg}kg / {v.capacityKg}kg ({v.utilizationPct}%)
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "backhaul" && (
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-500 uppercase tracking-wider pb-1">
                  <span>CIRCULAR BACKHAULS</span>
                  <label className="flex items-center gap-1 cursor-pointer lowercase">
                    <input
                      type="checkbox"
                      checked={showBackhauls}
                      onChange={(e) => setShowBackhauls(e.target.checked)}
                      className="accent-neutral-900 w-3 h-3 cursor-pointer"
                    />
                    <span>visible</span>
                  </label>
                </div>
                {OSM_RETURN_LOAD_OPPORTUNITIES.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => {
                      setSelectedEntity({ type: "backhaul", data: opp });
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo([opp.lat, opp.lng], 9, {
                          duration: 1.2,
                        });
                      }
                    }}
                    className={`p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedEntity?.data?.id === opp.id
                        ? "bg-neutral-100 border-neutral-900 shadow-2xs"
                        : "bg-white border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50/80"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-neutral-900">{opp.destinationLocation}</span>
                      <span className="text-neutral-900 text-[10px] font-bold">
                        &#8377;{opp.fuelCostSavingsInr.toLocaleString("en-US")}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      &rarr; {opp.targetDestination} • {opp.availableReturnCargo}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Visibility Filter Toggles */}
          <div className="p-2 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-[10px] text-neutral-600">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHubs}
                  onChange={(e) => setShowHubs(e.target.checked)}
                  className="accent-neutral-900 w-3 h-3 cursor-pointer"
                />
                <span>Hubs</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPois}
                  onChange={(e) => setShowPois(e.target.checked)}
                  className="accent-neutral-900 w-3 h-3 cursor-pointer"
                />
                <span>POIs</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClusters}
                  onChange={(e) => setShowClusters(e.target.checked)}
                  className="accent-neutral-900 w-3 h-3 cursor-pointer"
                />
                <span>Clusters</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRisks}
                  onChange={(e) => setShowRisks(e.target.checked)}
                  className="accent-red-600 w-3 h-3 cursor-pointer"
                />
                <span>Risks</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFleet}
                  onChange={(e) => setShowFleet(e.target.checked)}
                  className="accent-neutral-900 w-3 h-3 cursor-pointer"
                />
                <span>Fleet</span>
              </label>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT AI COPILOT & DEEP INSPECTION PANEL (Swiss White)              */}
        {/* =================================================================== */}
        {selectedEntity && (
          <div className="absolute top-4 right-4 z-10 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100%-2rem)] flex flex-col bg-white/95 backdrop-blur-md rounded-xl border border-neutral-200 shadow-xl overflow-hidden font-mono text-xs text-neutral-900">
            {/* Header */}
            <div className="p-3 border-b border-neutral-200 flex justify-between items-center bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neutral-900"></div>
                <span className="font-bold text-neutral-900 uppercase text-[11px] tracking-wider">
                  DIGITAL TWIN INSPECTOR • {selectedEntity.type.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-neutral-400 hover:text-neutral-900 font-bold px-1 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-3.5 overflow-y-auto space-y-3 max-h-[70vh] scrollbar-thin">
              {/* POI DETAIL */}
              {selectedEntity.type === "poi" && (
                <>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                      ESSENTIAL POI • {selectedEntity.data.categoryLabel}
                    </div>
                    <h2 className="text-base font-bold text-neutral-900 mt-0.5">{selectedEntity.data.name}</h2>
                    <div className="text-neutral-500 text-[11px] mt-0.5">
                      {selectedEntity.data.district}, {selectedEntity.data.state} • Elev {selectedEntity.data.elevation_m}m
                    </div>
                  </div>

                  {/* Accessibility Score Gauge */}
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Accessibility Score</div>
                      <div
                        className={`text-2xl font-black ${
                          selectedEntity.data.accessibilityScore >= 75
                            ? "text-neutral-900"
                            : selectedEntity.data.accessibilityScore >= 50
                            ? "text-neutral-800"
                            : "text-red-600"
                        }`}
                      >
                        {selectedEntity.data.accessibilityScore}
                        <span className="text-xs text-neutral-400 font-normal"> / 100</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Cold Chain</div>
                      <div className="font-bold text-neutral-900">
                        {selectedEntity.data.isColdChainEquipped ? "❄️ Active Reefer Vault" : "Ambient Storage"}
                      </div>
                    </div>
                  </div>

                  {/* 5-Factor Score Decomposition */}
                  <div className="space-y-1.5 bg-neutral-50/70 p-2.5 rounded-lg border border-neutral-200 text-[10px]">
                    <div className="text-neutral-500 uppercase font-bold text-[9px] mb-1 tracking-wider">
                      5-Factor Accessibility Decomposition
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">PMGSY Road Connectivity</span>
                      <span className="text-neutral-900 font-bold">{selectedEntity.data.scoreBreakdown.roadConnectivity} / 25</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">SRTM Terrain & Elevation</span>
                      <span className="text-neutral-900 font-bold">{selectedEntity.data.scoreBreakdown.terrainElevation} / 20</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Rail & Waterway Proximity</span>
                      <span className="text-neutral-900 font-bold">{selectedEntity.data.scoreBreakdown.multimodalProximity} / 20</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Disaster & Flood Safety</span>
                      <span className="text-neutral-900 font-bold">{selectedEntity.data.scoreBreakdown.disasterSafety} / 20</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">Facility Readiness & Hub Access</span>
                      <span className="text-neutral-900 font-bold">{selectedEntity.data.scoreBreakdown.facilityReadiness} / 15</span>
                    </div>
                  </div>

                  {/* Capacity & Operational Note */}
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-[11px] space-y-1">
                    <div className="text-[10px] text-neutral-500">Operational Capacity:</div>
                    <div className="text-neutral-900 font-semibold">{selectedEntity.data.operationalCapacity}</div>
                    <div className="text-neutral-500 text-[10px] pt-1 border-t border-neutral-200">
                      {selectedEntity.data.notes}
                    </div>
                  </div>
                </>
              )}

              {/* HUB DETAIL */}
              {selectedEntity.type === "hub" && (
                <>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                      {selectedEntity.data.tier.replace("_", " ")} • {selectedEntity.data.state}
                    </div>
                    <h2 className="text-base font-bold text-neutral-900">{selectedEntity.data.name}</h2>
                    <div className="text-neutral-500 text-[11px] mt-0.5">{selectedEntity.data.roleTag}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <div>
                      <div className="text-[10px] text-neutral-500">Elevation</div>
                      <div className="font-bold text-neutral-900">{selectedEntity.data.elevation_m} meters</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Capacity Utilization</div>
                      <div className="font-bold text-neutral-900">
                        {Math.round((selectedEntity.data.usedKg / selectedEntity.data.capacityKg) * 100)}% (
                        {(selectedEntity.data.usedKg / 1000).toFixed(0)}T / {(selectedEntity.data.capacityKg / 1000).toFixed(0)}T)
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Active Loading Docks</div>
                      <div className="font-bold text-neutral-900">{selectedEntity.data.activeDocks} Docks Online</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Power Reliability</div>
                      <div className="font-bold text-neutral-900 uppercase">{selectedEntity.data.powerReliability}</div>
                    </div>
                  </div>

                  {/* Multimodal Capabilities */}
                  <div>
                    <div className="text-[10px] text-neutral-500 uppercase font-bold mb-1.5 tracking-wider">
                      Multimodal Interfaces
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {selectedEntity.data.capabilities.road && (
                        <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded">
                          ✓ Road Terminal
                        </span>
                      )}
                      {selectedEntity.data.capabilities.rail && (
                        <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded">
                          ✓ Broad Gauge Rail
                        </span>
                      )}
                      {selectedEntity.data.capabilities.inland_waterway && (
                        <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded">
                          ✓ NW-2 Inland Port
                        </span>
                      )}
                      {selectedEntity.data.capabilities.air && (
                        <span className="bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded">
                          ✓ Air Cargo Bay
                        </span>
                      )}
                      {selectedEntity.data.capabilities.cold_storage && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                          ✓ Cold Chain Reefer
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Optimization Directive */}
                  <div className="bg-neutral-100/80 border border-neutral-300 p-2.5 rounded-lg text-[11px] text-neutral-800">
                    <div className="font-bold text-neutral-900 uppercase text-[10px] mb-1 flex items-center gap-1">
                      <span>AI Hub Optimization Directive</span>
                    </div>
                    {selectedEntity.data.isGuwahati
                      ? "Mega-Hub Gateway operating at 78% capacity. Recommended to route 24T outbound perishable ginger via Lumding Rail instead of NH-6 due to the Sonapur bottleneck."
                      : selectedEntity.data.isSiliguri
                      ? "Critical Chicken's Neck gateway clear. Pre-clearance buffer holding 18 shipments destined for Upper Assam and Arunachal Pradesh."
                      : `Hub load optimal. 3 electric dispatch mini-trucks staged for rural cooperative collection within a 45km radius.`}
                  </div>
                </>
              )}

              {/* RURAL CLUSTER DETAIL */}
              {selectedEntity.type === "cluster" && (
                <>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                      Rural Cluster • {selectedEntity.data.district}, {selectedEntity.data.state}
                    </div>
                    <h2 className="text-base font-bold text-neutral-900">{selectedEntity.data.name}</h2>
                    <div className="text-neutral-500 text-[11px] mt-0.5">
                      Terrain: {selectedEntity.data.terrainDifficulty}
                    </div>
                  </div>

                  {/* Accessibility Gauge */}
                  <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-500 font-bold uppercase text-[10px] tracking-wider">Accessibility Score</span>
                      <span
                        className={`font-bold ${
                          selectedEntity.data.accessibilityScore < 50
                            ? "text-red-600"
                            : "text-neutral-900"
                        }`}
                      >
                        {selectedEntity.data.accessibilityScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          selectedEntity.data.accessibilityScore < 50
                            ? "bg-red-600"
                            : "bg-neutral-900"
                        }`}
                        style={{ width: `${selectedEntity.data.accessibilityScore}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-neutral-500 flex justify-between pt-1">
                      <span>RoadSense IRI: {selectedEntity.data.roadSenseIRI} (Roughness)</span>
                      <span>Elev: {selectedEntity.data.elevation_m}m</span>
                    </div>
                  </div>

                  {/* Production & Healthcare */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-neutral-50 p-2 rounded border border-neutral-200">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Primary Produce</div>
                      <div className="font-bold text-neutral-900">{selectedEntity.data.primaryCommodity}</div>
                      <div className="text-[9px] text-neutral-400">{selectedEntity.data.weeklyAgroOutputTons} Tons/week</div>
                    </div>
                    <div className="bg-neutral-50 p-2 rounded border border-neutral-200">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">PHC Clinics</div>
                      <div className="font-bold text-neutral-900">{selectedEntity.data.healthCentresCount} Active</div>
                      <div className="text-[9px] text-neutral-400">Vaccine cold-storage tied</div>
                    </div>
                  </div>

                  <div className="bg-neutral-100/80 border border-neutral-300 p-2.5 rounded-lg text-[11px] text-neutral-800">
                    <div className="font-bold text-neutral-900 uppercase text-[10px] mb-1">
                      FPO Agro Dispatch Recommendation
                    </div>
                    {selectedEntity.data.currentDemandSummary} • Suggested 4WD EV mini-truck dispatch from parent hub.
                  </div>
                </>
              )}

              {/* DISASTER RISK DETAIL */}
              {selectedEntity.type === "risk" && (
                <>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                      ACTIVE BOTTLENECK ALERT • {selectedEntity.data.category.replace("_", " ")}
                    </div>
                    <h2 className="text-base font-bold text-neutral-900">{selectedEntity.data.name}</h2>
                    <div className="text-neutral-500 text-[11px] mt-0.5">{selectedEntity.data.locationDescription}</div>
                  </div>

                  <div className="bg-red-50 p-3 rounded-lg border border-red-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-700 font-bold">Severity Level</span>
                      <span className="border border-red-500 text-red-600 bg-white text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded">
                        {selectedEntity.data.severity}
                      </span>
                    </div>
                    <div className="text-neutral-700 text-[11px]">{selectedEntity.data.impactSummary}</div>
                  </div>

                  <div className="bg-neutral-100 border border-neutral-300 p-2.5 rounded-lg text-[11px] text-neutral-800">
                    <div className="font-bold text-neutral-900 uppercase text-[10px] mb-1">
                      Autonomous Detour Protocol
                    </div>
                    {selectedEntity.data.aiRerouteRecommendation}
                  </div>
                </>
              )}

              {/* FLEET TELEMETRY DETAIL */}
              {selectedEntity.type === "vehicle" && (
                <>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                      LIVE FLEET TELEMETRY • {selectedEntity.data.name}
                    </div>
                    <h2 className="text-base font-bold text-neutral-900">{selectedEntity.data.type}</h2>
                    <div className="text-neutral-500 text-[11px] mt-0.5">
                      Driver: {selectedEntity.data.driverName} • Location: {selectedEntity.data.currentLocationName}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <div>
                      <div className="text-[10px] text-neutral-500">Current Speed</div>
                      <div className="font-bold text-neutral-900">{selectedEntity.data.speedKmH} km/h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Load / Capacity</div>
                      <div className="font-bold text-neutral-900">
                        {selectedEntity.data.usedKg}kg ({selectedEntity.data.utilizationPct}%)
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Fuel / Battery</div>
                      <div className="font-bold text-neutral-900">{Math.round(selectedEntity.data.batteryOrFuelPct)}% State</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Status</div>
                      <div className="font-bold text-neutral-900 uppercase">{selectedEntity.data.status.replace("_", " ")}</div>
                    </div>
                  </div>

                  {selectedEntity.data.tempControlled && (
                    <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
                      <div className="text-blue-900 font-bold uppercase text-[10px] mb-1 flex justify-between">
                        <span>Active Cold-Chain Reefer</span>
                        <span className="text-blue-700">SETPOINT: {selectedEntity.data.targetTempC}°C</span>
                      </div>
                      <div className="text-base font-bold text-neutral-900">{selectedEntity.data.chamberTempC}°C</div>
                      <div className="text-[10px] text-neutral-600 mt-0.5">
                        Continuous sensor telemetry active. Perishables & vaccines in nominal range.
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* CORRIDOR DETAIL */}
              {selectedEntity.type === "corridor" && (
                <>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                      {selectedEntity.data.id.toUpperCase()} • {selectedEntity.data.mode.toUpperCase()}
                    </div>
                    <h2 className="text-base font-bold text-neutral-900">{selectedEntity.data.name}</h2>
                    <div className="text-neutral-500 text-[11px] mt-0.5">
                      Weather: {selectedEntity.data.weatherCondition} • IRI: {selectedEntity.data.roadRoughnessIRI}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <div>
                      <div className="text-[10px] text-neutral-500">Total Distance</div>
                      <div className="font-bold text-neutral-900">{selectedEntity.data.distanceKm} km</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Transit Duration</div>
                      <div className="font-bold text-neutral-900">{selectedEntity.data.currentEtaHours} Hours</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Terrain Gradient</div>
                      <div className="font-bold text-neutral-900">{selectedEntity.data.gradientPct}% Max Slope</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Elevation Gain</div>
                      <div className="font-bold text-neutral-900">+{selectedEntity.data.elevationGainM}m</div>
                    </div>
                  </div>

                  <div className="bg-neutral-100 border border-neutral-300 p-2.5 rounded-lg text-[11px] text-neutral-800">
                    <div className="font-bold text-neutral-900 uppercase text-[10px] mb-1">
                      Multimodal Corridor Intelligence
                    </div>
                    Status: {selectedEntity.data.status.toUpperCase()} • {selectedEntity.data.recommendation}
                  </div>
                </>
              )}

              {/* BACKHAUL DETAIL */}
              {selectedEntity.type === "backhaul" && (
                <>
                  <div>
                    <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                      CIRCULAR BACKHAUL MATCH • ZERO-DEADHEAD
                    </div>
                    <h2 className="text-base font-bold text-neutral-900">{selectedEntity.data.availableReturnCargo}</h2>
                    <div className="text-neutral-500 text-[11px] mt-0.5">
                      {selectedEntity.data.destinationLocation} &rarr; {selectedEntity.data.targetDestination}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <div>
                      <div className="text-[10px] text-neutral-500">Economic Value</div>
                      <div className="font-bold text-neutral-900">&#8377;{selectedEntity.data.fuelCostSavingsInr.toLocaleString("en-US")}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Carbon Abatement</div>
                      <div className="font-bold text-neutral-900">-{selectedEntity.data.co2ReductionKg}kg CO₂</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Weight & Commodity</div>
                      <div className="font-bold text-neutral-900">{selectedEntity.data.availableWeightKg}kg ({selectedEntity.data.returnCommodity})</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500">Producer Entity</div>
                      <div className="font-bold text-neutral-900 text-[10px]">{selectedEntity.data.producerGroup}</div>
                    </div>
                  </div>

                  <div className="bg-neutral-100 border border-neutral-300 p-2.5 rounded-lg text-[11px] text-neutral-800">
                    <div className="font-bold text-neutral-900 uppercase text-[10px] mb-1">
                      Return Logistics Efficiency
                    </div>
                    Eliminates {selectedEntity.data.emptyMilesEliminatedKm}km of empty return miles on the return descent leg.
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SIH GUIDED WALKTHROUGH OVERLAY (Swiss Minimalist)                    */}
        {/* =================================================================== */}
        {tourActive && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl bg-white/95 backdrop-blur-lg border border-neutral-900 rounded-2xl p-4 shadow-2xl font-mono text-neutral-900">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-neutral-900 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                  GUIDED TOUR
                </span>
                <span className="text-xs font-bold text-neutral-700 uppercase">
                  Step {tourStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={() => setTourActive(false)}
                className="text-neutral-400 hover:text-neutral-900 text-xs font-bold px-2 py-0.5 cursor-pointer"
              >
                ✕ Exit Tour
              </button>
            </div>

            <h3 className="font-bold text-sm text-neutral-900 mb-1">{TOUR_STEPS[tourStep].title}</h3>
            <p className="text-xs text-neutral-600 leading-relaxed mb-3">{TOUR_STEPS[tourStep].narration}</p>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
              <div className="text-[11px] text-neutral-500">
                Focus: <span className="text-neutral-900 font-semibold">{TOUR_STEPS[tourStep].highlight}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevTourStep}
                  disabled={tourStep === 0}
                  className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 rounded text-xs text-neutral-800 cursor-pointer transition-colors"
                >
                  &larr; Prev
                </button>
                <button
                  onClick={handleNextTourStep}
                  className="px-4 py-1 bg-neutral-900 hover:bg-neutral-800 font-bold text-white rounded text-xs cursor-pointer transition-colors"
                >
                  {tourStep === TOUR_STEPS.length - 1 ? "Restart Tour" : "Next Step &rarr;"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
