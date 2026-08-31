"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  StarburstIcon,
  AiBrainIcon,
  InfoCircleIcon,
  PulseIcon,
  RefreshIcon,
  MenuIcon,
  CloseIcon,
  SearchIcon,
  RouteIcon,
  CubeIcon,
  CpuIcon,
  ThermometerIcon,
  SlidersIcon,
  AlertCircleIcon,
} from "../icons/Hugeicons";
import OpeningScreen from "../OpeningScreen";
import LogisticsSearchModal from "../search/LogisticsSearchModal";
import LanguageSwitcher from "../LanguageSwitcher";

export default function TopNavigation() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const locale = useLocale();
  const [showIntro, setShowIntro] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [sectionTitle, setSectionTitle] = useState<string>(t("sectionTitles.overview"));

  useEffect(() => {
    if (pathname === `/${locale}/ai-intelligence`) {
      setActiveSection("ai-intelligence");
      setSectionTitle(t("sectionTitles.aiIntelligence"));
      return;
    }
    if (pathname === `/${locale}/about`) {
      setActiveSection("about");
      setSectionTitle(t("sectionTitles.about"));
      return;
    }

    const sections = [
      { id: "overview", titleKey: "sectionTitles.overview" as const },
      { id: "network", titleKey: "sectionTitles.network" as const },
      { id: "shipments", titleKey: "sectionTitles.shipments" as const },
      { id: "dispatch", titleKey: "sectionTitles.dispatch" as const },
      { id: "sensors", titleKey: "sectionTitles.sensors" as const },
      { id: "fairness", titleKey: "sectionTitles.fairness" as const },
      { id: "alerts", titleKey: "sectionTitles.alerts" as const },
    ];

    const handleScroll = () => {
      const scrollPos = window.scrollY + 140;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveSection(sections[i].id);
            setSectionTitle(t(sections[i].titleKey));
            break;
          }
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, locale, t]);

  const navLinks = [
    { label: t("overview"), href: `/${locale}/#overview`, section: "overview" },
    { label: t("topology"), href: `/${locale}/#network`, section: "network" },
    { label: t("pickups"), href: `/${locale}/#shipments`, section: "shipments" },
    { label: t("dispatch"), href: `/${locale}/#dispatch`, section: "dispatch" },
    { label: t("kinetics"), href: `/${locale}/#sensors`, section: "sensors" },
    { label: t("fairness"), href: `/${locale}/#fairness`, section: "fairness" },
    { label: t("terrain"), href: `/${locale}/#alerts`, section: "alerts" },
    { label: t("aiIntelligence"), href: `/${locale}/ai-intelligence`, section: "ai-intelligence" },
    { label: t("about"), href: `/${locale}/about`, section: "about" },
  ];


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

      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="mx-auto flex h-[72px] max-w-[1680px] items-center justify-between px-6 sm:px-10">
          
          {/* LEFT: Brand Emblem & Dynamic Written Context Badge */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            <Link
              href={`/${locale}`}
              className="group flex items-center gap-3 focus:outline-none"
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-transform duration-300 group-hover:scale-105">
                <StarburstIcon size={18} className="text-white" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[16px] font-medium tracking-[-0.03em] text-[#0a0a0a]">
                  CargoMind
                </span>
                <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-neutral-400">
                  {t("brandSubtitle")}
                </span>
              </div>
            </Link>

            {/* Dynamic Written Context Indicator (Changes simultaneously with scroll) */}
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-neutral-200 font-mono text-[10px] tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-neutral-400 font-normal">{t("currentLabel")}:</span>
              <span className="text-black font-semibold transition-all duration-200">
                {sectionTitle}
              </span>
            </div>
          </div>

          {/* CENTER: Navigation Links (Clean Flex without scrollbar line artifact) */}
          <nav className="hidden 2xl:flex items-center gap-6 py-1 shrink-0">
            {navLinks.map((item) => {
              const isPageActive = pathname === item.href || (item.href.includes("/ai-intelligence") && pathname.includes("/ai-intelligence")) || (item.href.includes("/about") && pathname.includes("/about"));
              const isScrollActive = pathname === `/${locale}` && activeSection === item.section;
              const isActive = isPageActive || isScrollActive;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group relative flex items-center py-2 text-xs transition-colors duration-200 whitespace-nowrap ${
                    isActive
                      ? "text-black font-semibold"
                      : "text-neutral-500 hover:text-black font-medium"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-2.5 left-0 right-0 h-[2px] bg-black transition-all duration-300" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Animated Search Bar, Language Switcher, Intro Replay & Launch AI */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Animated Search Bar Trigger */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="group flex items-center gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-full border border-neutral-200 hover:border-black transition-all bg-neutral-50/80 hover:bg-white text-xs font-mono text-neutral-500 hover:text-black cursor-pointer shadow-2xs"
              title="Search Directory (Cmd+K)"
            >
              <SearchIcon size={14} className="text-neutral-400 group-hover:text-black transition-colors" strokeWidth={1.8} />
              <span className="hidden md:inline text-[11px]">{t("searchPlaceholder")}</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-200/70 text-[9px] text-neutral-700 font-semibold">
                ⌘K
              </kbd>
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Replay Intro Button */}
            <button
              onClick={() => setShowIntro(true)}
              title="Replay Opening Sequence"
              className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-500 hover:text-black transition-colors font-mono uppercase tracking-wider py-1 px-2.5 border border-transparent hover:border-neutral-200 rounded-md cursor-pointer"
            >
              <RefreshIcon size={12} strokeWidth={1.5} />
              <span>{t("replayIntro")}</span>
            </button>

            {/* Quick Action Button */}
            <Link
              href={`/${locale}/ai-intelligence`}
              className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold uppercase tracking-wider bg-black text-white hover:bg-neutral-800 transition-all rounded-full"
            >
              {t("launchAI")}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="2xl:hidden p-2 text-black hover:text-neutral-600 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <CloseIcon size={20} strokeWidth={1.5} />
              ) : (
                <MenuIcon size={20} strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Compact Dropdown */}
        {mobileMenuOpen && (
          <div className="2xl:hidden border-t border-neutral-200 bg-white px-6 py-5 space-y-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchModalOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded border border-neutral-200 bg-neutral-50 text-xs font-mono text-neutral-600 mb-2"
            >
              <span className="flex items-center gap-2">
                <SearchIcon size={15} /> {t("searchPlaceholder")}
              </span>
              <kbd className="px-1.5 py-0.5 bg-neutral-200 text-[10px] rounded">⌘K</kbd>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => {
                const isPageActive = pathname === item.href;
                const isScrollActive = pathname === `/${locale}` && activeSection === item.section;
                const isActive = isPageActive || isScrollActive;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 py-2 px-2.5 rounded text-xs ${
                      isActive
                        ? "bg-neutral-100 text-black font-semibold"
                        : "text-neutral-600 hover:text-black"
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowIntro(true);
                  }}
                  className="flex items-center gap-2 text-xs font-mono uppercase text-neutral-500"
                >
                  <RefreshIcon size={14} />
                  {t("replayIntro")}
                </button>
                <LanguageSwitcher />
              </div>
              <Link
                href={`/${locale}/ai-intelligence`}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-1.5 bg-black text-white text-xs font-semibold rounded-full uppercase tracking-wider"
              >
                {t("launchAI")}
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}