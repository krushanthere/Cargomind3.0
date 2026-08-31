"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { StarburstIcon, CrosshairIcon } from "./icons/Hugeicons";

interface OpeningScreenProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export default function OpeningScreen({
  onComplete,
  forceShow = false,
}: OpeningScreenProps) {
  const t = useTranslations("intro");
  const [stage, setStage] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [telemetryText, setTelemetryText] = useState<string>("");

  useEffect(() => {
    setTelemetryText(t("bootSteps.init"));
  }, [t]);

  useEffect(() => {
    // Check session storage if not forced
    const hasSeenIntro = sessionStorage.getItem("cargomind_intro_seen");
    if (hasSeenIntro && !forceShow) {
      setIsVisible(false);
      onComplete?.();
      return;
    }

    // Sequence of animations
    const t1 = setTimeout(() => {
      setStage(1);
      setTelemetryText(t("bootSteps.arrhenius"));
    }, 450);

    const t2 = setTimeout(() => {
      setStage(2);
      setTelemetryText(t("bootSteps.solver"));
    }, 1100);

    const t3 = setTimeout(() => {
      setStage(3);
      setTelemetryText(t("bootSteps.online"));
    }, 1800);

    const t4 = setTimeout(() => {
      setStage(4); // Trigger shutter transition
    }, 2500);

    const t5 = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem("cargomind_intro_seen", "true");
      onComplete?.();
    }, 3100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [forceShow, onComplete, t]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white text-[#0a0a0a] transition-all duration-700 ${
        stage === 4 ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      }`}
    >
      {/* Top HUD Line */}
      <div className="w-full flex items-center justify-between px-8 py-6 border-b border-neutral-100 font-mono text-[10px] tracking-widest text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-black animate-ping" />
          <span>{t("protocol")}</span>
        </div>
        <div className="hidden sm:block">
          {t("sysVersion")}
        </div>
        <div>
          <button
            onClick={() => {
              setIsVisible(false);
              sessionStorage.setItem("cargomind_intro_seen", "true");
              onComplete?.();
            }}
            className="text-neutral-500 hover:text-black transition-colors underline underline-offset-4 cursor-pointer"
          >
            {t("skipIntro")}
          </button>
        </div>
      </div>

      {/* Centerpiece Starburst & Reticle Animation */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        {/* Subtle circular grid rings */}
        <div
          className={`absolute w-72 h-72 rounded-full border border-dashed border-neutral-200 transition-all duration-1000 ${
            stage >= 1 ? "scale-100 opacity-60 animate-starburst-spin" : "scale-50 opacity-0"
          }`}
        />
        <div
          className={`absolute w-96 h-96 rounded-full border border-neutral-100 transition-all duration-1000 ${
            stage >= 2 ? "scale-100 opacity-40" : "scale-50 opacity-0"
          }`}
        />

        {/* Central Geometric Starburst */}
        <div className="relative z-10 flex items-center justify-center">
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            className="overflow-visible text-black"
          >
            {/* Background fine diagonal crosshairs */}
            <g
              className={`transition-opacity duration-700 ${
                stage >= 1 ? "opacity-30" : "opacity-0"
              }`}
            >
              <line
                x1="20"
                y1="20"
                x2="200"
                y2="200"
                stroke="currentColor"
                strokeWidth="0.75"
              />
              <line
                x1="20"
                y1="200"
                x2="200"
                y2="20"
                stroke="currentColor"
                strokeWidth="0.75"
              />
              <line
                x1="110"
                y1="0"
                x2="110"
                y2="220"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
              <line
                x1="0"
                y1="110"
                x2="220"
                y2="110"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
            </g>

            {/* Precision 8 Primary Rays (Golden Suisse reference design) */}
            <g
              className={`transition-all duration-1000 ${
                stage >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-50"
              }`}
              style={{ transformOrigin: "110px 110px" }}
            >
              {/* North */}
              <line
                x1="110"
                y1="70"
                x2="110"
                y2="25"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                className="transition-all duration-700"
                style={{
                  transform: stage >= 2 ? "scaleY(1)" : "scaleY(0.4)",
                  transformOrigin: "110px 110px",
                }}
              />
              {/* South */}
              <line
                x1="110"
                y1="150"
                x2="110"
                y2="195"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* West */}
              <line
                x1="70"
                y1="110"
                x2="25"
                y2="110"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* East */}
              <line
                x1="150"
                y1="110"
                x2="195"
                y2="110"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* NW */}
              <line
                x1="82"
                y1="82"
                x2="50"
                y2="50"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* NE */}
              <line
                x1="138"
                y1="82"
                x2="170"
                y2="50"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* SW */}
              <line
                x1="82"
                y1="138"
                x2="50"
                y2="170"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* SE */}
              <line
                x1="138"
                y1="138"
                x2="170"
                y2="170"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </g>

            {/* Central Target Dot */}
            <circle
              cx="110"
              cy="110"
              r="2.5"
              fill="currentColor"
              className={`transition-all duration-500 ${
                stage >= 1 ? "scale-100 opacity-100" : "scale-0 opacity-0"
              }`}
            />
          </svg>
        </div>

        {/* Brand Headline Reveal */}
        <div className="mt-10 text-center">
          <div
            className={`text-2xl sm:text-3xl font-light tracking-[-0.04em] text-black transition-all duration-700 ${
              stage >= 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            CargoMind<span className="font-semibold">.AI</span>
          </div>

          <div
            className={`mt-2 font-mono text-[11px] tracking-[0.25em] uppercase text-neutral-500 transition-all duration-700 ${
              stage >= 2 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            {t("tagline")}
          </div>
        </div>

        {/* Dynamic Telemetry Status */}
        <div className="mt-8 flex flex-col items-center">
          <div className="w-56 h-[2px] bg-neutral-100 overflow-hidden mb-3">
            <div
              className="h-full bg-black transition-all duration-500 ease-out"
              style={{
                width: stage === 0 ? "15%" : stage === 1 ? "45%" : stage === 2 ? "80%" : "100%",
              }}
            />
          </div>
          <div className="font-mono text-[10px] tracking-wider text-neutral-600">
            {telemetryText}
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="w-full flex items-center justify-between px-8 py-5 border-t border-neutral-100 font-mono text-[10px] tracking-wider text-neutral-400">
        <div>{t("bottomBar.solver")}</div>
        <div className="flex items-center gap-2">
          <span>{t("bottomBar.entering")}</span>
          <span className="inline-block w-1 h-1 bg-black rounded-full" />
        </div>
      </div>
    </div>
  );
}
