"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigationItems = [
  { label: "Overview", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Shipments", href: "/shipments" },
  { label: "Consolidation", href: "/consolidation" },
  { label: "AI Intelligence", href: "/ai-intelligence" },
  { label: "Network", href: "/network" },
  { label: "Simulator", href: "/simulator" },
  { label: "Alerts", href: "/alerts" },
];

function CargoMindMark() {
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <div className="absolute inset-0 rounded-[14px] bg-[#111216]" />

      <svg
        className="relative z-10 text-white"
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 17.5V8.5L12 4L20 8.5V17.5L12 22L4 17.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 8.5L12 13L19.5 8.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M12 13V21"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 8C18 4.686 15.314 2 12 2C8.686 2 6 4.686 6 8C6 13 4 15 3 16.5H21C20 15 18 13 18 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 20C10.5 21.333 13.5 21.333 14 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TopNavigation() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[100] transition-all duration-300 ${
          isScrolled
            ? "bg-[#dce8ed]/85 backdrop-blur-2xl shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-[1800px] px-8">
          <div
            className={`grid min-h-[88px] grid-cols-[auto_1fr_auto] items-center gap-6 transition-all duration-300 ${
              isScrolled
                ? "border-b border-white/50"
                : "border-b border-transparent"
            }`}
          >
            {/* BRAND */}
            <Link
              href="/"
              className="group flex w-fit items-center gap-3.5"
            >
              <CargoMindMark />

              <div>
                <div className="text-[17px] font-semibold leading-none tracking-[-0.035em] text-[#111a20]">
                  CargoMind
                </div>

                <div className="mt-1.5 text-[8px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Logistics Intelligence
                </div>
              </div>
            </Link>

            {/* DESKTOP NAVIGATION */}
            <nav className="hidden lg:flex justify-center">
              <div className="flex items-center gap-6 xl:gap-8">
                {navigationItems.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group relative flex flex-col items-center py-4"
                    >
                      <span
                        className={`whitespace-nowrap text-[13px] font-medium tracking-[-0.015em] transition-colors duration-200 ${
                          isActive
                            ? "text-[#111a20] font-semibold"
                            : "text-slate-500 group-hover:text-[#111a20]"
                        }`}
                      >
                        {item.label}
                      </span>

                      <span
                        className={`absolute -bottom-0.5 h-[3px] rounded-full bg-[#111216] transition-all duration-300 ${
                          isActive
                            ? "w-6 opacity-100"
                            : "w-0 opacity-0 group-hover:w-2 group-hover:opacity-40"
                        }`}
                      />
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* RIGHT CONTROLS */}
            <div className="flex items-center justify-end gap-3">
              {/* Live Status Indicator */}
              <div className="mr-1 hidden items-center gap-2 xl:flex">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[11px] font-semibold text-slate-500">
                  Grid Online
                </span>
              </div>

              {/* Alert Center Link */}
              <Link
                href="/alerts"
                aria-label="Alerts"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors duration-200 hover:bg-black/[0.05] hover:text-[#111216]"
              >
                <BellIcon />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              </Link>

              {/* Settings Link */}
              <Link
                href="/settings"
                aria-label="Settings"
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors duration-200 hover:bg-black/[0.05] hover:text-[#111216]"
              >
                <SettingsIcon />
              </Link>

              {/* Profile Badge Link to Settings */}
              <Link
                href="/settings"
                aria-label="Profile"
                className="ml-1 flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#111216] text-[10px] font-semibold text-white shadow-sm">
                  CM
                </span>
                <span className="hidden text-[12px] font-semibold text-slate-700 md:block">
                  Admin
                </span>
              </Link>
            </div>
          </div>

          {/* MOBILE NAVIGATION */}
          <div className="overflow-x-auto lg:hidden">
            <nav
              className={`flex min-w-max items-center gap-6 py-3.5 ${
                isScrolled ? "border-b border-white/40" : ""
              }`}
            >
              {navigationItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap text-[12px] font-medium ${
                      isActive
                        ? "text-[#111a20] font-bold"
                        : "text-slate-500 hover:text-[#111a20]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/settings"
                className="whitespace-nowrap text-[12px] font-medium text-slate-500 hover:text-[#111216]"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Fixed navbar spacing */}
      <div className="h-[88px]" />
    </>
  );
}