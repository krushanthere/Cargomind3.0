"use client";

import { OfflineQueueItem, OfflineSyncState } from "../../types";
import { API_BASE } from "../api/client";

const OFFLINE_QUEUE_KEY = "cargomind_rural_offline_queue";
const LAST_SYNC_KEY = "cargomind_rural_last_sync";

export class OfflineSyncManager {
  private static listeners: Array<(state: OfflineSyncState) => void> = [];

  static getQueue(): OfflineQueueItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static saveQueue(queue: OfflineQueueItem[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      this.notifyListeners();
    } catch (e) {
      console.error("Failed to save offline queue", e);
    }
  }

  static queueAction(type: OfflineQueueItem["type"], data: any): OfflineQueueItem {
    const item: OfflineQueueItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `offline-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      data: { ...data, client_id: data.client_id || (crypto.randomUUID ? crypto.randomUUID() : undefined) },
      queued_at: new Date().toISOString(),
      status: "pending",
      retry_count: 0,
    };

    const queue = this.getQueue();
    queue.push(item);
    this.saveQueue(queue);
    return item;
  }

  static getPendingCount(): number {
    return this.getQueue().filter((q) => q.status === "pending").length;
  }

  static getState(): OfflineSyncState {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    const lastSync = typeof window !== "undefined" ? localStorage.getItem(LAST_SYNC_KEY) || undefined : undefined;
    return {
      isOnline,
      pendingCount: this.getPendingCount(),
      lastSyncedAt: lastSync,
    };
  }

  static subscribe(listener: (state: OfflineSyncState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());

    const handleOnline = () => {
      this.notifyListeners();
      this.flushQueue();
    };
    const handleOffline = () => this.notifyListeners();

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
    }

    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      }
    };
  }

  private static notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  static async flushQueue(apiBaseUrl: string = API_BASE): Promise<{ success: boolean; synced: number }> {
    const queue = this.getQueue();
    const pending = queue.filter((q) => q.status === "pending");

    if (pending.length === 0) {
      return { success: true, synced: 0 };
    }

    const payload = {
      client_id: crypto.randomUUID ? crypto.randomUUID() : undefined,
      device_id: "field-agent-client-01",
      sync_timestamp: new Date().toISOString(),
      shipments: pending.filter((q) => q.type === "shipment").map((q) => q.data),
      road_conditions: pending.filter((q) => q.type === "road_condition").map((q) => q.data),
      temperature_logs: pending.filter((q) => q.type === "temperature_log").map((q) => q.data),
      vehicle_updates: pending.filter((q) => q.type === "vehicle_status").map((q) => q.data),
    };

    try {
      const res = await fetch(`${apiBaseUrl}/sync/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Sync API error: ${res.statusText}`);
      }

      // Mark processed items as synced and clear
      const remaining = queue.filter((q) => q.status !== "pending");
      this.saveQueue(remaining);

      if (typeof window !== "undefined") {
        localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      }
      this.notifyListeners();
      return { success: true, synced: pending.length };
    } catch (e) {
      console.warn("Offline sync flush failed (will retry on next reconnect)", e);
      return { success: false, synced: 0 };
    }
  }
}
