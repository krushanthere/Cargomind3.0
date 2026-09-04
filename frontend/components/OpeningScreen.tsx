"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-white dark:bg-[#09090b] text-[#0a0a0a] dark:text-[#f4f4f5] transition-all duration-700 ${
        stage === 4 ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      }`}
    >
      {/* Top HUD Line */}
      <div className="w-full flex items-center justify-between px-8 py-6 border-b border-neutral-100 dark:border-neutral-800 font-mono text-[10px] tracking-widest text-neutral-400 dark:text-neutral-500">
        <div className="flex items-center gap-3">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-black dark:bg-white animate-ping" />
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
            className="text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors underline underline-offset-4 cursor-pointer"
          >
            {t("skipIntro")}
          </button>
        </div>
      </div>

      {/* Centerpiece Precision Brand & Reticle */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        {/* Subtle circular grid rings */}
        <div
          className={`absolute w-64 h-64 rounded-full border border-dashed border-neutral-200 dark:border-neutral-800 transition-all duration-1000 ${
            stage >= 1 ? "scale-100 opacity-60" : "scale-50 opacity-0"
          }`}
        />
        <div
          className={`absolute w-88 h-88 rounded-full border border-neutral-100 dark:border-neutral-800/60 transition-all duration-1000 ${
            stage >= 2 ? "scale-100 opacity-40" : "scale-50 opacity-0"
          }`}
        />

        {/* Central Geometric Logo Presentation */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div
            className={`p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 transition-all duration-700 shadow-sm ${
              stage >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-neutral-950 dark:text-white"
            >
              <path
                d="M24 4L42 14V34L24 44L6 34V14L24 4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                className="transition-opacity duration-500"
              />
              <path
                d="M24 4V44M6 14L42 34M6 34L42 14"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeOpacity="0.3"
              />
              <path
                d="M24 16L34 22V30L24 36L14 30V22L24 16Z"
                fill="currentColor"
                fillOpacity="0.08"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <circle cx="24" cy="24" r="3" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Brand Headline Reveal */}
        <div className="mt-8 text-center">
          <div
            className={`text-2xl sm:text-3xl font-light tracking-[-0.03em] text-black dark:text-white transition-all duration-700 ${
              stage >= 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            CargoMind<span className="font-semibold text-brand"> 3.0</span>
          </div>

          <div
            className={`mt-2 font-mono text-[11px] tracking-[0.2em] uppercase text-neutral-500 dark:text-neutral-400 transition-all duration-700 ${
              stage >= 2 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            {t("tagline")}
          </div>
        </div>

        {/* Dynamic Telemetry Status */}
        <div className="mt-8 flex flex-col items-center">
          <div className="w-56 h-[2px] bg-neutral-100 dark:bg-neutral-800 overflow-hidden mb-3">
            <div
              className="h-full bg-brand transition-all duration-500 ease-out"
              style={{
                width: stage === 0 ? "15%" : stage === 1 ? "45%" : stage === 2 ? "80%" : "100%",
              }}
            />
          </div>
          <div className="font-mono text-[10px] tracking-wider text-neutral-600 dark:text-neutral-400">
            {telemetryText}
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="w-full flex items-center justify-between px-8 py-5 border-t border-neutral-100 dark:border-neutral-800 font-mono text-[10px] tracking-wider text-neutral-400 dark:text-neutral-500">
        <div>{t("bottomBar.solver")}</div>
        <div className="flex items-center gap-2">
          <span>{t("bottomBar.entering")}</span>
          <span className="inline-block w-1 h-1 bg-black dark:bg-white rounded-full" />
        </div>
      </div>
    </div>
  );
}
