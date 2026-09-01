"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import OpeningScreen from "../../components/OpeningScreen";
import RuralChatbot from "../../components/ai/RuralChatbot";
import SwissLogisticsMap from "../../components/map/SwissLogisticsMap";
import { OfflineSyncManager } from "../../lib/offline/syncStore";
import {
  runDynamicMatching,
  getFairnessMetrics,
  getAllocationHistory,
} from "../../lib/api/dispatch";
import {
  getVehicles,
  createVehicle,
} from "../../lib/api/vehicles";
import {
  getRoadConditions,
  reportRoadCondition,
} from "../../lib/api/roadConditions";
import {
  getShipments,
  createShipment,
} from "../../lib/api/shipments";
import {
  StarburstIcon,
  AiBrainIcon,
  InfoCircleIcon,
  PulseIcon,
  RouteIcon,
  ShieldCheckIcon,
  ThermometerIcon,
  SlidersIcon,
  ArrowRightIcon,
  ArrowUpRightIcon,
  TruckIcon,
  CheckmarkCircleIcon,
  AlertCircleIcon,
  RefreshIcon,
  CubeIcon,
  CpuIcon,
  DatabaseIcon,
  SendIcon,
  SunIcon,
  LeafIcon,
  BatteryIcon,
} from "../../components/icons/Hugeicons";
import {
  Shipment,
  Vehicle,
  VehicleType,
  GoodType,
  UrgencyLevel,
  RoadCondition,
  DispatchMatchItem,
  FairnessMetricsResponse,
  AllocationHistory,
  OfflineSyncState,
} from "../../types";

// ==========================================
// MOCK & INITIAL FALLBACK DATA
// ==========================================

interface HubItem {
  id: string;
  name: string;
  code: string;
  region: string;
  type: "aggregation_point" | "informal_cold_storage" | "warehouse" | "crossdock";
  power: "solar" | "unreliable" | "grid";
  capacityKg: number;
  usedKg: number;
  tempZones: string[];
  activeDocks: number;
  riskStatus: "Optimal" | "Moderate" | "Constrained";
}

const INITIAL_HUBS: HubItem[] = [
  { id: "v_a", name: "Village A (Pipili Rural Cluster)", code: "VIL-A", region: "Puri-BBS Agri Belt", type: "aggregation_point", power: "solar", capacityKg: 25000, usedKg: 18500, tempZones: ["+4°C Horticulture", "+12°C Floriculture"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "v_b", name: "Village B (Khordha Dairy Cluster)", code: "VIL-B", region: "Khordha Rural", type: "aggregation_point", power: "unreliable", capacityKg: 35000, usedKg: 29000, tempZones: ["+2°C to +4°C Raw Milk", "Chilled Produce"], activeDocks: 5, riskStatus: "Optimal" },
  { id: "v_c", name: "Village C (Nimapada Agro Belt)", code: "VIL-C", region: "Nimapada Perishables", type: "informal_cold_storage", power: "solar", capacityKg: 30000, usedKg: 22000, tempZones: ["+4°C Dairy Sweets", "+8°C Vegetables"], activeDocks: 4, riskStatus: "Optimal" },
  { id: "v_d", name: "Village D (Banki Riverine Farms)", code: "VIL-D", region: "Mahanadi Basin", type: "aggregation_point", power: "unreliable", capacityKg: 20000, usedKg: 14000, tempZones: ["+2°C Fresh Fish", "+10°C Organic Greens"], activeDocks: 3, riskStatus: "Moderate" },
  { id: "bbs", name: "Bhubaneswar Central Cold Hub", code: "BBS-HUB", region: "Odisha Central", type: "warehouse", power: "grid", capacityKg: 120000, usedKg: 92000, tempZones: ["-25°C Frozen", "+4°C Chilled", "+2°C Pharma"], activeDocks: 18, riskStatus: "Optimal" },
  { id: "ctc", name: "Cuttack Crossdock Terminal", code: "CTC-XDK", region: "Odisha North-Central", type: "crossdock", power: "grid", capacityKg: 85000, usedKg: 64000, tempZones: ["+4°C Chilled Dairy", "-18°C Frozen"], activeDocks: 12, riskStatus: "Optimal" },
  { id: "puri", name: "Puri Coastal Depot", code: "PURI-DEPOT", region: "Coastal South", type: "aggregation_point", power: "grid", capacityKg: 45000, usedKg: 28000, tempZones: ["-18°C Seafood", "+4°C Dairy"], activeDocks: 6, riskStatus: "Optimal" },
  { id: "pdp", name: "Paradeep Port Deepwater Terminal", code: "PDP-PORT", region: "Coastal East", type: "warehouse", power: "grid", capacityKg: 190000, usedKg: 162000, tempZones: ["-25°C Marine Export", "+4°C Chilled"], activeDocks: 24, riskStatus: "Moderate" },
];

interface PickupItem {
  id: string;
  waybill: string;
  origin: string;
  destination: string;
  goodType: GoodType;
  urgency: UrgencyLevel;
  producer: string;
  community: string;
  commodity: string;
  weightKg: number;
  tempClass: "frozen" | "chilled" | "ambient";
  targetTemp: string;
  waitTimeMins: number;
  status: "Pending" | "Dispatched" | "In Transit" | "Delivered";
}

const INITIAL_PICKUPS: PickupItem[] = [
  { id: "p1", waybill: "RUR-90141", origin: "Village A (Pipili Cluster)", destination: "Bhubaneswar Central Cold Hub", goodType: "farm_produce", urgency: "high", producer: "Pipili Organic Floriculture Samiti", community: "comm-pipili", commodity: "Export Betel Leaves & Fresh Marigolds", weightKg: 350, tempClass: "chilled", targetTemp: "+12.0°C", waitTimeMins: 45, status: "Pending" },
  { id: "p2", waybill: "RUR-90142", origin: "Village B (Khordha Dairy)", destination: "Bhubaneswar Central Cold Hub", goodType: "farm_produce", urgency: "high", producer: "Khordha Women's Dairy Cooperative", community: "comm-khordha", commodity: "Chilled Raw Cow & Buffalo Milk", weightKg: 850, tempClass: "chilled", targetTemp: "+3.5°C", waitTimeMins: 70, status: "Pending" },
  { id: "p3", waybill: "RUR-90143", origin: "Village C (Nimapada Agro)", destination: "Cuttack Crossdock Terminal", goodType: "farm_produce", urgency: "routine", producer: "Nimapada Chenapoda Guild", community: "comm-nimapada", commodity: "Fresh Chenapoda & Cottage Cheese", weightKg: 420, tempClass: "chilled", targetTemp: "+4.0°C", waitTimeMins: 120, status: "Pending" },
  { id: "p4", waybill: "RUR-90144", origin: "Village D (Banki Farms)", destination: "Bhubaneswar Central Cold Hub", goodType: "farm_produce", urgency: "routine", producer: "Banki Riverine Fishermen Union", community: "comm-banki", commodity: "Fresh Riverine Hilsa & Carp Catch", weightKg: 280, tempClass: "chilled", targetTemp: "+2.0°C", waitTimeMins: 160, status: "Pending" },
  { id: "p5", waybill: "RUR-90145", origin: "Village A (Pipili Cluster)", destination: "Bhubaneswar Central Cold Hub", goodType: "medicine", urgency: "critical", producer: "Pipili Primary Health Sub-Centre", community: "comm-pipili", commodity: "Maternal & Child Vaccines (Cold-Chain)", weightKg: 25, tempClass: "chilled", targetTemp: "+3.0°C", waitTimeMins: 30, status: "Pending" },
  { id: "p6", waybill: "RUR-90146", origin: "Village D (Banki Farms)", destination: "Cuttack Crossdock Terminal", goodType: "medicine", urgency: "critical", producer: "Banki Rural Health Dispensary", community: "comm-banki", commodity: "Anti-Venom & Emergency Insulin Vials", weightKg: 15, tempClass: "chilled", targetTemp: "+4.0°C", waitTimeMins: 55, status: "Pending" },
  { id: "p7", waybill: "RUR-90147", origin: "Village C (Nimapada Agro)", destination: "Bhubaneswar Central Cold Hub", goodType: "essential_goods", urgency: "routine", producer: "Prachi Valley Self-Help Group", community: "comm-nimapada", commodity: "Nutritional Grain & Ration Packets", weightKg: 650, tempClass: "ambient", targetTemp: "+22.0°C", waitTimeMins: 95, status: "Pending" },
];

export default function HomePage() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const [showIntro, setShowIntro] = useState(false);
  const [reticleRotation, setReticleRotation] = useState(0);

  // Offline Sync State
  const [syncState, setSyncState] = useState<OfflineSyncState>({
    isOnline: true,
    pendingCount: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Section 00: Quick parameter simulator
  const [originHero, setOriginHero] = useState("Village A (Pipili Rural Cluster)");
  const [destHero, setDestHero] = useState("Bhubaneswar Central Cold Hub");
  const [goodTypeHero, setGoodTypeHero] = useState<GoodType>("farm_produce");
  const [urgencyHero, setUrgencyHero] = useState<UrgencyLevel>("high");
  const [roadConditionHero, setRoadConditionHero] = useState<RoadCondition>("paved");
  const [ambientTempHero, setAmbientTempHero] = useState(36);

  // Section 01: Hub matrix
  const [selectedHub, setSelectedHub] = useState<HubItem>(INITIAL_HUBS[0]);

  // Section 02: Pickups queue & Creation Form
  const [pickups, setPickups] = useState<PickupItem[]>(INITIAL_PICKUPS);
  const [pickupFilter, setPickupFilter] = useState<string>("all");
  const [newOrigin, setNewOrigin] = useState("Village A (Pipili Rural Cluster)");
  const [newDest, setNewDest] = useState("Bhubaneswar Central Cold Hub");
  const [newProducer, setNewProducer] = useState("Pipili Organic Farmers SHG");
  const [newCommodity, setNewCommodity] = useState("Fresh Seasonal Vegetables");
  const [newGoodType, setNewGoodType] = useState<GoodType>("farm_produce");
  const [newUrgency, setNewUrgency] = useState<UrgencyLevel>("high");
  const [newWeight, setNewWeight] = useState(350);

  // Section 03: Dynamic Dispatch Matcher
  const [isMatching, setIsMatching] = useState(false);
  const [extendWindow, setExtendWindow] = useState(false);
  const [matchResults, setMatchResults] = useState<DispatchMatchItem[]>([]);
  const [fairnessSummaryText, setFairnessSummaryText] = useState<string>(
    "Dynamic matching engine initialized. Allocations weighted by urgency, spoilage risk, and historical community wait times."
  );

  // Section 04: Arrhenius Kinetics Simulator
  const [kineticsTemp, setKineticsTemp] = useState(36);
  const [kineticsDurationHrs, setKineticsDurationHrs] = useState(12);
  const [hasSolarBuffer, setHasSolarBuffer] = useState(true);

  // Section 05: Fairness Dashboard
  const [fairnessData, setFairnessData] = useState<FairnessMetricsResponse | null>(null);
  const [backendHubs, setBackendHubs] = useState<{ id: string; name: string }[]>([]);

  // Section 06: Live Road Conditions & Reporting
  const [roadAlerts, setRoadAlerts] = useState<
    { id: string; time: string; corridor: string; condition: string; notes: string; status: string; color: string }[]
  >([
    { id: "ra-1", time: "18:14 IST", corridor: "Village D (Banki) ⇄ Cuttack Feeder", condition: "Flood Risk Alert", notes: "Mahanadi basin tributary waterlogging near km 12; light autos rerouted to high-clearance tractors.", status: "Active Caution", color: "text-rose-600" },
    { id: "ra-2", time: "17:30 IST", corridor: "Village C (Nimapada) ⇄ Bhubaneswar Hub", condition: "Unpaved Section", notes: "Unpaved gravel stretch after heavy shower; +15m transit buffer automatically applied.", status: "Handled", color: "text-amber-600" },
    { id: "ra-3", time: "16:45 IST", corridor: "Village A (Pipili) ⇄ Bhubaneswar Hub", condition: "Paved Arterial", notes: "Highway corridor clear; solar reefer tempo dispatched with full load.", status: "Optimal", color: "text-emerald-600" },
    { id: "ra-4", time: "15:20 IST", corridor: "Village B (Khordha) ⇄ Bhubaneswar Hub", condition: "Paved Road", notes: "Raw milk cold buffer verified; zero thermal excursion recorded.", status: "Optimal", color: "text-emerald-600" },
  ]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCorridor, setReportCorridor] = useState("Village D (Banki Riverine Farms) ⇄ Cuttack Crossdock");
  const [reportCondition, setReportCondition] = useState<RoadCondition>("flood_risk");
  const [reportNotes, setReportNotes] = useState("");
  const [reportAuthor, setReportAuthor] = useState("Field Agent (Driver)");

  const communityBreakdown = useMemo(() => {
    if (fairnessData && fairnessData.community_breakdown && fairnessData.community_breakdown.length > 0) {
      const commNameMap: Record<string, string> = {
        "comm-pipili": "Village A (Pipili Rural Cluster)",
        "comm-khordha": "Village B (Khordha Dairy Cluster)",
        "comm-nimapada": "Village C (Nimapada Agro Belt)",
        "comm-banki": "Village D (Banki Riverine Farms)",
      };
      return fairnessData.community_breakdown.map((c) => ({
        name: commNameMap[c.community_id] || c.community_id,
        avgWait: Math.round(c.average_wait_time_minutes),
        maxWait: Math.round(c.max_wait_time_minutes),
        matches: c.total_allocations,
        score: c.fairness_index,
      }));
    }
    return [
      { name: "Village A (Pipili Rural Cluster)", avgWait: 42, maxWait: 90, matches: 14, score: 0.96 },
      { name: "Village B (Khordha Dairy Cluster)", avgWait: 55, maxWait: 110, matches: 12, score: 0.94 },
      { name: "Village C (Nimapada Agro Belt)", avgWait: 62, maxWait: 125, matches: 9, score: 0.92 },
      { name: "Village D (Banki Riverine Farms)", avgWait: 78, maxWait: 140, matches: 8, score: 0.90 },
    ];
  }, [fairnessData]);

  // Initial intro check and offline sync subscription
  useEffect(() => {
    const hasSeen = sessionStorage.getItem("cargomind_intro_seen");
    if (!hasSeen) {
      setShowIntro(true);
    }

    const unsubscribe = OfflineSyncManager.subscribe((state) => {
      setSyncState(state);
    });

    // Fetch initial fairness metrics, road conditions, and hubs
    getFairnessMetrics()
      .then((data) => setFairnessData(data))
      .catch((e) => console.warn("Backend fairness metrics unavailable (using demo baseline)", e));

    getRoadConditions()
      .then((data) => {
        if (data && data.length > 0) {
          const liveAlerts = data.slice(0, 6).map((rc) => ({
            id: rc.id,
            time: new Date(rc.reported_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " IST",
            corridor: rc.route_id ? `Corridor ${rc.route_id.substring(0, 8)}...` : "Rural Feeder Corridor",
            condition: rc.condition === "flood_risk" ? "Flood Risk Alert" : rc.condition === "unpaved" ? "Unpaved Section" : rc.condition === "seasonal" ? "Seasonal Washout" : "Paved Road",
            notes: rc.notes || `Live observation: ${rc.condition.replace("_", " ")} corridor.`,
            status: rc.condition === "flood_risk" ? "Active Caution" : rc.condition === "unpaved" ? "Handled" : "Optimal",
            color: rc.condition === "flood_risk" ? "text-rose-600" : rc.condition === "unpaved" ? "text-amber-600" : "text-emerald-600",
          }));
          setRoadAlerts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = liveAlerts.filter((l) => !existingIds.has(l.id));
            return [...newOnes, ...prev];
          });
        }
      })
      .catch(() => {});

    return () => unsubscribe();
  }, []);

  // Filtered pickups
  const filteredPickups = useMemo(() => {
    if (pickupFilter === "all") return pickups;
    if (pickupFilter === "medicine") return pickups.filter((p) => p.goodType === "medicine");
    if (pickupFilter === "produce") return pickups.filter((p) => p.goodType === "farm_produce");
    if (pickupFilter === "critical") return pickups.filter((p) => p.urgency === "critical");
    return pickups.filter((p) => p.status.toLowerCase() === pickupFilter.toLowerCase());
  }, [pickups, pickupFilter]);

  // Handle Manual Offline Flush
  const handleManualSync = async () => {
    setIsSyncing(true);
    const res = await OfflineSyncManager.flushQueue();
    setIsSyncing(false);
    if (res.success && res.synced > 0) {
      alert(`Synchronized ${res.synced} offline queued records to central server.`);
    }
  };

  // Handle Ingesting a new rural pickup (Offline First)
  const handleCreatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `p-${Date.now()}`;
    const randomWB = `RUR-${Math.floor(80000 + Math.random() * 9000)}`;
    const comm = newOrigin.includes("Pipili")
      ? "comm-pipili"
      : newOrigin.includes("Khordha")
      ? "comm-khordha"
      : newOrigin.includes("Nimapada")
      ? "comm-nimapada"
      : "comm-banki";

    const newItem: PickupItem = {
      id: newId,
      waybill: randomWB,
      origin: newOrigin,
      destination: newDest,
      goodType: newGoodType,
      urgency: newUrgency,
      producer: newProducer,
      community: comm,
      commodity: newCommodity,
      weightKg: Number(newWeight),
      tempClass: newGoodType === "medicine" ? "chilled" : "chilled",
      targetTemp: newGoodType === "medicine" ? "+3.5°C" : "+4.0°C",
      waitTimeMins: 5,
      status: "Pending",
    };

    // 1. Update UI optimistically
    setPickups([newItem, ...pickups]);

    const originHub = backendHubs.find((h) => h.name.includes(newOrigin.split(" ")[0]))?.id || (crypto.randomUUID ? crypto.randomUUID() : "a0000000-0000-0000-0000-000000000001");
    const destHub = backendHubs.find((h) => h.name.includes(newDest.split(" ")[0]))?.id || (crypto.randomUUID ? crypto.randomUUID() : "a0000000-0000-0000-0000-000000000002");

    // 2. Queue for offline synchronization
    OfflineSyncManager.queueAction("shipment", {
      origin_hub_id: originHub,
      dest_hub_id: destHub,
      good_type: newGoodType,
      urgency: newUrgency,
      producer_id: `prod-${comm.replace("comm-", "")}-01`,
      producer_name: newProducer,
      community_id: comm,
      weight_kg: Number(newWeight),
      volume_cbm: Number(newWeight) / 250.0,
      temp_class: "chilled",
      sla_deadline: new Date(Date.now() + (newUrgency === "critical" ? 12 : 24) * 3600000).toISOString(),
    });

    if (navigator.onLine) {
      OfflineSyncManager.flushQueue();
    }
  };

  // Handle Reporting Real-Time Road Condition Hazard
  const handleReportRoadHazard = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert = {
      id: `ra-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " IST",
      corridor: reportCorridor,
      condition: reportCondition === "flood_risk" ? "Flood Risk Alert" : reportCondition === "unpaved" ? "Unpaved Section" : reportCondition === "seasonal" ? "Seasonal Washout" : "Paved Road",
      notes: reportNotes || `Reported by ${reportAuthor}: ${reportCondition.replace("_", " ")} corridor observation.`,
      status: reportCondition === "flood_risk" ? "Active Caution" : reportCondition === "unpaved" ? "Handled" : "Optimal",
      color: reportCondition === "flood_risk" ? "text-rose-600" : reportCondition === "unpaved" ? "text-amber-600" : "text-emerald-600",
    };

    setRoadAlerts((prev) => [newAlert, ...prev]);
    setShowReportModal(false);
    setReportNotes("");

    // Queue for sync
    OfflineSyncManager.queueAction("road_condition", {
      route_id: crypto.randomUUID ? crypto.randomUUID() : "b0000000-0000-0000-0000-000000000001",
      condition: reportCondition,
      reported_by: reportAuthor,
      notes: reportNotes || "Field observation report",
    });

    if (navigator.onLine) {
      OfflineSyncManager.flushQueue();
    }
  };

  // Dynamic Vehicle-to-Pickup Allocation Engine
  const handleRunDispatch = async () => {
    setIsMatching(true);
    try {
      const res = await runDynamicMatching({
        force_window_extension_hrs: extendWindow ? 4.0 : 0.0,
      });

      if (res && res.matches && res.matches.length > 0) {
        setMatchResults(res.matches);
        setFairnessSummaryText(res.fairness_summary);
        // Mark matched shipments in UI
        const matchedIds = new Set(res.matches.map((m) => String(m.shipment_id)));
        setPickups((prev) =>
          prev.map((p) => (matchedIds.has(p.id) ? { ...p, status: "Dispatched" } : p))
        );
        // Refresh fairness metrics
        getFairnessMetrics()
          .then((data) => setFairnessData(data))
          .catch(() => {});
      } else {
        // Run full dynamic client matching engine over active pending pickups
        executeClientDynamicAllocation();
      }
    } catch (e) {
      console.warn("Backend dynamic matching endpoint fallback to client allocation engine", e);
      executeClientDynamicAllocation();
    } finally {
      setIsMatching(false);
    }
  };

  const executeClientDynamicAllocation = () => {
    const pendingList = pickups.filter((p) => p.status === "Pending");
    const targetPickups = pendingList.length > 0 ? pendingList : pickups;

    const RURAL_FLEET: {
      id: string;
      name: string;
      type: VehicleType;
      capacityKg: number;
      capacityCbm: number;
      tempControl: boolean;
    }[] = [
      { id: "veh-1", name: "Pipili Solar Reefer Tempo #1", type: "tempo", capacityKg: 1800, capacityCbm: 6.5, tempControl: true },
      { id: "veh-2", name: "Pipili Rural Feeder Auto", type: "shared_auto", capacityKg: 450, capacityCbm: 2.0, tempControl: false },
      { id: "veh-3", name: "Khordha Insulated Carrier", type: "tempo", capacityKg: 2200, capacityCbm: 8.0, tempControl: true },
      { id: "veh-4", name: "Nimapada High-Payload Agro Tractor", type: "tractor", capacityKg: 3500, capacityCbm: 12.0, tempControl: false },
      { id: "veh-5", name: "Nimapada Solar Reefer Tempo", type: "tempo", capacityKg: 1500, capacityCbm: 5.5, tempControl: true },
      { id: "veh-6", name: "Banki Riverine Cargo Auto", type: "shared_auto", capacityKg: 500, capacityCbm: 2.2, tempControl: false },
      { id: "veh-7", name: "Emergency Cold-Chain Motorbike #1", type: "motorbike", capacityKg: 40, capacityCbm: 0.3, tempControl: true },
      { id: "veh-8", name: "Banki Heavy Reefer Tempo", type: "tempo", capacityKg: 2000, capacityCbm: 7.0, tempControl: true },
    ];

    // Track vehicle load during matching pass
    const vehicleLoads: Record<string, { assignedKg: number; tempClass: string | null; count: number }> = {};
    RURAL_FLEET.forEach((v) => {
      vehicleLoads[v.id] = { assignedKg: 0, tempClass: null, count: 0 };
    });

    // 1. Calculate Priority Score: Urgency + Fairness Boost + Wait Time
    const scoredPickups = targetPickups.map((p) => {
      const urgPts = p.urgency === "critical" ? 500 : p.urgency === "high" ? 300 : 100;
      const medBonus = p.goodType === "medicine" ? 200 : 0;
      const waitTime = p.waitTimeMins || 20;

      // Starvation protection for remote clusters & wait time ratio
      const starvationBonus =
        p.community === "comm-banki" ? 140 : p.community === "comm-nimapada" ? 110 : p.community === "comm-khordha" ? 90 : 70;
      const waitRatioBonus = Math.max(0, Math.round((waitTime - 40) * 2.2));
      const fairnessBoost = Math.min(300, starvationBonus + waitRatioBonus);
      const totalScore = urgPts + medBonus + fairnessBoost + Math.round(waitTime * 0.5);

      return {
        pickup: p,
        urgPts,
        medBonus,
        waitTime,
        fairnessBoost,
        totalScore,
      };
    });

    // 2. Sort descending by total score
    scoredPickups.sort((a, b) => b.totalScore - a.totalScore);

    const matches: DispatchMatchItem[] = [];
    const matchedPickupIds = new Set<string>();

    for (const item of scoredPickups) {
      const p = item.pickup;
      const requiresTemp = p.goodType === "medicine" || p.tempClass === "chilled" || p.tempClass === "frozen";

      // Find compatible vehicle
      let chosenVehicle: (typeof RURAL_FLEET)[0] | null = null;

      for (const v of RURAL_FLEET) {
        const load = vehicleLoads[v.id];
        const remainingKg = v.capacityKg - load.assignedKg;

        // Check capacity
        if (remainingKg < p.weightKg) continue;

        // Check temperature control
        if (requiresTemp && !v.tempControl) continue;

        // Check thermal isolation with existing cargo
        if (load.tempClass && load.tempClass !== p.tempClass) continue;

        // Terrain / flood risk check for Banki route if light vehicle
        if (p.community === "comm-banki" && (v.type === "motorbike" || v.type === "shared_auto") && p.weightKg > 100) {
          continue;
        }

        chosenVehicle = v;
        break;
      }

      if (chosenVehicle) {
        const load = vehicleLoads[chosenVehicle.id];
        load.assignedKg += p.weightKg;
        load.tempClass = p.tempClass;
        load.count += 1;
        matchedPickupIds.add(p.id);

        const explanation =
          p.goodType === "medicine"
            ? `Allocated temperature-controlled ${chosenVehicle.name} for critical medical cargo (${p.commodity}). Strict active thermal monitoring guarantees zero thermal degradation.`
            : p.community === "comm-khordha"
            ? `Cooperative dairy volume (${p.weightKg}kg) allocated to ${chosenVehicle.name}. +${item.fairnessBoost}pts fairness boost applied to resolve wait disparity (${item.waitTime}m).`
            : p.community === "comm-banki"
            ? `Assigned rugged ${chosenVehicle.name} for riverine cluster. Monitored road condition avoids vulnerable flood sectors.`
            : `Consolidated ${p.commodity} onto ${chosenVehicle.name}. Dynamic batch window (+${extendWindow ? "4h" : "0h"}) maximizes payload fill factor.`;

        const reasons = [
          p.goodType === "medicine"
            ? "Critical cold-chain medicine priority satisfied (insulated + active solar cooling)."
            : `Thermal compatibility isolation enforced (uniform '${p.tempClass}' cargo).`,
          `Fairness allocation boost (+${item.fairnessBoost}pts) applied to prevent remote producer starvation.`,
          extendWindow
            ? "Dynamic window extension (+4h) balanced local batch payload density with thermal bounds."
            : "Immediate dispatch scheduled within strict SLA deadline.",
          `Vehicle payload envelope satisfied: ${p.weightKg}kg assigned (fill factor ${((load.assignedKg / chosenVehicle.capacityKg) * 100).toFixed(0)}%).`,
        ];

        matches.push({
          shipment_id: p.id,
          good_type: p.goodType,
          urgency: p.urgency,
          producer_id: `prod-${p.community.replace("comm-", "")}-01`,
          producer_name: p.producer,
          community_id: p.community,
          weight_kg: p.weightKg,
          matched_vehicle_id: chosenVehicle.id,
          matched_vehicle_name: chosenVehicle.name,
          matched_vehicle_type: chosenVehicle.type,
          wait_time_minutes: item.waitTime,
          fairness_boost_pts: item.fairnessBoost,
          allocation_score: item.totalScore,
          route_mode: "local",
          dynamic_window_extended: extendWindow,
          explanation_summary: explanation,
          reasons: reasons,
        });
      }
    }

    setMatchResults(matches);
    setFairnessSummaryText(
      `Dynamic matching evaluated ${scoredPickups.length} community pickups (${matches.length} allocated to fleet, ${scoredPickups.length - matches.length} pending). Regional fairness index: 0.96. Starvation protection and urgency priority enforced.`
    );

    // Update pickups state to show Dispatched
    setPickups((prev) =>
      prev.map((p) => (matchedPickupIds.has(p.id) ? { ...p, status: "Dispatched" } : p))
    );

    // Update dynamic fairness dashboard data
    const commGroups: Record<string, { totalWait: number; maxWait: number; count: number }> = {};
    matches.forEach((m) => {
      if (!commGroups[m.community_id]) {
        commGroups[m.community_id] = { totalWait: 0, maxWait: 0, count: 0 };
      }
      commGroups[m.community_id].totalWait += m.wait_time_minutes;
      commGroups[m.community_id].maxWait = Math.max(commGroups[m.community_id].maxWait, m.wait_time_minutes);
      commGroups[m.community_id].count += 1;
    });

    const breakdown = Object.entries(commGroups).map(([commId, data]) => {
      const avgW = data.count > 0 ? data.totalWait / data.count : 45;
      const fIndex = Math.max(0.85, Math.min(1.0, 1.0 - Math.max(0, avgW - 60) / 300));
      return {
        community_id: commId,
        producer_count: data.count,
        total_allocations: data.count + 5,
        average_wait_time_minutes: Math.round(avgW),
        max_wait_time_minutes: Math.round(data.maxWait),
        critical_goods_fulfilled_pct: 100,
        fairness_index: Number(fIndex.toFixed(2)),
      };
    });

    if (breakdown.length > 0) {
      const avgFairness = Number(
        (breakdown.reduce((sum, b) => sum + b.fairness_index, 0) / breakdown.length).toFixed(2)
      );
      setFairnessData({
        overall_fairness_index: avgFairness,
        regional_avg_wait_minutes: 54,
        total_dispatches_7d: matches.length + 38,
        community_breakdown: breakdown,
        recent_allocations: [],
      });
    }
  };

  // Arrhenius Kinetics Calculation
  const arrheniusDecayRate = useMemo(() => {
    const deltaT = Math.max(0, kineticsTemp - 4);
    const solarDamping = hasSolarBuffer ? 0.45 : 1.2;
    const rawRate = ((deltaT * 0.8) * (kineticsDurationHrs / 16) * solarDamping) / 2.5;
    return Math.min(99.9, Math.max(0.02, Number(rawRate.toFixed(2))));
  }, [kineticsTemp, kineticsDurationHrs, hasSolarBuffer]);

  return (
    <>
      {showIntro && (
        <OpeningScreen forceShow={true} onComplete={() => setShowIntro(false)} />
      )}

      <main className="min-h-[calc(100vh-72px)] bg-white text-[#0a0a0a]">
        
        {/* ========================================================================= */}
        {/* TOP STATUS MARQUEE & OFFLINE HUD                                          */}
        {/* ========================================================================= */}
        <section id="overview" className="border-b border-neutral-200">
          <div className="w-full border-b border-neutral-200 overflow-hidden bg-neutral-50/70 py-2.5 px-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px]">
            <div className="flex items-center gap-6 text-neutral-700">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-semibold text-black">{t("status.engineLabel")}</span>
              </span>
              <span className="text-neutral-300">|</span>
              <span className="text-neutral-500">
                {t("status.categories")}
              </span>
            </div>

            {/* Offline Status & Sync HUD */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-neutral-200">
                <span className={`h-2 w-2 rounded-full ${syncState.isOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className="text-[10px] uppercase font-semibold">
                  {syncState.isOnline ? t("status.onlineStatus") : t("status.offlineStatus")}
                </span>
                {syncState.pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold">
                    {syncState.pendingCount} QUEUED
                  </span>
                )}
              </div>

              {syncState.pendingCount > 0 && (
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3 py-1 rounded-full bg-black text-white text-[10px] uppercase font-semibold hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshIcon size={12} className={isSyncing ? "animate-spin" : ""} />
                    <span>{isSyncing ? t("status.syncing") : t("status.syncNow")}</span>
                </button>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 00 // HERO PORTAL & DYNAMIC MATCHING SIMULATOR                    */}
          {/* ========================================================================= */}
          <div className="mx-auto max-w-[1680px]">
            <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 min-h-[640px]">
              
              {/* LEFT: Geometric Kinetic Reticle & Dispatch Telemetry */}
              <div className="relative flex flex-col justify-between p-8 sm:p-14 swiss-grid-pattern overflow-hidden group">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 border border-black flex items-center justify-center">
                      <span className="w-1 h-1 bg-black" />
                    </span>
                    <span>{t("overview.dispatchRef")}</span>
                  </div>
                  <span>{t("overview.clusters")}</span>
                </div>

                <div className="my-10 flex flex-col items-center justify-center relative">
                  <div
                    className="relative cursor-pointer transition-transform duration-700 ease-out"
                    style={{ transform: `rotate(${reticleRotation}deg)` }}
                    onClick={() => setReticleRotation((r) => r + 45)}
                    title="Click to rotate dispatch vector"
                  >
                    <svg
                      width="240"
                      height="240"
                      viewBox="0 0 250 250"
                      className="overflow-visible text-black"
                    >
                      <circle cx="125" cy="125" r="115" fill="none" stroke="#e4e4e7" strokeWidth="1" />
                      <circle cx="125" cy="125" r="85" fill="none" stroke="#f4f4f5" strokeWidth="1" strokeDasharray="4 4" />
                      <circle cx="125" cy="125" r="55" fill="none" stroke="#e4e4e7" strokeWidth="1" />

                      <line x1="0" y1="125" x2="250" y2="125" stroke="#d4d4d8" strokeWidth="0.75" />
                      <line x1="125" y1="0" x2="125" y2="250" stroke="#d4d4d8" strokeWidth="0.75" />

                      {/* 8 Primary Starburst Rays */}
                      <g className="text-black">
                        <line x1="125" y1="80" x2="125" y2="26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="125" y1="170" x2="125" y2="224" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="80" y1="125" x2="26" y2="125" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="170" y1="125" x2="224" y2="125" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <line x1="93" y1="93" x2="55" y2="55" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="157" y1="93" x2="195" y2="55" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="93" y1="157" x2="55" y2="195" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                        <line x1="157" y1="157" x2="195" y2="195" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                      </g>

                      <circle cx="125" cy="125" r="4" fill="currentColor" />
                    </svg>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="font-mono text-[11px] tracking-widest text-neutral-400 uppercase">
                      {t("overview.dynamicMatchingVector")}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-black">
                      {t("overview.engineVersion")}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 pt-6 border-t border-neutral-200 font-mono text-[11px]">
                  <div>
                    <div className="text-neutral-400 uppercase text-[9px]">{t("overview.fairnessIndex")}</div>
                    <div className="text-base font-semibold text-emerald-600 mt-0.5">0.96 (High)</div>
                  </div>
                  <div>
                    <div className="text-neutral-400 uppercase text-[9px]">{t("overview.starvationRisk")}</div>
                    <div className="text-base font-semibold text-black mt-0.5">0.0% Zero</div>
                  </div>
                  <div>
                    <div className="text-neutral-400 uppercase text-[9px]">{t("overview.coldBuffer")}</div>
                    <div className="text-base font-semibold text-amber-600 mt-0.5">{t("overview.solarProtected")}</div>
                  </div>
                </div>

              </div>

              {/* RIGHT: Editorial Copy & Live Parameter Simulator */}
              <div className="flex flex-col justify-between p-8 sm:p-14 bg-white">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-4">
                    {t("overview.networkLabel")}
                  </div>

                  <h1 className="text-4xl sm:text-5xl font-light tracking-[-0.04em] text-black leading-[1.1]">
                    {t("overview.heroHeadline")}
                    <br />
                    <span className="font-semibold">{t("overview.heroSubheadline")}</span>
                  </h1>

                  <p className="mt-5 text-base sm:text-lg text-neutral-600 font-light max-w-xl leading-relaxed">
                    {t("overview.heroDescription")}
                  </p>

                  {/* Underline Parameter Form */}
                  <div className="mt-8 pt-6 border-t border-neutral-200 space-y-5 max-w-md">
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                          {t("overview.goodTypeLabel")}
                        </label>
                        <select
                          value={goodTypeHero}
                          onChange={(e) => setGoodTypeHero(e.target.value as GoodType)}
                          className="w-full swiss-input text-xs font-semibold bg-transparent"
                        >
                          <option value="farm_produce">Farm Produce (Agri/Dairy)</option>
                          <option value="medicine">Medicines & Vaccines</option>
                          <option value="essential_goods">Essential Goods</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                          {t("overview.urgencyLabel")}
                        </label>
                        <select
                          value={urgencyHero}
                          onChange={(e) => setUrgencyHero(e.target.value as UrgencyLevel)}
                          className="w-full swiss-input text-xs font-semibold bg-transparent"
                        >
                          <option value="critical">Critical (Immediate)</option>
                          <option value="high">High Priority</option>
                          <option value="routine">Routine Batch</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                          {t("overview.terrainLabel")}
                        </label>
                        <select
                          value={roadConditionHero}
                          onChange={(e) => setRoadConditionHero(e.target.value as RoadCondition)}
                          className="w-full swiss-input text-xs font-semibold bg-transparent"
                        >
                          <option value="paved">{tc("terrain.paved")}</option>
                          <option value="unpaved">{tc("terrain.unpaved")}</option>
                          <option value="seasonal">{tc("terrain.seasonal")}</option>
                          <option value="flood_risk">{tc("terrain.floodRisk")}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                          {t("overview.ambientTempLabel")}
                        </label>
                        <input
                          type="number"
                          value={ambientTempHero}
                          onChange={(e) => setAmbientTempHero(Number(e.target.value))}
                          className="w-full swiss-input text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center font-mono text-[11px] mb-1.5">
                        <span className="text-neutral-500">{t("overview.dispatchScore")}</span>
                        <span className="font-semibold text-black">
                          {goodTypeHero === "medicine" ? 850 : urgencyHero === "critical" ? 750 : urgencyHero === "high" ? 520 : 310} PTS
                        </span>
                      </div>
                      <div className="linear-meter">
                        <div
                          className="linear-meter-fill"
                          style={{
                            width: `${goodTypeHero === "medicine" ? 95 : urgencyHero === "critical" ? 85 : urgencyHero === "high" ? 60 : 35}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Circular Action Badge */}
                <div className="mt-10 pt-6 border-t border-neutral-200 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-neutral-500">{t("overview.continuousEngine")}</div>
                    <div className="font-mono text-sm font-semibold text-black mt-0.5">
                      {pickups.filter((p) => p.status === "Pending").length} {t("overview.pendingPickups")}
                    </div>
                  </div>

                  <button
                    onClick={handleRunDispatch}
                    disabled={isMatching}
                    className="swiss-circle-btn flex-col gap-0.5 cursor-pointer"
                    title="Trigger Dynamic Matching"
                  >
                    <span>{isMatching ? t("overview.matchingButton") : t("overview.matchButton")}</span>
                    <ArrowRightIcon size={12} strokeWidth={2} />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 01 // COMMUNITY TOPOLOGY & REAL-TIME VECTOR MAP (#network)        */}
        {/* ========================================================================= */}
        <section id="network" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                {t("network.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                {t("network.title")}
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500">
              {t("network.hubCount")}
            </div>
          </div>

          {/* Interactive Swiss Vector Map of Freight Network */}
          <div className="pt-8 pb-10">
            <SwissLogisticsMap
              selectedHubId={selectedHub.id}
              onSelectHub={(hub) => {
                const found = INITIAL_HUBS.find((h) => h.id === hub.id);
                if (found) setSelectedHub(found);
              }}
            />
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 pt-8 border-t border-neutral-200">
            {/* Left 7 Cols: Tabular Rural Node Matrix */}
            <div className="lg:col-span-7 pr-0 lg:pr-10">
              <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-4">
                {t("network.selectNode")}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 font-normal">{t("network.tableHeaders.nodeType")}</th>
                      <th className="py-3 font-normal">{t("network.tableHeaders.powerSource")}</th>
                      <th className="py-3 font-normal">{t("network.tableHeaders.coldCapacity")}</th>
                      <th className="py-3 font-normal text-right">{t("network.tableHeaders.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {INITIAL_HUBS.map((hub) => {
                      const isSelected = selectedHub.id === hub.id;
                      const fillPercent = Math.round((hub.usedKg / hub.capacityKg) * 100);
                      return (
                        <tr
                          key={hub.id}
                          onClick={() => setSelectedHub(hub)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-neutral-100 font-semibold" : "hover:bg-neutral-50/80"
                          }`}
                        >
                          <td className="py-3.5 pr-2">
                            <div className="text-black">{hub.name}</div>
                            <div className="text-[10px] text-neutral-400 uppercase">{hub.type.replace("_", " ")}</div>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-sans font-semibold ${
                              hub.power === "solar" ? "bg-amber-100 text-amber-800" : hub.power === "unreliable" ? "bg-rose-100 text-rose-800" : "bg-neutral-200 text-neutral-800"
                            }`}>
                              {hub.power === "solar" && <SunIcon size={11} />}
                              {tc(`power.${hub.power}`)}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <div>{(hub.usedKg / 1000).toFixed(0)}k / {(hub.capacityKg / 1000).toFixed(0)}k kg</div>
                            <div className="w-24 linear-meter mt-1">
                              <div className="linear-meter-fill" style={{ width: `${fillPercent}%` }} />
                            </div>
                          </td>
                          <td className="py-3.5 text-right">
                            <span className="inline-block px-2 py-0.5 text-[9px] rounded-full uppercase font-sans bg-black text-white">
                              {hub.riskStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 5 Cols: Selected Node Deep Dive */}
            <div className="lg:col-span-5 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-7">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  {t("network.nodeTelemetry")}
                </div>
                <h3 className="text-2xl font-medium tracking-tight text-black mt-1">
                  {selectedHub.name}
                </h3>
                <div className="font-mono text-xs text-neutral-500 mt-0.5">
                  TYPE: {selectedHub.type.toUpperCase().replace("_", " ")} // POWER: {tc(`power.${selectedHub.power}`)}
                </div>
              </div>

              {/* Linear Capacity Meter */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-neutral-500">{t("network.coldStorageFill")}</span>
                  <span className="font-semibold text-black">
                    {Math.round((selectedHub.usedKg / selectedHub.capacityKg) * 100)}% ({(selectedHub.usedKg / 1000).toFixed(1)}T / {(selectedHub.capacityKg / 1000).toFixed(1)}T)
                  </span>
                </div>
                <div className="linear-meter">
                  <div
                    className="linear-meter-fill"
                    style={{ width: `${Math.round((selectedHub.usedKg / selectedHub.capacityKg) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Temperature Zones & Solar Buffer Info */}
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  {t("network.thermalProtocol")}
                </div>
                <div className="space-y-2">
                  {selectedHub.tempZones.map((tz, idx) => (
                    <div key={idx} className="flex items-center justify-between font-mono text-xs py-2 border-b border-neutral-100">
                      <span className="text-neutral-800">{tz}</span>
                      <span className="text-emerald-600 font-semibold">{t("network.activeThermalShield")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Vehicle Types */}
              <div className="pt-4 border-t border-neutral-200 grid grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <div className="text-neutral-400 text-[10px] uppercase">{t("network.availableFleet")}</div>
                  <div className="text-lg font-light text-black mt-0.5">Tempos, Autos, Bikes</div>
                </div>
                <div>
                  <div className="text-neutral-400 text-[10px] uppercase">{t("network.terrainAccessibility")}</div>
                  <div className="text-lg font-light text-black mt-0.5">{t("network.allWeatherCapable")}</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 02 // PENDING PICKUP QUEUE & OFFLINE CAPABLE INGESTION (#shipments)*/}
        {/* ========================================================================= */}
        <section id="shipments" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                {t("shipments.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                {t("shipments.title")}
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full text-xs font-mono">
              {["all", "medicine", "produce", "critical"].map((f) => (
                <button
                  key={f}
                  onClick={() => setPickupFilter(f)}
                  className={`px-3 py-1 rounded-full uppercase text-[10px] tracking-wider transition-colors cursor-pointer ${
                    pickupFilter === f ? "bg-black text-white font-semibold" : "text-neutral-500 hover:text-black"
                  }`}
                >
                  {f === "all" ? "All Pickups" : f === "medicine" ? "Medicines" : f === "produce" ? "Farm Produce" : "Critical Urgency"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 pt-8">
            {/* Left 8 Cols: Pickups Manifest Ledger */}
            <div className="lg:col-span-8 pr-0 lg:pr-10">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.pickup")}</th>
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.classification")}</th>
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.urgency")}</th>
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.weight")}</th>
                      <th className="py-3 font-normal">{t("shipments.tableHeaders.waitTime")}</th>
                      <th className="py-3 font-normal text-right">{t("shipments.tableHeaders.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredPickups.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-4 pr-2">
                          <div className="font-semibold text-black">{item.waybill}</div>
                          <div className="text-[11px] text-neutral-700">{item.producer}</div>
                          <div className="text-[10px] text-neutral-400">{item.origin} → {item.destination}</div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase font-sans font-semibold ${
                            item.goodType === "medicine" ? "bg-rose-100 text-rose-800" : item.goodType === "farm_produce" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-800"
                          }`}>
                            {item.goodType === "medicine" ? tc("goodTypes.medicine") : item.goodType === "farm_produce" ? tc("goodTypes.farmProduce") : tc("goodTypes.essentialGoods")}
                          </span>
                          <div className="text-[10px] text-neutral-500 mt-0.5">{item.commodity}</div>
                        </td>
                        <td className="py-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase font-sans font-semibold ${
                            item.urgency === "critical" ? "bg-rose-600 text-white" : item.urgency === "high" ? "bg-amber-500 text-white" : "bg-neutral-200 text-black"
                          }`}>
                            {tc(`urgency.${item.urgency}`)}
                          </span>
                        </td>
                        <td className="py-4 text-neutral-700">{item.weightKg} {tc("units.kg")}</td>
                        <td className="py-4">
                          <span className={`font-semibold ${item.waitTimeMins > 90 ? "text-rose-600" : "text-neutral-700"}`}>
                            {item.waitTimeMins} {tc("units.minutes")}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-[9px] font-sans">
                            {tc(`status.${item.status.toLowerCase().replace(" ", "")}`) || item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 4 Cols: Fast Rural Pickup Ingestion Form */}
            <div className="lg:col-span-4 pt-8 lg:pt-0 pl-0 lg:pl-10">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-2">
                {t("shipments.form.offlineCapable")}
              </div>
              <h3 className="text-xl font-medium tracking-tight text-black mb-6">
                {t("shipments.form.title")}
              </h3>

              <form onSubmit={handleCreatePickup} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    {t("shipments.form.originLabel")}
                  </label>
                  <select
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full swiss-input text-xs font-medium bg-transparent"
                  >
                    <option value="Village A (Pipili Rural Cluster)">Village A (Pipili Rural Cluster)</option>
                    <option value="Village B (Khordha Dairy Cluster)">Village B (Khordha Dairy Cluster)</option>
                    <option value="Village C (Nimapada Agro Belt)">Village C (Nimapada Agro Belt)</option>
                    <option value="Village D (Banki Riverine Farms)">Village D (Banki Riverine Farms)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    {t("shipments.form.destLabel")}
                  </label>
                  <select
                    value={newDest}
                    onChange={(e) => setNewDest(e.target.value)}
                    className="w-full swiss-input text-xs font-medium bg-transparent"
                  >
                    <option value="Bhubaneswar Central Cold Hub">Bhubaneswar Central Cold Hub</option>
                    <option value="Cuttack Crossdock Terminal">Cuttack Crossdock Terminal</option>
                    <option value="Puri Coastal Depot">Puri Coastal Depot</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    {t("shipments.form.producerLabel")}
                  </label>
                  <input
                    type="text"
                    value={newProducer}
                    onChange={(e) => setNewProducer(e.target.value)}
                    className="w-full swiss-input text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                      {t("shipments.form.goodTypeLabel")}
                    </label>
                    <select
                      value={newGoodType}
                      onChange={(e) => setNewGoodType(e.target.value as GoodType)}
                      className="w-full swiss-input text-xs bg-transparent font-semibold"
                    >
                      <option value="farm_produce">{tc("goodTypes.farmProduce")}</option>
                      <option value="medicine">{tc("goodTypes.medicine")}</option>
                      <option value="essential_goods">{tc("goodTypes.essentialGoods")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                      {t("shipments.form.urgencyLabel")}
                    </label>
                    <select
                      value={newUrgency}
                      onChange={(e) => setNewUrgency(e.target.value as UrgencyLevel)}
                      className="w-full swiss-input text-xs bg-transparent font-semibold"
                    >
                      <option value="critical">{tc("urgency.critical")}</option>
                      <option value="high">{tc("urgency.high")}</option>
                      <option value="routine">{tc("urgency.routine")}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
                    {t("shipments.form.weightLabel")}
                  </label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full swiss-input text-xs font-mono"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <div className="font-mono text-[10px] text-neutral-400">
                    {t("shipments.form.idempotent")}
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {t("shipments.form.submit")}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 03 // DYNAMIC DISPATCH ENGINE & TRANSPARENT ALLOCATION (#dispatch)*/}
        {/* ========================================================================= */}
        <section id="dispatch" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                {t("dispatch.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                {t("dispatch.title")}
              </h2>
            </div>

            {/* Dynamic Window Expansion Toggle */}
            <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 px-4 py-2 rounded-full font-mono text-xs">
              <span className="text-neutral-600">{t("dispatch.windowToggle")}</span>
              <button
                onClick={() => setExtendWindow(!extendWindow)}
                className={`px-3 py-0.5 rounded-full uppercase text-[10px] font-bold transition-colors cursor-pointer ${
                  extendWindow ? "bg-black text-white" : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {extendWindow ? t("dispatch.enabled") : t("dispatch.disabled")}
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 pt-8">
            {/* Left 5 Cols: Dispatch Summary & Controls */}
            <div className="lg:col-span-5 pr-0 lg:pr-10 space-y-6">
              <div className="p-5 border border-neutral-200 bg-neutral-50/70 space-y-3 font-mono text-xs">
                <div className="text-neutral-400 uppercase text-[10px] font-bold">{t("dispatch.fairnessSummaryLabel")}</div>
                <p className="text-neutral-700 leading-relaxed font-sans text-sm">
                  {fairnessSummaryText}
                </p>
                <div className="pt-2 border-t border-neutral-200 text-[11px] text-neutral-500">
                  {t("dispatch.objective")}
                </div>
              </div>

              {/* One-Click Execute Dispatch */}
              <div className="p-5 border border-neutral-200 space-y-4">
                <div className="text-sm font-semibold text-black">{t("dispatch.triggerDispatch")}</div>
                <p className="text-xs text-neutral-600 font-light">
                  {t("dispatch.triggerDescription")}
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleRunDispatch}
                    disabled={isMatching}
                    className="w-full py-3 rounded-full bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <PulseIcon size={14} className={isMatching ? "animate-pulse" : ""} />
                    <span>{isMatching ? t("dispatch.computing") : t("dispatch.triggerButton")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setPickups(INITIAL_PICKUPS);
                      setMatchResults([]);
                      setFairnessSummaryText(
                        "Dynamic matching engine initialized. Allocations weighted by urgency, spoilage risk, and historical community wait times."
                      );
                    }}
                    className="w-full py-2 rounded-full border border-neutral-300 text-neutral-600 text-[10px] font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>RESET ALLOCATION QUEUE</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Live Transparent Match Feed */}
            <div className="lg:col-span-7 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                {t("dispatch.liveAllocation")}
              </div>

              {matchResults.length === 0 ? (
                <div className="p-8 border border-neutral-200 border-dashed text-center font-mono text-xs text-neutral-500 space-y-2">
                  <CubeIcon size={24} className="mx-auto text-neutral-400" />
                  <div>{t("dispatch.noMatches")}</div>
                  <div className="text-[10px] text-neutral-400">{t("dispatch.clickToRun")}</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {matchResults.map((m, idx) => (
                    <div key={idx} className="p-5 border border-black bg-neutral-50/90 space-y-3 font-mono text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-semibold text-black text-sm">
                          {m.good_type === "medicine" ? "💊 " : "🌾 "}
                          {m.producer_name} → {m.matched_vehicle_name}
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-black text-white text-[9px] uppercase font-sans">
                          {m.matched_vehicle_type} (Score: {m.allocation_score})
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-neutral-200/60 text-[11px]">
                        <div>
                          <span className="text-neutral-400 text-[10px] block">{t("dispatch.matchLabels.waitTime")}</span>
                          <span className="font-semibold text-black">{m.wait_time_minutes} {tc("units.minutes")}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 text-[10px] block">{t("dispatch.matchLabels.fairnessBoost")}</span>
                          <span className="font-semibold text-emerald-600">+{m.fairness_boost_pts} {tc("units.pts")}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 text-[10px] block">{t("dispatch.matchLabels.urgency")}</span>
                          <span className="font-semibold uppercase text-rose-600">{tc(`urgency.${m.urgency}`)}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-neutral-200 text-xs font-sans text-neutral-700 leading-relaxed">
                        <span className="font-mono text-[10px] text-neutral-400 block uppercase mb-1">{t("dispatch.transparentExplanation")}</span>
                        {m.explanation_summary}
                      </div>
                    </div>

                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 04 // PERISHABILITY & ARRHENIUS KINETICS (#sensors)               */}
        {/* ========================================================================= */}
        <section id="sensors" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                {t("kinetics.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                {t("kinetics.title")}
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500">
              {t("kinetics.activationEnergy")}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 pt-8">
            {/* Left 5 Cols: Thermal Parameters */}
            <div className="lg:col-span-5 pr-0 lg:pr-10 space-y-6">
              <div>
                <div className="flex justify-between font-mono text-xs mb-2">
                  <span className="text-neutral-600">{t("kinetics.ambientTemp")}</span>
                  <span className="font-semibold text-black">{kineticsTemp}°C</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="48"
                  value={kineticsTemp}
                  onChange={(e) => setKineticsTemp(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between font-mono text-xs mb-2">
                  <span className="text-neutral-600">{t("kinetics.transitDuration")}</span>
                  <span className="font-semibold text-black">{kineticsDurationHrs} {tc("units.hours")}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="36"
                  value={kineticsDurationHrs}
                  onChange={(e) => setKineticsDurationHrs(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Solar buffer toggle */}
              <div className="flex items-center justify-between p-4 border border-neutral-200 bg-neutral-50/60 font-mono text-xs">
                <div>
                  <div className="font-semibold text-black">{t("kinetics.solarBufferActive")}</div>
                  <div className="text-[10px] text-neutral-500">{t("kinetics.solarDesc")}</div>
                </div>
                <button
                  onClick={() => setHasSolarBuffer(!hasSolarBuffer)}
                  className={`px-3 py-1 rounded-full uppercase text-[10px] font-bold cursor-pointer ${
                    hasSolarBuffer ? "bg-amber-500 text-white" : "bg-neutral-200 text-black"
                  }`}
                >
                  {hasSolarBuffer ? t("kinetics.solarOn") : t("kinetics.gridOnly")}
                </button>
              </div>
            </div>

            {/* Right 7 Cols: Predicted Spoilage Decay */}
            <div className="lg:col-span-7 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-7">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-2">
                  {t("kinetics.qualityLoss")}
                </div>
                <div className="flex items-baseline gap-4">
                  <div className="text-5xl font-light tracking-tight text-black">
                    {arrheniusDecayRate}%
                  </div>
                  <div className="font-mono text-xs text-neutral-500">
                    {arrheniusDecayRate < 8 ? t("kinetics.minimalSpoilage") : arrheniusDecayRate < 25 ? t("kinetics.moderateLoad") : t("kinetics.criticalCooling")}
                  </div>
                </div>
                <div className="linear-meter mt-3">
                  <div
                    className="linear-meter-fill"
                    style={{ width: `${arrheniusDecayRate}%` }}
                  />
                </div>
              </div>

              {/* Thermal telemetry feeds */}
              <div className="space-y-3 pt-4 border-t border-neutral-200 font-mono text-xs">
                <div className="text-neutral-400 text-[10px] uppercase">{t("kinetics.telemetryPings")}</div>
                <div className="divide-y divide-neutral-100">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-neutral-700">Village A Solar Storage Node</span>
                    <span className="font-semibold text-emerald-600">+3.8°C (Nominal)</span>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-neutral-700">Khordha Reefer Tempo Tanker</span>
                    <span className="font-semibold text-emerald-600">+3.5°C (Nominal)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 05 // FAIRNESS DASHBOARD & DEMONSTRABLE PROOF (#fairness)          */}
        {/* ========================================================================= */}
        <section id="fairness" className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                {t("fairness.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                {t("fairness.title")}
              </h2>
            </div>
            <div className="font-mono text-xs text-neutral-500">
              {t("fairness.fairnessIndexLabel")}: {fairnessData?.overall_fairness_index || 0.96} // {t("fairness.provable")}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-200 pt-8">
            {/* Left 6 Cols: Wait-Time Distribution by Community */}
            <div className="lg:col-span-6 pr-0 lg:pr-10 space-y-6">
              <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                {t("fairness.waitTimeDistribution")}
              </div>

              <div className="space-y-4 font-mono text-xs">
                {communityBreakdown.map((comm, idx) => (
                  <div key={idx} className="p-4 border border-neutral-200 bg-neutral-50/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-black">{comm.name}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        INDEX: {comm.score}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-500 text-[11px]">
                      <span>{t("fairness.avgWait")}: {comm.avgWait} {tc("units.minutes")} ({t("fairness.maxWait")}: {comm.maxWait}m)</span>
                      <span>{comm.matches} {t("fairness.dispatches")}</span>
                    </div>
                    <div className="linear-meter">
                      <div className="linear-meter-fill" style={{ width: `${Math.round(comm.score * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 Cols: Proof of Non-Deprioritization */}
            <div className="lg:col-span-6 pt-8 lg:pt-0 pl-0 lg:pl-10 space-y-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                {t("fairness.provable")}
              </div>

              <div className="p-6 border border-black bg-white space-y-4 font-mono text-xs">
                <div className="text-sm font-semibold text-black flex items-center gap-2">
                  <ShieldCheckIcon size={16} className="text-emerald-600" />
                  <span>{t("fairness.proofTitle")}</span>
                </div>
                <p className="text-neutral-700 font-sans text-sm leading-relaxed">
                  {t("fairness.proofDescription")}
                </p>
                <div className="p-3 bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
                  <div>• {t("fairness.proofPoints.p1")}</div>
                  <div>• {t("fairness.proofPoints.p2")}</div>
                  <div>• {t("fairness.proofPoints.p3")}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION 06 // ROAD CONDITION ALERTS & TERRAIN AUDIT (#alerts)             */}
        {/* ========================================================================= */}
        <section id="alerts" className="mx-auto max-w-[1680px] p-8 sm:p-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-neutral-200 gap-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                {t("alerts.sectionLabel")}
              </div>
              <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-black mt-1">
                {t("alerts.title")}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="font-mono text-xs text-neutral-500 hidden sm:block">
                {t("alerts.subtitle")}
              </div>
              <button
                onClick={() => setShowReportModal(!showReportModal)}
                className="px-4 py-1.5 rounded-full bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{showReportModal ? "Close Form" : "+ Report Terrain Hazard"}</span>
              </button>
            </div>
          </div>

          {/* Interactive Report Hazard Form Dropdown */}
          {showReportModal && (
            <div className="my-6 p-6 border border-black bg-neutral-50/90 animate-fade-up">
              <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 mb-3 font-bold">
                SUBMIT REAL-TIME FIELD OBSERVATION (OFFLINE SYNC RESILIENT)
              </div>
              <form onSubmit={handleReportRoadHazard} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-400 mb-1">Corridor</label>
                  <select
                    value={reportCorridor}
                    onChange={(e) => setReportCorridor(e.target.value)}
                    className="w-full swiss-input text-xs font-medium bg-white"
                  >
                    <option value="Village D (Banki Riverine Farms) ⇄ Cuttack Crossdock">Village D (Banki) ⇄ Cuttack Crossdock</option>
                    <option value="Village C (Nimapada Agro Belt) ⇄ Bhubaneswar Cold Hub">Village C (Nimapada) ⇄ Bhubaneswar Hub</option>
                    <option value="Village A (Pipili Rural Cluster) ⇄ Bhubaneswar Cold Hub">Village A (Pipili) ⇄ Bhubaneswar Hub</option>
                    <option value="Village B (Khordha Dairy Cluster) ⇄ Bhubaneswar Cold Hub">Village B (Khordha) ⇄ Bhubaneswar Hub</option>
                    <option value="Puri Coastal Depot ⇄ Bhubaneswar Central Hub">Puri Coastal Depot ⇄ Bhubaneswar Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-400 mb-1">Observed Condition</label>
                  <select
                    value={reportCondition}
                    onChange={(e) => setReportCondition(e.target.value as RoadCondition)}
                    className="w-full swiss-input text-xs font-semibold bg-white"
                  >
                    <option value="flood_risk">Flood Risk (Submerged)</option>
                    <option value="seasonal">Seasonal Muddy Washout</option>
                    <option value="unpaved">Unpaved Gravel / Potholes</option>
                    <option value="paved">Paved & Clear (Optimal)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase text-neutral-400 mb-1">Field Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Water level rising near km 8; speed derating 40%"
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    className="w-full swiss-input text-xs bg-white"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block font-mono text-[10px] uppercase text-neutral-400 mb-1">Observer</label>
                    <input
                      type="text"
                      value={reportAuthor}
                      onChange={(e) => setReportAuthor(e.target.value)}
                      className="w-full swiss-input text-xs bg-white font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded text-xs font-mono uppercase font-bold hover:bg-neutral-800 cursor-pointer shrink-0"
                  >
                    Publish
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="divide-y divide-neutral-100 pt-4 font-mono text-xs">
            {roadAlerts.map((item) => (
              <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/70 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-black">{item.corridor}</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-neutral-100 text-neutral-700">{item.condition}</span>
                  </div>
                  <div className="text-neutral-600 text-[11px] font-light font-sans">{item.notes}</div>
                </div>

                <div className="flex items-center gap-6 sm:text-right shrink-0">
                  <div className="text-[10px] text-neutral-400">{item.time}</div>
                  <div className={`text-[11px] font-semibold ${item.color}`}>{item.status}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
      <RuralChatbot />
    </>
  );
}