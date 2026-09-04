"use client";

import React from "react";
import CargoMindOsmMap from "./map/CargoMindOsmMap";

export interface NERMapProps {
  center?: [number, number];
  zoom?: number;
  selectedHubId?: string;
  className?: string;
  isFullScreen?: boolean;
}

export default function NERMap({
  selectedHubId,
  className = "",
  isFullScreen = false,
}: NERMapProps) {
  return (
    <CargoMindOsmMap
      selectedHubId={selectedHubId}
      className={className}
      isFullScreenMode={isFullScreen}
    />
  );
}
