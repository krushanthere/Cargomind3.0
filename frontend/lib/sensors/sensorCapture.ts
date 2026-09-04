"use client";

import { AccelerometerSample, VibrationSummary, TemperatureReading } from "../../types";

export type SensorPermissionState = "prompt" | "granted" | "denied" | "unsupported";

export interface SensorStreamState {
  isRecording: boolean;
  permissionState: SensorPermissionState;
  isSimulated: boolean;
  sampleCount: number;
  durationSeconds: number;
  currentX: number;
  currentY: number;
  currentZ: number;
  currentMagnitude: number;
  rmsAcceleration: number;
  peakAcceleration: number;
  bumpinessLevel: string;
  temperatureReading: TemperatureReading;
  recentMagnitudes: number[];
}

export class MobileSensorCaptureEngine {
  private static listeners: Array<(state: SensorStreamState) => void> = [];
  private static samples: AccelerometerSample[] = [];
  private static recentMagnitudes: number[] = [];
  private static isRecording: boolean = false;
  private static isSimulated: boolean = false;
  private static startTime: number = 0;
  private static simulationInterval: any = null;
  private static deviceMotionHandler: any = null;
  private static permissionState: SensorPermissionState = "prompt";
  private static currentX: number = 0;
  private static currentY: number = 0;
  private static currentZ: number = 0;
  private static currentMagnitude: number = 0;
  private static peakAcceleration: number = 0;
  private static weatherTemp: number = 32.0;

  static setWeatherTemperature(temp: number) {
    this.weatherTemp = temp;
    this.notify();
  }

  static getState(): SensorStreamState {
    const dur = this.isRecording ? (Date.now() - this.startTime) / 1000.0 : 0.0;
    const n = this.recentMagnitudes.length;
    const rms = n > 0 ? Math.sqrt(this.recentMagnitudes.reduce((a, b) => a + b * b, 0) / n) : 0;

    let bumpiness = "Low / Smooth";
    if (rms > 2.0 || this.peakAcceleration > 4.5) {
      bumpiness = "High (Severe Potholes / Unpaved Ghat)";
    } else if (rms > 0.9 || this.peakAcceleration > 2.2) {
      bumpiness = "Moderate (Bumpy / Patchwork Pavement)";
    } else if (rms > 0.3) {
      bumpiness = "Low (Standard Rural Asphalt)";
    }

    return {
      isRecording: this.isRecording,
      permissionState: this.permissionState,
      isSimulated: this.isSimulated,
      sampleCount: this.samples.length,
      durationSeconds: Math.round(dur * 10) / 10,
      currentX: Math.round(this.currentX * 100) / 100,
      currentY: Math.round(this.currentY * 100) / 100,
      currentZ: Math.round(this.currentZ * 100) / 100,
      currentMagnitude: Math.round(this.currentMagnitude * 100) / 100,
      rmsAcceleration: Math.round(rms * 100) / 100,
      peakAcceleration: Math.round(this.peakAcceleration * 100) / 100,
      bumpinessLevel: bumpiness,
      temperatureReading: {
        temperature_celsius: this.weatherTemp,
        source: "weather",
        source_label: "External Weather API Telemetry",
        is_sensor_available: false,
        confidence: "medium",
      },
      recentMagnitudes: [...this.recentMagnitudes],
    };
  }

  static subscribe(listener: (state: SensorStreamState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  static async requestPermission(): Promise<SensorPermissionState> {
    if (typeof window === "undefined") return "unsupported";

    if (
      typeof (DeviceMotionEvent as any) !== "undefined" &&
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      try {
        const res = await (DeviceMotionEvent as any).requestPermission();
        this.permissionState = res === "granted" ? "granted" : "denied";
      } catch {
        this.permissionState = "denied";
      }
    } else if ("DeviceMotionEvent" in window) {
      this.permissionState = "granted";
    } else {
      this.permissionState = "unsupported";
    }

    this.notify();
    return this.permissionState;
  }

  static async startRecording(forceSimulation: boolean = false): Promise<boolean> {
    this.stopRecording();
    this.samples = [];
    this.recentMagnitudes = [];
    this.peakAcceleration = 0;
    this.startTime = Date.now();
    this.isRecording = true;

    if (forceSimulation || typeof window === "undefined" || !("DeviceMotionEvent" in window)) {
      this.isSimulated = true;
      this._startSimulation();
      this.notify();
      return true;
    }

    const perm = await this.requestPermission();
    if (perm !== "granted") {
      // Fall back to simulation mode so desktop / non-sensor clients can still test
      this.isSimulated = true;
      this._startSimulation();
      this.notify();
      return true;
    }

    this.isSimulated = false;
    this.deviceMotionHandler = (event: DeviceMotionEvent) => {
      const acc = event.acceleration || event.accelerationIncludingGravity;
      if (!acc) return;

      const rawX = acc.x || 0;
      const rawY = acc.y || 0;
      const rawZ = acc.z || 0;

      // Compensate for gravity if accelerationIncludingGravity is used
      const norm = Math.sqrt(rawX * rawX + rawY * rawY + rawZ * rawZ);
      const dynamicMag = event.acceleration ? norm : Math.abs(norm - 9.80665);

      this.currentX = rawX;
      this.currentY = rawY;
      this.currentZ = rawZ;
      this.currentMagnitude = dynamicMag;
      this.peakAcceleration = Math.max(this.peakAcceleration, dynamicMag);

      this.recentMagnitudes.push(dynamicMag);
      if (this.recentMagnitudes.length > 30) this.recentMagnitudes.shift();

      this.samples.push({
        x: rawX,
        y: rawY,
        z: rawZ,
        timestamp: new Date().toISOString(),
      });

      this.notify();
    };

    window.addEventListener("devicemotion", this.deviceMotionHandler, true);
    this.notify();
    return true;
  }

  static stopRecording(): { sampleCount: number; rms: number; peak: number; duration: number } {
    this.isRecording = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }

    if (typeof window !== "undefined" && this.deviceMotionHandler) {
      window.removeEventListener("devicemotion", this.deviceMotionHandler, true);
      this.deviceMotionHandler = null;
    }

    const state = this.getState();
    this.notify();

    return {
      sampleCount: state.sampleCount,
      rms: state.rmsAcceleration,
      peak: state.peakAcceleration,
      duration: state.durationSeconds,
    };
  }

  private static _startSimulation(roughnessIntensity: "smooth" | "moderate" | "rough" = "moderate") {
    let t = 0;
    const baseAmp = roughnessIntensity === "rough" ? 2.4 : roughnessIntensity === "moderate" ? 1.4 : 0.4;

    this.simulationInterval = setInterval(() => {
      t += 0.05;
      // Synthetic bumps + periodic vibration
      const noise = (Math.random() - 0.5) * 0.8;
      const potholeShock = Math.random() > 0.94 ? Math.random() * 2.8 : 0;
      const dynMag = Math.max(0.1, baseAmp * (1.0 + 0.5 * Math.sin(t * 3.5)) + noise + potholeShock);

      this.currentX = (Math.sin(t * 4) * baseAmp * 0.7 + noise).toFixed(2) as any;
      this.currentY = (Math.cos(t * 3) * baseAmp * 0.5 + noise).toFixed(2) as any;
      this.currentZ = (dynMag).toFixed(2) as any;
      this.currentMagnitude = dynMag;
      this.peakAcceleration = Math.max(this.peakAcceleration, dynMag);

      this.recentMagnitudes.push(dynMag);
      if (this.recentMagnitudes.length > 30) this.recentMagnitudes.shift();

      this.samples.push({
        x: this.currentX,
        y: this.currentY,
        z: this.currentZ,
        timestamp: new Date().toISOString(),
      });

      this.notify();
    }, 100);
  }

  static getRawSamples(): AccelerometerSample[] {
    return [...this.samples];
  }
}
