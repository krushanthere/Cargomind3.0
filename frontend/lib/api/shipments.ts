import {
  apiGet,
  apiPost,
} from "@/lib/api/client";

import type {
  CreateShipmentRequest,
  Shipment,
} from "@/types";

export async function getShipments(params?: {
  status?: string;
  temp_class?: string;
  origin_hub_id?: string;
  dest_hub_id?: string;
}) {
  return apiGet<Shipment[]>(
    "/shipments",
    params,
  );
}

export async function getShipment(
  shipmentId: string,
) {
  return apiGet<Shipment>(
    `/shipments/${shipmentId}`,
  );
}

export async function createShipment(
  data: CreateShipmentRequest,
) {
  return apiPost<Shipment, CreateShipmentRequest>(
    "/shipments",
    data,
  );
}