"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import CargoMindLogo from "../icons/CargoMindLogo";
import {
  RefreshIcon,
  MenuIcon,
  CloseIcon,
  SearchIcon,
  AiBrainIcon,
  InfoCircleIcon,
  RouteIcon,
  RadarIcon,
} from "../icons/Hugeicons";
import OpeningScreen from "../OpeningScreen";
import LogisticsSearchModal from "../search/LogisticsSearchModal";
import LanguageSwitcher from "../LanguageSwitcher";
import ThemeSwitcher from "../ThemeSwitcher";

export default function TopNavigation() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const locale = useLocale();
  const [showIntro, setShowIntro] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [modulesDropdownOpen, setModulesDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu and dropdown on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setModulesDropdownOpen(false);
  }, [pathname]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setModulesDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModulesDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Track active page or scroll section
  useEffect(() => {
    if (pathname.includes("/accessibility")) {
      setActiveSection("accessibility");
      return;
    }
    if (pathname.includes("/map")) {
      setActiveSection("map");
      return;
    }
    if (pathname.includes("/ai-intelligence")) {
      setActiveSection("ai-intelligence");
      return;
    }
    if (pathname.includes("/about")) {
      setActiveSection("about");
      return;
    }

    const sections = [
      { id: "overview" },
      { id: "network" },
      { id: "shipments" },
      { id: "dispatch" },
      { id: "sensors" },
      { id: "fairness" },
      { id: "alerts" },
      { id: "fleet" },
    ];

    const handleScroll = () => {
      const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
      if (!isHome) return;

      const scrollPos = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSection(sections[i].id);
            break;
          }
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, locale]);

  const corridorModules = [
    { label: t("overview"), href: `/${locale}#overview`, section: "overview", index: "00" },
    { label: t("topology"), href: `/${locale}#network`, section: "network", index: "01" },
    { label: t("pickups"), href: `/${locale}#shipments`, section: "shipments", index: "02" },
    { label: t("dispatch"), href: `/${locale}#dispatch`, section: "dispatch", index: "03" },
    { label: t("kinetics"), href: `/${locale}#sensors`, section: "sensors", index: "04" },
    { label: t("fairness"), href: `/${locale}#fairness`, section: "fairness", index: "05" },
    { label: t("terrain"), href: `/${locale}#alerts`, section: "alerts", index: "06" },
    { label: t("fleet"), href: `/${locale}#fleet`, section: "fleet", index: "07" },
  ];

  const pageLinks = [
    { label: t("digitalTwin"), href: `/${locale}/map`, section: "map", icon: RouteIcon },
    { label: t("accessibility"), href: `/${locale}/accessibility`, section: "accessibility", icon: RadarIcon },
    { label: t("aiIntelligence"), href: `/${locale}/ai-intelligence`, section: "ai-intelligence", icon: AiBrainIcon },
    { label: t("about"), href: `/${locale}/about`, section: "about", icon: InfoCircleIcon },
  ];

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isCorridorActive = isHome && activeSection !== "overview";

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (isHome) {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        const yOffset = -72;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
        window.history.pushState(null, "", `#${sectionId}`);
        setActiveSection(sectionId);
      }
      setModulesDropdownOpen(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {showIntro && (
        <OpeningScreen forceShow={true} onComplete={() => setShowIntro(false)} />
      )}

      {/* Global Search Modal Palette */}
      <LogisticsSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />

      <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors duration-200">
        <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-3 sm:px-5 lg:px-7 gap-2 sm:gap-4">
          
          {/* LEFT: Brand Emblem & Status Indicator */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href={`/${locale}`}
              className="group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 transition-transform duration-200 group-hover:scale-105 shadow-xs">
                <CargoMindLogo size={18} className="text-white dark:text-neutral-950" />
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] sm:text-[15px] font-bold tracking-tight text-neutral-950 dark:text-white leading-none">
                  CargoMind
                </span>
                <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-neutral-500 dark:text-neutral-400 leading-tight mt-0.5 max-w-[110px] sm:max-w-none truncate">
                  {t("brandSubtitle")}
                </span>
              </div>
            </Link>

            {/* Live System Status Indicator */}
            <div className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 font-mono text-[9px] tracking-wider text-neutral-600 dark:text-neutral-400 ml-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{t("online")}</span>
            </div>
          </div>

          {/* CENTER: Desktop Navigation (Pill Navigation) */}
          <nav className="hidden xl:flex items-center gap-1 bg-neutral-100/80 dark:bg-neutral-900/80 p-1 rounded-full border border-neutral-200/70 dark:border-neutral-800/70 shrink-0">
            {/* Home / Overview */}
            <Link
              href={`/${locale}`}
              onClick={(e) => handleSmoothScroll(e, "overview")}
              className={`relative px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-150 whitespace-nowrap ${
                isHome && activeSection === "overview"
                  ? "bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold"
                  : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40"
              }`}
            >
              {t("overview")}
            </Link>

            {/* Modules Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setModulesDropdownOpen(!modulesDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  isCorridorActive || modulesDropdownOpen
                    ? "bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold"
                    : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40"
                }`}
                aria-expanded={modulesDropdownOpen}
              >
                <span>{t("modulesMenu")}</span>
                <span className="text-[9px] font-mono px-1 rounded bg-neutral-200/70 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                  00-07
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className={`transition-transform duration-200 ${modulesDropdownOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Modules Dropdown Popover */}
              {modulesDropdownOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-72 bg-white/95 dark:bg-[#11131a]/95 backdrop-blur-xl border border-neutral-200/90 dark:border-neutral-800 rounded-xl shadow-2xl p-2 z-50 transition-all duration-150 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 mb-1 border-b border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                      {t("corridorModules")}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400">8 Modules</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {corridorModules.map((item) => {
                      const isActive = isHome && activeSection === item.section;
                      return (
                        <Link
                          key={item.section}
                          href={item.href}
                          onClick={(e) => handleSmoothScroll(e, item.section)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                            isActive
                              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-2xs"
                              : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/70"
                          }`}
                        >
                          <span className="truncate pr-1">{item.label}</span>
                          <span className={`text-[9px] font-mono shrink-0 ${isActive ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-400 dark:text-neutral-500"}`}>
                            {item.index}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Divider between Modules & Platform Suite */}
            <div className="h-3.5 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

            {/* Platform Pages */}
            {pageLinks.map((item) => {
              const isPageActive = pathname.includes(item.section);
              const Icon = item.icon;

              return (
                <Link
                  key={item.section}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-150 whitespace-nowrap ${
                    isPageActive
                      ? "bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold"
                      : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40"
                  }`}
                >
                  <Icon size={13} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Search, Theme, Language, Intro Replay & Launch AI */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Search Trigger Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="group hidden md:flex h-9 items-center gap-2 px-3 rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all bg-neutral-50/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer shadow-2xs"
              title={t("searchTitle")}
            >
              <SearchIcon size={14} className="text-neutral-400 dark:text-neutral-500 group-hover:text-black dark:group-hover:text-white transition-colors" strokeWidth={1.8} />
              <span className="hidden lg:inline text-[11px] font-sans text-neutral-600 dark:text-neutral-400">{t("searchBtn")}</span>
              <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-[9px] font-mono font-semibold text-neutral-600 dark:text-neutral-300">
                ⌘K
              </kbd>
            </button>

            {/* Mobile / Compact Search Icon Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-all cursor-pointer"
              title={t("searchTitle")}
              aria-label={t("searchBtn")}
            >
              <SearchIcon size={15} strokeWidth={1.8} />
            </button>

            {/* Theme Switcher (36x36 Icon Button) */}
            <ThemeSwitcher />

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Replay Intro Button (36x36 Icon Button) */}
            <button
              onClick={() => setShowIntro(true)}
              title={t("replayIntro")}
              aria-label={t("replayIntro")}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-all shadow-2xs cursor-pointer"
            >
              <RefreshIcon size={14} strokeWidth={1.8} />
            </button>

            {/* Quick Action Button: Launch AI */}
            <Link
              href={`/${locale}/ai-intelligence`}
              className="hidden sm:inline-flex items-center h-9 px-3.5 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 transition-all rounded-full shadow-xs active:scale-95 whitespace-nowrap"
            >
              {t("launchAI")}
            </Link>

            {/* Mobile / Tablet Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
              aria-label={t("toggleMenu")}
            >
              {mobileMenuOpen ? (
                <CloseIcon size={17} strokeWidth={1.8} />
              ) : (
                <MenuIcon size={17} strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl px-4 sm:px-6 py-5 space-y-4 shadow-2xl transition-all max-h-[calc(100vh-64px)] overflow-y-auto">
            {/* Search Palette Trigger */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchModalOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 text-xs font-mono text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <SearchIcon size={15} />
                <span className="font-sans text-neutral-700 dark:text-neutral-300">{t("searchPlaceholder")}</span>
              </span>
              <kbd className="px-1.5 py-0.5 bg-neutral-200/70 dark:bg-neutral-800 text-[10px] rounded font-semibold text-neutral-600 dark:text-neutral-300">⌘K</kbd>
            </button>

            {/* Corridor Modules */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-1 mb-2">
                {t("corridorModules")}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {corridorModules.map((item) => {
                  const isActive = isHome && activeSection === item.section;

                  return (
                    <Link
                      key={item.section}
                      href={item.href}
                      onClick={(e) => handleSmoothScroll(e, item.section)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <span className="truncate mr-1">{item.label}</span>
                      <span className={`text-[9px] font-mono shrink-0 ${isActive ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-400 dark:text-neutral-600"}`}>
                        {item.index}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Platform Pages */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-1 mb-2">
                {t("platformSuite")}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {pageLinks.map((item) => {
                  const isPageActive = pathname.includes(item.section);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.section}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs transition-all ${
                        isPageActive
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <Icon size={14} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Utilities Bottom Row */}
            <div className="pt-3 border-t border-neutral-200/70 dark:border-neutral-800/70 space-y-3">
              <ThemeSwitcher compact={false} />

              <div className="flex flex-wrap items-center justify-between pt-1 gap-2">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowIntro(true);
                    }}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <RefreshIcon size={13} />
                    <span>{t("replayIntro")}</span>
                  </button>
                </div>

                <Link
                  href={`/${locale}/ai-intelligence`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center h-9 px-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-semibold rounded-full uppercase tracking-wider shadow-xs"
                >
                  {t("launchAI")}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}