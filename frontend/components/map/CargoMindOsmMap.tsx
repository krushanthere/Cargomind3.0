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

// Tile Provider URLs
const TILE_URLS: Record<string, string> = {
  carto_dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  osm_standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  carto_light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

const TILE_ATTRIBUTIONS: Record<string, string> = {
  carto_dark: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  osm_standard: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  carto_light: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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

  // State Management
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
    "carto_dark" | "osm_standard" | "satellite" | "carto_light"
  >("carto_dark");

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

        // Base Tile Layer
        const baseTile = L.tileLayer(TILE_URLS[tileProvider] || TILE_URLS.carto_dark, {
          attribution: TILE_ATTRIBUTIONS[tileProvider] || TILE_ATTRIBUTIONS.carto_dark,
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
    const newBaseTile = L.tileLayer(TILE_URLS[tileProvider] || TILE_URLS.carto_dark, {
      attribution: TILE_ATTRIBUTIONS[tileProvider] || TILE_ATTRIBUTIONS.carto_dark,
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
  // 4. Render Corridors Layer
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !corridorsGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = corridorsGroupRef.current;
    group.clearLayers();

    if (!showCorridors) return;

    filteredCorridors.forEach((corridor) => {
      let strokeColor = "#10b981";
      let weight = 4;
      let dashArray: string | undefined = undefined;
      let opacity = 0.85;

      if (corridor.status === "blocked_critical") {
        strokeColor = "#ef4444";
        weight = 5;
      } else if (corridor.status === "moderate_risk") {
        strokeColor = "#f59e0b";
        weight = 4.5;
      }

      if (corridor.mode === "rail") {
        strokeColor = "#8b5cf6";
        dashArray = "6, 8";
        weight = 3.5;
      } else if (corridor.mode === "waterway") {
        strokeColor = "#06b6d4";
        dashArray = "8, 6";
        weight = 4;
      } else if (corridor.mode === "air") {
        strokeColor = "#38bdf8";
        dashArray = "4, 6";
        weight = 2.5;
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
          <div class="font-bold uppercase tracking-wider text-[10px] text-neutral-400">${corridor.id.toUpperCase()} • ${corridor.mode.toUpperCase()}</div>
          <div class="text-white font-semibold">${corridor.name}</div>
          <div class="text-[10px] text-neutral-300 mt-1">Status: <span class="${
            corridor.status === "blocked_critical" ? "text-red-400 font-bold" : corridor.status === "moderate_risk" ? "text-amber-400 font-semibold" : "text-emerald-400"
          }">${corridor.status.replace("_", " ").toUpperCase()}</span> | ETA: ${corridor.currentEtaHours}h</div>
          <div class="text-[9px] text-neutral-400">${corridor.distanceKm} km • Gradient: ${corridor.gradientPct}% • IRI: ${corridor.roadRoughnessIRI}</div>
        </div>`,
        { sticky: true, className: "leaflet-custom-tooltip" }
      );

      polyline.on("click", () => {
        setSelectedEntity({ type: "corridor", data: corridor });
      });

      group.addLayer(polyline);
    });
  }, [mapReady, filteredCorridors, showCorridors]);

  // ---------------------------------------------------------------------------
  // 5. Render Disaster Risk Zones Layer
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !risksGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = risksGroupRef.current;
    group.clearLayers();

    if (!showRisks) return;

    OSM_DISASTER_RISK_ZONES.forEach((risk) => {
      const isCritical = risk.severity === "critical";
      const color = isCritical ? "#ef4444" : "#f59e0b";

      const circle = L.circle([risk.lat, risk.lng], {
        radius: risk.radiusMeters,
        color: color,
        fillColor: color,
        fillOpacity: 0.22,
        weight: 2,
        dashArray: "4, 4",
      });

      const riskIcon = L.divIcon({
        className: "custom-risk-icon",
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full ${isCritical ? 'bg-red-500/40 animate-ping' : 'bg-amber-500/40 animate-pulse'}"></div>
            <div class="relative w-6 h-6 rounded-full ${isCritical ? 'bg-red-600 border-2 border-red-300' : 'bg-amber-600 border-2 border-amber-300'} flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
              !
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-neutral-900/90 text-[9px] text-red-400 font-mono px-1.5 py-0.5 rounded border border-red-500/50">
              ${risk.name.split(" ")[0]} ALERT
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([risk.lat, risk.lng], { icon: riskIcon });

      marker.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="text-red-400 font-bold uppercase tracking-wider text-[10px]">${risk.category.replace("_", " ")} • SEVERITY: ${risk.severity.toUpperCase()}</div>
          <div class="text-white font-semibold">${risk.name}</div>
          <div class="text-neutral-300 text-[10px] mt-1">${risk.impactSummary}</div>
          <div class="text-amber-400 text-[10px] mt-1">Location: ${risk.locationDescription} (${risk.state})</div>
          <div class="text-emerald-400 text-[10px] mt-1">AI Recommendation: ${risk.aiRerouteRecommendation}</div>
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
  // 6. Render Logistics Hubs
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !hubsGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = hubsGroupRef.current;
    group.clearLayers();

    if (!showHubs) return;

    filteredHubs.forEach((hub) => {
      let markerHtml = "";
      let iconSize: [number, number] = [28, 28];
      let iconAnchor: [number, number] = [14, 14];

      if (hub.isGuwahati) {
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-12 h-12 rounded-full bg-emerald-500/30 animate-ping"></div>
            <div class="absolute w-9 h-9 rounded-full bg-amber-500/30 animate-pulse"></div>
            <div class="relative w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-400 border-2 border-white flex items-center justify-center text-white font-bold text-xs shadow-2xl">
              GH
            </div>
            <div class="absolute -top-7 whitespace-nowrap bg-emerald-950/95 text-[10px] text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500 shadow-md">
              PRIMARY NER HUB
            </div>
          </div>
        `;
        iconSize = [32, 32];
        iconAnchor = [16, 16];
      } else if (hub.isSiliguri) {
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute w-10 h-10 rounded-full bg-amber-500/40 animate-ping"></div>
            <div class="relative w-7 h-7 rotate-45 rounded bg-gradient-to-r from-amber-500 to-orange-600 border-2 border-white flex items-center justify-center text-white font-mono text-[10px] font-bold shadow-xl">
              <span class="-rotate-45">SXB</span>
            </div>
            <div class="absolute -top-7 whitespace-nowrap bg-amber-950/95 text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500 shadow-md">
              CHICKEN'S NECK FULCRUM
            </div>
          </div>
        `;
        iconSize = [28, 28];
        iconAnchor = [14, 14];
      } else if (hub.tier === "mainland_gateway") {
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-6 h-6 rounded-md bg-neutral-800 border-2 border-neutral-400 flex items-center justify-center text-neutral-200 font-mono text-[9px] font-bold shadow-md hover:border-white">
              ${hub.code.slice(0, 3)}
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-neutral-900/90 text-[8px] text-neutral-300 font-mono px-1 py-px rounded border border-neutral-700">
              ${hub.name.split(" ")[0]}
            </div>
          </div>
        `;
        iconSize = [24, 24];
        iconAnchor = [12, 12];
      } else if (hub.tier === "state_hub") {
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-6 h-6 rounded-full bg-cyan-600 border-2 border-cyan-200 flex items-center justify-center text-white font-mono text-[9px] font-bold shadow-lg hover:scale-110 transition-transform">
              ${hub.code.slice(0, 3)}
            </div>
            <div class="absolute -bottom-5 whitespace-nowrap bg-neutral-950/90 text-[9px] text-cyan-300 font-mono px-1.5 py-0.5 rounded border border-cyan-700/80">
              ${hub.name}
            </div>
          </div>
        `;
        iconSize = [24, 24];
        iconAnchor = [12, 12];
      } else {
        markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
            <div class="w-4 h-4 rounded-full bg-indigo-600 border border-indigo-200 flex items-center justify-center text-[7px] text-white font-mono font-semibold">
              •
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap bg-neutral-950/80 text-[8px] text-neutral-300 font-mono px-1 rounded">
              ${hub.name}
            </div>
          </div>
        `;
        iconSize = [16, 16];
        iconAnchor = [8, 8];
      }

      const hubIcon = L.divIcon({
        className: "custom-hub-marker",
        html: markerHtml,
        iconSize,
        iconAnchor,
      });

      const marker = L.marker([hub.lat, hub.lng], { icon: hubIcon });

      marker.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">${hub.tier.replace("_", " ")} • ${hub.state}</div>
          <div class="text-white font-semibold text-sm">${hub.name} (${hub.code})</div>
          <div class="text-neutral-300 text-[10px] mt-1">${hub.roleTag}</div>
          <div class="text-neutral-400 text-[9px] mt-1">Elev: ${hub.elevation_m}m | Docks: ${hub.activeDocks} | Cap: ${(hub.capacityKg / 1000).toFixed(0)}T (${Math.round((hub.usedKg / hub.capacityKg) * 100)}% Used)</div>
          <div class="flex gap-1 mt-1 text-[8px]">
            ${hub.capabilities.road ? '<span class="bg-emerald-900/60 text-emerald-300 px-1 py-0.5 rounded">Road</span>' : ""}
            ${hub.capabilities.rail ? '<span class="bg-purple-900/60 text-purple-300 px-1 py-0.5 rounded">Rail Freight</span>' : ""}
            ${hub.capabilities.inland_waterway ? '<span class="bg-cyan-900/60 text-cyan-300 px-1 py-0.5 rounded">NW-2 Port</span>' : ""}
            ${hub.capabilities.air ? '<span class="bg-sky-900/60 text-sky-300 px-1 py-0.5 rounded">Air Cargo</span>' : ""}
            ${hub.capabilities.cold_storage ? '<span class="bg-blue-900/60 text-blue-300 px-1 py-0.5 rounded">Cold Reefer</span>' : ""}
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
  // 7. Render Rural Logistics Clusters
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !clustersGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = clustersGroupRef.current;
    group.clearLayers();

    if (!showClusters) return;

    filteredClusters.forEach((cluster) => {
      let colorClass = "bg-emerald-500 border-emerald-300";
      if (cluster.accessibilityScore < 50) {
        colorClass = "bg-rose-500 border-rose-300 animate-pulse";
      } else if (cluster.accessibilityScore < 75) {
        colorClass = "bg-amber-500 border-amber-300";
      }

      const clusterIcon = L.divIcon({
        className: "custom-cluster-marker",
        html: `
          <div class="relative flex items-center justify-center group cursor-pointer">
            <div class="w-3.5 h-3.5 rounded-full ${colorClass} border flex items-center justify-center text-[7px] text-neutral-950 font-bold shadow-sm">
            </div>
          </div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon });

      marker.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="flex justify-between items-center text-[10px] text-neutral-400">
            <span>${cluster.district}, ${cluster.state}</span>
            <span class="font-bold ${cluster.accessibilityScore < 50 ? "text-red-400" : cluster.accessibilityScore < 75 ? "text-amber-400" : "text-emerald-400"}">
              Score: ${cluster.accessibilityScore}/100
            </span>
          </div>
          <div class="text-white font-bold text-xs mt-0.5">${cluster.name}</div>
          <div class="text-emerald-400 text-[10px] mt-1">🌾 Produce: ${cluster.primaryCommodity} (${cluster.weeklyAgroOutputTons} T/wk)</div>
          <div class="text-neutral-300 text-[9px] mt-0.5">Terrain: ${cluster.terrainDifficulty} • Elev: ${cluster.elevation_m}m • RoadSense IRI: ${cluster.roadSenseIRI}</div>
          <div class="text-neutral-400 text-[9px] mt-0.5">🏥 ${cluster.healthCentresCount} PHC Clinics | 👨‍🌾 ${cluster.farmerProducerOrgs} FPOs | Pop: ${(cluster.population / 1000).toFixed(1)}k</div>
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
  // 8. Render Return-Load Opportunities Layer
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
        color: "#10b981",
        weight: 1.5,
        fillColor: "#10b981",
        fillOpacity: 0.15,
        dashArray: "3, 6",
      });

      circle.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">CIRCULAR BACKHAUL MATCH</div>
          <div class="text-white font-semibold">${opp.availableReturnCargo}</div>
          <div class="text-neutral-300 text-[10px] mt-1">${opp.destinationLocation} &rarr; ${opp.targetDestination}</div>
          <div class="text-emerald-300 text-[10px] mt-1">Savings: &#8377;${opp.fuelCostSavingsInr.toLocaleString("en-US")} • -${opp.co2ReductionKg}kg CO2 (Deadhead Avoided)</div>
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
  // 9. Moving Fleet Telemetry Simulation & Layer
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
      const isEV = vehicle.type.toLowerCase().includes("ev") || vehicle.type.toLowerCase().includes("drone");

      const vehicleIcon = L.divIcon({
        className: "custom-fleet-marker",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group hover:scale-125 transition-transform">
            <div class="w-6 h-6 rounded-full ${isEV ? "bg-emerald-600 border-2 border-emerald-300" : isReefer ? "bg-blue-600 border-2 border-cyan-300" : "bg-neutral-800 border-2 border-amber-400"} flex items-center justify-center text-[10px] text-white font-bold shadow-lg">
              🚚
            </div>
            <div class="absolute -top-5 whitespace-nowrap bg-neutral-900/90 text-[8px] font-mono text-white px-1 py-px rounded border border-neutral-700">
              ${vehicle.name.split(" ")[0]}
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([vehicle.lat, vehicle.lng], { icon: vehicleIcon });

      marker.bindTooltip(
        `<div class="p-1 font-mono text-xs">
          <div class="flex justify-between items-center text-[10px] text-neutral-400">
            <span>${vehicle.name}</span>
            <span class="text-emerald-400 font-bold">${vehicle.speedKmH} km/h</span>
          </div>
          <div class="text-white font-bold mt-0.5">${vehicle.type}</div>
          <div class="text-neutral-300 text-[10px] mt-1">Location: ${vehicle.currentLocationName}</div>
          <div class="text-neutral-400 text-[9px] mt-0.5">Load: ${vehicle.usedKg}kg / ${vehicle.capacityKg}kg (${vehicle.utilizationPct}%) | Driver: ${vehicle.driverName}</div>
          ${
            vehicle.tempControlled
              ? `<div class="text-cyan-400 text-[9px] mt-0.5">❄️ Cold Chain: ${vehicle.chamberTempC}°C (Target: ${vehicle.targetTempC}°C)</div>`
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
  // 9b. Render Essential Healthcare & Agri-Market POIs
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapReady || !poisGroupRef.current || !leafletLibRef.current) return;
    const L = leafletLibRef.current;
    const group = poisGroupRef.current;
    group.clearLayers();

    if (!showPois) return;

    filteredPois.forEach((poi) => {
      const isHospital = poi.category === "hospital" || poi.category === "phc_clinic";
      const iconBg = isHospital ? "bg-rose-600 border-rose-200" : "bg-amber-600 border-amber-200";
      const symbol = isHospital ? "✚" : "🌾";

      const poiIcon = L.divIcon({
        className: "custom-poi-marker",
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group hover:scale-110 transition-transform">
            <div class="w-6 h-6 rounded-full ${iconBg} border-2 flex items-center justify-center text-white text-[11px] font-bold shadow-lg">
              ${symbol}
            </div>
            <div class="absolute -bottom-4 whitespace-nowrap bg-neutral-950/90 text-[8px] text-neutral-200 font-mono px-1 rounded border border-neutral-700">
              ${poi.name.split(" ")[0]} (${poi.accessibilityScore})
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([poi.lat, poi.lng], { icon: poiIcon });

      marker.bindTooltip(
        `<div class="p-1.5 font-mono text-xs max-w-xs">
          <div class="flex justify-between items-center text-[10px] text-neutral-400">
            <span>${poi.categoryLabel}</span>
            <span class="font-bold ${poi.accessibilityScore >= 75 ? "text-emerald-400" : poi.accessibilityScore >= 50 ? "text-amber-400" : "text-rose-400"}">
              Score: ${poi.accessibilityScore}/100
            </span>
          </div>
          <div class="text-white font-bold text-sm mt-0.5">${poi.name}</div>
          <div class="text-neutral-300 text-[10px] mt-1">${poi.district}, ${poi.state} &bull; Elev: ${poi.elevation_m}m</div>
          <div class="text-neutral-400 text-[9px] mt-0.5">Capacity: ${poi.operationalCapacity}</div>
          <div class="text-neutral-400 text-[9px] mt-0.5">${poi.notes}</div>
          <div class="flex gap-1 mt-1 text-[8px]">
            ${poi.isColdChainEquipped ? '<span class="bg-blue-900/80 text-blue-300 px-1 py-0.5 rounded">❄️ Cold Chain</span>' : ""}
            <span class="bg-neutral-800 text-neutral-300 px-1 py-0.5 rounded">Road: ${poi.scoreBreakdown.roadConnectivity}/25</span>
            <span class="bg-neutral-800 text-neutral-300 px-1 py-0.5 rounded">Terrain: ${poi.scoreBreakdown.terrainElevation}/20</span>
          </div>
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
        isFullScreenMode ? "h-screen" : "h-[860px] rounded-2xl border border-neutral-800 shadow-2xl"
      } bg-[#09090c] overflow-hidden text-neutral-100 flex flex-col ${className}`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP SITUATIONAL CONTROL BAR                                         */}
      {/* ===================================================================== */}
      <header className="z-20 w-full bg-[#0d0d12]/90 backdrop-blur-md border-b border-neutral-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left Brand & Live Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-sm font-bold tracking-wider text-white uppercase">
                  CargoMind 3.0 <span className="text-emerald-400">OSM Digital Twin</span>
                </h1>
                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono px-1.5 py-0.5 rounded">
                  NER LIVE TELEMETRY
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono hidden sm:block">
                OpenStreetMap GIS • 8 States + Siliguri Corridor • 186 Rural Clusters • Real Lat/Lng
              </p>
            </div>
          </div>
        </div>

        {/* State Quick-Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full lg:max-w-2xl text-xs font-mono scrollbar-thin">
          <button
            onClick={() => handleStateSelect("all")}
            className={`px-2.5 py-1 rounded transition-all whitespace-nowrap cursor-pointer ${
              selectedState === "all"
                ? "bg-emerald-500 text-neutral-950 font-bold shadow-sm"
                : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800"
            }`}
          >
            All NER
          </button>
          <button
            onClick={() => handleStateSelect("siliguri_corridor")}
            className={`px-2 py-1 rounded transition-all whitespace-nowrap cursor-pointer ${
              selectedState === "siliguri_corridor"
                ? "bg-amber-500 text-neutral-950 font-bold"
                : "bg-neutral-900 text-amber-300/90 hover:bg-neutral-800 border border-amber-900/50"
            }`}
          >
            Siliguri Gateway
          </button>
          {OSM_NER_STATES_DATA.map((st) => (
            <button
              key={st.id}
              onClick={() => handleStateSelect(st.id)}
              className={`px-2 py-1 rounded transition-all whitespace-nowrap cursor-pointer ${
                selectedState === st.id
                  ? "bg-cyan-500 text-neutral-950 font-bold shadow-sm"
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 border border-neutral-800"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              tourActive
                ? "bg-amber-500 text-neutral-950 animate-pulse"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
            }`}
          >
            <span>{tourActive ? "⏹ Exit SIH Tour" : "▶ Start SIH Guided Tour"}</span>
          </button>

          {/* Tile Selector */}
          <select
            value={tileProvider}
            onChange={(e) => setTileProvider(e.target.value as any)}
            className="bg-neutral-900 text-neutral-300 border border-neutral-800 text-xs font-mono rounded-lg px-2 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="carto_dark">Carto Dark Matter (AI Twin)</option>
            <option value="osm_standard">OpenStreetMap Standard</option>
            <option value="satellite">Esri Satellite Imagery</option>
            <option value="carto_light">Carto Light</option>
          </select>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. KPI RIBBON & AGGREGATE SUMMARY                                     */}
      {/* ===================================================================== */}
      <div className="z-10 bg-[#121218]/95 border-b border-neutral-800/80 px-4 py-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 border-r border-neutral-800 pr-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Strategic Hubs</div>
            <div className="font-bold text-white text-xs">{totalHubsCount} Monitored</div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-neutral-800 pr-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Rural Clusters</div>
            <div className="font-bold text-cyan-300 text-xs">{totalClustersCount} Connected</div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-neutral-800 pr-2">
          <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Avg Access Score</div>
            <div className="font-bold text-emerald-400 text-xs">{avgAccessibility}/100 [High]</div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-neutral-800 pr-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Disaster Bottlenecks</div>
            <div className="font-bold text-amber-400 text-xs">{activeDisasterCount} Active Alerts</div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-r border-neutral-800 pr-2">
          <div className="w-2 h-2 rounded-full bg-purple-400"></div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Live Fleet GPS</div>
            <div className="font-bold text-purple-300 text-xs">{fleetVehicles.length} Units En-Route</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase">Backhaul Savings</div>
            <div className="font-bold text-emerald-400 text-xs">&#8377;4.82L/mo &bull; -38% Co2</div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MAIN MAP CONTAINER & FLOATING WORKSPACES                           */}
      {/* ===================================================================== */}
      <div className="relative flex-1 w-full h-full min-h-0">
        {/* Leaflet Map Target */}
        <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#09090c]" />

        {/* Loading Overlay */}
        {mapLoading && !mapReady && !mapError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#09090c]/90 backdrop-blur-xs font-mono text-xs text-neutral-300 gap-3">
            <div className="h-7 w-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <div className="text-emerald-400 font-semibold tracking-wider uppercase text-xs">Loading OSM Digital Twin...</div>
            <div className="text-[11px] text-neutral-400">Initializing Leaflet GIS & NER Topology Layers</div>
          </div>
        )}

        {/* Error Fallback */}
        {mapError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#09090c]/95 p-6 font-mono text-center space-y-4">
            <div className="p-3 rounded-full bg-rose-950/60 border border-rose-600/60 text-rose-400 text-xl">
              ⚠️
            </div>
            <div className="text-rose-400 font-semibold text-sm">GIS Map Engine Initialization Failed</div>
            <p className="text-xs text-neutral-400 max-w-md">
              {mapError}
            </p>
            <button
              onClick={retryInitMap}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-md"
            >
              🔄 Retry Map Initialization
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* LEFT WORKSPACE / CONTROLS DECK                                     */}
        {/* =================================================================== */}
        <div className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100%-2rem)] flex flex-col bg-[#0f0f15]/95 backdrop-blur-md rounded-xl border border-neutral-800 shadow-2xl overflow-hidden font-mono">
          {/* Search Box */}
          <div className="p-2.5 border-b border-neutral-800">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter hubs, clusters, produce..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-neutral-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-neutral-800 bg-neutral-950/60 text-[10px] uppercase font-bold overflow-x-auto scrollbar-none">
            {[
              { id: "topology", label: "Hubs" },
              { id: "pois", label: "POIs (12)" },
              { id: "clusters", label: "Clusters (186)" },
              { id: "corridors", label: "Corridors" },
              { id: "risks", label: "Risks (5)" },
              { id: "fleet", label: "Fleet Telemetry" },
              { id: "backhaul", label: "Backhauls" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-400 bg-emerald-950/20 font-bold"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-72 scrollbar-thin">
            {activeTab === "topology" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-400">
                  <span>SHOWING {filteredHubs.length} HUBS</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHubs}
                      onChange={(e) => setShowHubs(e.target.checked)}
                      className="accent-emerald-500 w-3 h-3"
                    />
                    <span>Visible</span>
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
                        ? "bg-emerald-950/50 border-emerald-500"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-white">{hub.name}</span>
                      <span className="text-[10px] text-cyan-400 uppercase font-mono">{hub.code}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5 flex justify-between">
                      <span>{hub.state} &bull; Elev {hub.elevation_m}m</span>
                      <span className="text-emerald-400">{hub.activeDocks} Docks</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "pois" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-400">
                  <span>SHOWING {filteredPois.length} ESSENTIAL POIS</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPois}
                      onChange={(e) => setShowPois(e.target.checked)}
                      className="accent-rose-500 w-3 h-3"
                    />
                    <span>Visible</span>
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
                        ? "bg-rose-950/50 border-rose-500"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-white truncate max-w-[180px]">{poi.name}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          poi.accessibilityScore >= 75
                            ? "text-emerald-400"
                            : poi.accessibilityScore >= 50
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        Score {poi.accessibilityScore}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5 flex justify-between">
                      <span>{poi.district}, {poi.state}</span>
                      <span className="text-cyan-400 text-[9px] uppercase">{poi.category.replace("_", " ")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "clusters" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-400">
                  <span>SHOWING {filteredClusters.length} CLUSTERS</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showClusters}
                      onChange={(e) => setShowClusters(e.target.checked)}
                      className="accent-emerald-500 w-3 h-3"
                    />
                    <span>Visible</span>
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
                        ? "bg-cyan-950/50 border-cyan-500"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-white">{cluster.name}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          cluster.accessibilityScore < 50
                            ? "text-red-400"
                            : cluster.accessibilityScore < 75
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {cluster.accessibilityScore}/100
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {cluster.primaryCommodity} ({cluster.weeklyAgroOutputTons}T/wk) &bull; {cluster.district}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "corridors" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-400">
                  <span>MULTIMODAL ARTERIES ({filteredCorridors.length})</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showCorridors}
                      onChange={(e) => setShowCorridors(e.target.checked)}
                      className="accent-emerald-500 w-3 h-3"
                    />
                    <span>Visible</span>
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
                        ? "bg-emerald-950/50 border-emerald-500"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-white">{c.name}</span>
                      <span className="text-[9px] uppercase font-mono px-1 rounded bg-neutral-800 text-neutral-300">
                        {c.mode}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5 flex justify-between">
                      <span>{c.distanceKm} km &bull; {c.currentEtaHours} hrs</span>
                      <span className={c.status === "blocked_critical" ? "text-red-400 font-bold" : c.status === "moderate_risk" ? "text-amber-400" : "text-emerald-400"}>
                        {c.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "risks" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-400">
                  <span>DISASTER WARNING ZONES</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRisks}
                      onChange={(e) => setShowRisks(e.target.checked)}
                      className="accent-red-500 w-3 h-3"
                    />
                    <span>Visible</span>
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
                        ? "bg-red-950/50 border-red-500"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-red-300">{risk.name}</span>
                      <span className="text-[9px] bg-red-900/80 text-red-200 px-1 rounded uppercase font-mono">
                        {risk.severity}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {risk.category.replace("_", " ")} &bull; {risk.locationDescription}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "fleet" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-400">
                  <span>ACTIVE TELEMETRY VEHICLES</span>
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono cursor-pointer ${
                      isSimulating ? "bg-emerald-900 text-emerald-300" : "bg-neutral-800 text-neutral-400"
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
                        ? "bg-purple-950/50 border-purple-500"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-white">{v.name}</span>
                      <span className="text-emerald-400 text-[10px]">{v.speedKmH} km/h</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      {v.type} &bull; {v.usedKg}kg / {v.capacityKg}kg ({v.utilizationPct}%)
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "backhaul" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1 text-[10px] text-neutral-400">
                  <span>CIRCULAR BACKHAUL MATCHES</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showBackhauls}
                      onChange={(e) => setShowBackhauls(e.target.checked)}
                      className="accent-emerald-500 w-3 h-3"
                    />
                    <span>Visible</span>
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
                        ? "bg-emerald-950/50 border-emerald-500"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-white">{opp.destinationLocation}</span>
                      <span className="text-emerald-400 text-[10px] font-bold">
                        &#8377;{opp.fuelCostSavingsInr.toLocaleString("en-US")} Saved
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      &rarr; {opp.targetDestination} &bull; {opp.availableReturnCargo}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Visibility Filter Toggles */}
          <div className="p-2 border-t border-neutral-800 bg-neutral-950/90 flex items-center justify-between text-[10px] text-neutral-400">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHubs}
                  onChange={(e) => setShowHubs(e.target.checked)}
                  className="accent-emerald-500 w-3 h-3"
                />
                <span>Hubs</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPois}
                  onChange={(e) => setShowPois(e.target.checked)}
                  className="accent-rose-500 w-3 h-3"
                />
                <span>POIs</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showClusters}
                  onChange={(e) => setShowClusters(e.target.checked)}
                  className="accent-cyan-500 w-3 h-3"
                />
                <span>Clusters</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRisks}
                  onChange={(e) => setShowRisks(e.target.checked)}
                  className="accent-red-500 w-3 h-3"
                />
                <span>Risks</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFleet}
                  onChange={(e) => setShowFleet(e.target.checked)}
                  className="accent-purple-500 w-3 h-3"
                />
                <span>Fleet</span>
              </label>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT AI COPILOT & DEEP INSPECTION PANEL                            */}
        {/* =================================================================== */}
        {selectedEntity && (
          <div className="absolute top-4 right-4 z-10 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100%-2rem)] flex flex-col bg-[#0f0f15]/95 backdrop-blur-md rounded-xl border border-neutral-700 shadow-2xl overflow-hidden font-mono text-xs">
            {/* Header */}
            <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-950/80">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                  AI DIGITAL TWIN INSPECTOR &bull; {selectedEntity.type.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setSelectedEntity(null)}
                className="text-neutral-400 hover:text-white font-bold px-1 text-sm cursor-pointer"
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
                    <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>✚ ESSENTIAL POI &bull; {selectedEntity.data.categoryLabel}</span>
                    </div>
                    <h2 className="text-base font-bold text-white mt-0.5">{selectedEntity.data.name}</h2>
                    <div className="text-neutral-400 text-[11px] mt-0.5">
                      {selectedEntity.data.district}, {selectedEntity.data.state} &bull; Elev {selectedEntity.data.elevation_m}m
                    </div>
                  </div>

                  {/* Accessibility Score Gauge */}
                  <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-neutral-400 uppercase">AI Accessibility Score</div>
                      <div
                        className={`text-2xl font-black ${
                          selectedEntity.data.accessibilityScore >= 75
                            ? "text-emerald-400"
                            : selectedEntity.data.accessibilityScore >= 50
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {selectedEntity.data.accessibilityScore}
                        <span className="text-xs text-neutral-500 font-normal"> / 100</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-neutral-400 uppercase">Cold Chain Ready</div>
                      <div className="font-bold text-cyan-300">
                        {selectedEntity.data.isColdChainEquipped ? "❄️ Active Reefer Vault" : "Ambient Storage"}
                      </div>
                    </div>
                  </div>

                  {/* 5-Factor Score Decomposition */}
                  <div className="space-y-1.5 bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800 text-[10px]">
                    <div className="text-neutral-400 uppercase font-bold text-[9px] mb-1">
                      5-Factor Accessibility Decomposition
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">PMGSY Road Connectivity</span>
                      <span className="text-white font-bold">{selectedEntity.data.scoreBreakdown.roadConnectivity} / 25</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">SRTM Terrain & Elevation</span>
                      <span className="text-white font-bold">{selectedEntity.data.scoreBreakdown.terrainElevation} / 20</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Rail & Waterway Proximity</span>
                      <span className="text-white font-bold">{selectedEntity.data.scoreBreakdown.multimodalProximity} / 20</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Disaster & Flood Safety</span>
                      <span className="text-white font-bold">{selectedEntity.data.scoreBreakdown.disasterSafety} / 20</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300">Facility Readiness & Hub Access</span>
                      <span className="text-white font-bold">{selectedEntity.data.scoreBreakdown.facilityReadiness} / 15</span>
                    </div>
                  </div>

                  {/* Capacity & Operational Note */}
                  <div className="bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800 text-[11px] space-y-1">
                    <div className="text-[10px] text-neutral-400">Operational Capacity:</div>
                    <div className="text-white font-semibold">{selectedEntity.data.operationalCapacity}</div>
                    <div className="text-neutral-400 text-[10px] pt-1 border-t border-neutral-800">
                      {selectedEntity.data.notes}
                    </div>
                  </div>
                </>
              )}

              {/* HUB DETAIL */}
              {selectedEntity.type === "hub" && (
                <>
                  <div>
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                      {selectedEntity.data.tier.replace("_", " ")} &bull; {selectedEntity.data.state}
                    </div>
                    <h2 className="text-base font-bold text-white">{selectedEntity.data.name}</h2>
                    <div className="text-neutral-400 text-[11px] mt-0.5">{selectedEntity.data.roleTag}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
                    <div>
                      <div className="text-[10px] text-neutral-400">Elevation</div>
                      <div className="font-bold text-white">{selectedEntity.data.elevation_m} meters</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Capacity Utilization</div>
                      <div className="font-bold text-emerald-400">
                        {Math.round((selectedEntity.data.usedKg / selectedEntity.data.capacityKg) * 100)}% (
                        {(selectedEntity.data.usedKg / 1000).toFixed(0)}T / {(selectedEntity.data.capacityKg / 1000).toFixed(0)}T)
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Active Loading Docks</div>
                      <div className="font-bold text-white">{selectedEntity.data.activeDocks} Docks Online</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Power Reliability</div>
                      <div className="font-bold text-cyan-300 uppercase">{selectedEntity.data.powerReliability}</div>
                    </div>
                  </div>

                  {/* Multimodal Capabilities */}
                  <div>
                    <div className="text-[10px] text-neutral-400 uppercase font-bold mb-1.5">
                      Multimodal Interfaces
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {selectedEntity.data.capabilities.road && (
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded">
                          ✓ Road Terminal
                        </span>
                      )}
                      {selectedEntity.data.capabilities.rail && (
                        <span className="bg-purple-950 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded">
                          ✓ Broad Gauge Rail
                        </span>
                      )}
                      {selectedEntity.data.capabilities.inland_waterway && (
                        <span className="bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2 py-0.5 rounded">
                          ✓ NW-2 Inland Port
                        </span>
                      )}
                      {selectedEntity.data.capabilities.air && (
                        <span className="bg-sky-950 text-sky-300 border border-sky-700/60 px-2 py-0.5 rounded">
                          ✓ Air Cargo Bay
                        </span>
                      )}
                      {selectedEntity.data.capabilities.cold_storage && (
                        <span className="bg-blue-950 text-blue-300 border border-blue-700/60 px-2 py-0.5 rounded">
                          ✓ Cold Chain Reefer
                        </span>
                      )}
                    </div>
                  </div>

                  {/* AI Copilot Advice */}
                  <div className="bg-emerald-950/40 border border-emerald-600/50 p-2.5 rounded-lg text-[11px] text-emerald-200">
                    <div className="font-bold text-emerald-400 uppercase text-[10px] mb-1 flex items-center gap-1">
                      <span>🧠 AI Hub Optimization Directive</span>
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
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                      Rural Cluster &bull; {selectedEntity.data.district}, {selectedEntity.data.state}
                    </div>
                    <h2 className="text-base font-bold text-white">{selectedEntity.data.name}</h2>
                    <div className="text-neutral-400 text-[11px] mt-0.5">
                      Terrain: {selectedEntity.data.terrainDifficulty}
                    </div>
                  </div>

                  {/* Accessibility Gauge */}
                  <div className="bg-neutral-900/80 p-3 rounded-lg border border-neutral-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-neutral-400 font-bold">Accessibility Score</span>
                      <span
                        className={`font-bold ${
                          selectedEntity.data.accessibilityScore < 50
                            ? "text-red-400"
                            : selectedEntity.data.accessibilityScore < 75
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {selectedEntity.data.accessibilityScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          selectedEntity.data.accessibilityScore < 50
                            ? "bg-red-500"
                            : selectedEntity.data.accessibilityScore < 75
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${selectedEntity.data.accessibilityScore}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-neutral-400 flex justify-between pt-1">
                      <span>RoadSense IRI: {selectedEntity.data.roadSenseIRI} (Roughness)</span>
                      <span>Elev: {selectedEntity.data.elevation_m}m</span>
                    </div>
                  </div>

                  {/* Production & Healthcare */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800">
                      <div className="text-[10px] text-neutral-400">Primary Produce</div>
                      <div className="font-bold text-emerald-400">{selectedEntity.data.primaryCommodity}</div>
                      <div className="text-[9px] text-neutral-500">{selectedEntity.data.weeklyAgroOutputTons} Tons/week</div>
                    </div>
                    <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800">
                      <div className="text-[10px] text-neutral-400">PHC Health Clinics</div>
                      <div className="font-bold text-cyan-400">{selectedEntity.data.healthCentresCount} Centres Active</div>
                      <div className="text-[9px] text-neutral-500">Vaccine cold-storage tied</div>
                    </div>
                  </div>

                  <div className="bg-cyan-950/40 border border-cyan-700/50 p-2.5 rounded-lg text-[11px] text-cyan-200">
                    <div className="font-bold text-cyan-400 uppercase text-[10px] mb-1">
                      🌾 FPO Agro Dispatch Recommendation
                    </div>
                    {selectedEntity.data.currentDemandSummary} &bull; Suggested 4WD EV mini-truck dispatch from parent hub.
                  </div>
                </>
              )}

              {/* DISASTER RISK DETAIL */}
              {selectedEntity.type === "risk" && (
                <>
                  <div>
                    <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">
                      ACTIVE BOTTLENECK ALERT &bull; {selectedEntity.data.category.replace("_", " ")}
                    </div>
                    <h2 className="text-base font-bold text-red-200">{selectedEntity.data.name}</h2>
                    <div className="text-neutral-400 text-[11px] mt-0.5">{selectedEntity.data.locationDescription}</div>
                  </div>

                  <div className="bg-red-950/40 p-3 rounded-lg border border-red-800/80 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-300 font-bold">Severity Level</span>
                      <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                        {selectedEntity.data.severity}
                      </span>
                    </div>
                    <div className="text-neutral-300 text-[11px]">{selectedEntity.data.impactSummary}</div>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-600/60 p-2.5 rounded-lg text-[11px] text-emerald-200">
                    <div className="font-bold text-emerald-400 uppercase text-[10px] mb-1">
                      🔄 AI Autonomous Detour Protocol
                    </div>
                    {selectedEntity.data.aiRerouteRecommendation}
                  </div>
                </>
              )}

              {/* FLEET TELEMETRY DETAIL */}
              {selectedEntity.type === "vehicle" && (
                <>
                  <div>
                    <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                      LIVE FLEET TELEMETRY &bull; {selectedEntity.data.name}
                    </div>
                    <h2 className="text-base font-bold text-white">{selectedEntity.data.type}</h2>
                    <div className="text-neutral-400 text-[11px] mt-0.5">
                      Driver: {selectedEntity.data.driverName} &bull; Location: {selectedEntity.data.currentLocationName}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
                    <div>
                      <div className="text-[10px] text-neutral-400">Current Speed</div>
                      <div className="font-bold text-emerald-400">{selectedEntity.data.speedKmH} km/h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Load / Capacity</div>
                      <div className="font-bold text-white">
                        {selectedEntity.data.usedKg}kg ({selectedEntity.data.utilizationPct}%)
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Fuel / Battery</div>
                      <div className="font-bold text-cyan-300">{Math.round(selectedEntity.data.batteryOrFuelPct)}% State</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Status</div>
                      <div className="font-bold text-amber-300 uppercase">{selectedEntity.data.status.replace("_", " ")}</div>
                    </div>
                  </div>

                  {selectedEntity.data.tempControlled && (
                    <div className="bg-blue-950/40 border border-blue-700/60 p-2.5 rounded-lg">
                      <div className="text-cyan-400 font-bold uppercase text-[10px] mb-1 flex justify-between">
                        <span>❄️ Active Cold-Chain Reefer</span>
                        <span className="text-emerald-400">SETPOINT: {selectedEntity.data.targetTempC}°C</span>
                      </div>
                      <div className="text-base font-bold text-white">{selectedEntity.data.chamberTempC}°C</div>
                      <div className="text-[10px] text-neutral-400 mt-0.5">
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
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                      {selectedEntity.data.id.toUpperCase()} &bull; {selectedEntity.data.mode.toUpperCase()}
                    </div>
                    <h2 className="text-base font-bold text-white">{selectedEntity.data.name}</h2>
                    <div className="text-neutral-400 text-[11px] mt-0.5">
                      Weather: {selectedEntity.data.weatherCondition} &bull; IRI: {selectedEntity.data.roadRoughnessIRI}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
                    <div>
                      <div className="text-[10px] text-neutral-400">Total Distance</div>
                      <div className="font-bold text-white">{selectedEntity.data.distanceKm} km</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Transit Duration</div>
                      <div className="font-bold text-emerald-400">{selectedEntity.data.currentEtaHours} Hours</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Terrain Gradient</div>
                      <div className="font-bold text-amber-300">{selectedEntity.data.gradientPct}% Max Slope</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Elevation Gain</div>
                      <div className="font-bold text-cyan-300">+{selectedEntity.data.elevationGainM}m</div>
                    </div>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-600/60 p-2.5 rounded-lg text-[11px] text-emerald-200">
                    <div className="font-bold text-emerald-400 uppercase text-[10px] mb-1">
                      🛣️ Multimodal Corridor Intelligence
                    </div>
                    Status: {selectedEntity.data.status.toUpperCase()} &bull; {selectedEntity.data.recommendation}
                  </div>
                </>
              )}

              {/* BACKHAUL DETAIL */}
              {selectedEntity.type === "backhaul" && (
                <>
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      CIRCULAR BACKHAUL MATCH &bull; ZERO-DEADHEAD
                    </div>
                    <h2 className="text-base font-bold text-white">{selectedEntity.data.availableReturnCargo}</h2>
                    <div className="text-neutral-400 text-[11px] mt-0.5">
                      {selectedEntity.data.destinationLocation} &rarr; {selectedEntity.data.targetDestination}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
                    <div>
                      <div className="text-[10px] text-neutral-400">Economic Value</div>
                      <div className="font-bold text-emerald-400">&#8377;{selectedEntity.data.fuelCostSavingsInr.toLocaleString("en-US")}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Carbon Abatement</div>
                      <div className="font-bold text-cyan-300">-{selectedEntity.data.co2ReductionKg}kg CO₂</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Weight & Commodity</div>
                      <div className="font-bold text-white">{selectedEntity.data.availableWeightKg}kg ({selectedEntity.data.returnCommodity})</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-400">Producer Entity</div>
                      <div className="font-bold text-white text-[10px]">{selectedEntity.data.producerGroup}</div>
                    </div>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-600/60 p-2.5 rounded-lg text-[11px] text-emerald-200">
                    <div className="font-bold text-emerald-400 uppercase text-[10px] mb-1">
                      ♻️ Return Logistics Efficiency
                    </div>
                    Eliminates {selectedEntity.data.emptyMilesEliminatedKm}km of empty return miles on the return descent leg.
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* SIH GUIDED WALKTHROUGH OVERLAY                                      */}
        {/* =================================================================== */}
        {tourActive && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl bg-[#0c0c12]/95 backdrop-blur-lg border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl font-mono text-neutral-100">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-neutral-950 font-bold text-[10px] px-2 py-0.5 rounded">
                  SIH DEMO MODE
                </span>
                <span className="text-xs font-bold text-white uppercase">
                  Step {tourStep + 1} of {TOUR_STEPS.length}
                </span>
              </div>
              <button
                onClick={() => setTourActive(false)}
                className="text-neutral-400 hover:text-white text-xs font-bold px-2 py-0.5 cursor-pointer"
              >
                ✕ Exit Tour
              </button>
            </div>

            <h3 className="font-bold text-sm text-emerald-400 mb-1">{TOUR_STEPS[tourStep].title}</h3>
            <p className="text-xs text-neutral-300 leading-relaxed mb-3">{TOUR_STEPS[tourStep].narration}</p>

            <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
              <div className="text-[11px] text-neutral-400">
                Focus: <span className="text-cyan-300 font-semibold">{TOUR_STEPS[tourStep].highlight}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevTourStep}
                  disabled={tourStep === 0}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 rounded text-xs text-white cursor-pointer"
                >
                  &larr; Prev
                </button>
                <button
                  onClick={handleNextTourStep}
                  className="px-4 py-1 bg-emerald-500 hover:bg-emerald-400 font-bold text-neutral-950 rounded text-xs cursor-pointer"
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
