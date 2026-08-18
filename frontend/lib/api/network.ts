import { apiGet } from "@/lib/api/client";

import type {
  Hub,
  NetworkRoute,
} from "@/types";

export interface NetworkGraph {
  hubs: Hub[];
  routes: NetworkRoute[];
}

export async function getNetworkGraph() {
  return apiGet<NetworkGraph>(
    "/network/graph",
  );
}

export async function getHubs() {
  return apiGet<Hub[]>("/network/hubs");
}

export async function getRoutes() {
  return apiGet<NetworkRoute[]>(
    "/network/routes",
  );
}