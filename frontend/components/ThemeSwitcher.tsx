"use client";

import React from "react";
import { useTheme } from "./theme/ThemeProvider";
import { useTranslations } from "next-intl";

interface ThemeSwitcherProps {
  compact?: boolean;
  className?: string;
}

export default function ThemeSwitcher({
  compact = true,
  className = "",
}: ThemeSwitcherProps) {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("theme");

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={
        compact
          ? `group relative flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-all cursor-pointer shadow-2xs ${className}`
          : `group relative flex w-full items-center justify-between px-3.5 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer ${className}`
      }
      title={isDark ? `${t("switchToLight")} (D)` : `${t("switchToDark")} (D)`}
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
    >
      <div className="flex items-center gap-2.5">
        {/* Animated Sun / Moon Icon */}
        <div className="relative w-4 h-4 flex items-center justify-center">
          {/* Sun Icon (Visible in dark mode, clicking switches to light) */}
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`absolute text-current transition-all duration-300 transform ${
              isDark
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0"
            }`}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>

          {/* Moon Icon (Visible in light mode, clicking switches to dark) */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`absolute text-neutral-700 dark:text-neutral-300 transition-all duration-300 transform ${
              isDark
                ? "rotate-90 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            }`}
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </div>

        {/* Label when expanded */}
        {!compact && (
          <span className="text-xs font-sans font-medium text-neutral-800 dark:text-neutral-200">
            {isDark ? t("lightMode") : t("darkMode")}
          </span>
        )}
      </div>

      {!compact && (
        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
          {isDark ? t("light") : t("dark")}
        </span>
      )}
    </button>
  );
}
