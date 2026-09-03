"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  StarburstIcon,
  RefreshIcon,
  MenuIcon,
  CloseIcon,
  SearchIcon,
  AiBrainIcon,
  InfoCircleIcon,
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
  const [activeSection, setActiveSection] = useState<string>("overview");

  useEffect(() => {
    if (pathname === `/${locale}/ai-intelligence`) {
      setActiveSection("ai-intelligence");
      return;
    }
    if (pathname === `/${locale}/about`) {
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
      const scrollPos = window.scrollY + 140;

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

  const navLinks = [
    { label: t("overview"), href: `/${locale}/#overview`, section: "overview", index: "00" },
    { label: t("topology"), href: `/${locale}/#network`, section: "network", index: "01" },
    { label: t("pickups"), href: `/${locale}/#shipments`, section: "shipments", index: "02" },
    { label: t("dispatch"), href: `/${locale}/#dispatch`, section: "dispatch", index: "03" },
    { label: t("kinetics"), href: `/${locale}/#sensors`, section: "sensors", index: "04" },
    { label: t("fairness"), href: `/${locale}/#fairness`, section: "fairness", index: "05" },
    { label: t("terrain"), href: `/${locale}/#alerts`, section: "alerts", index: "06" },
    { label: t("fleet"), href: `/${locale}/#fleet`, section: "fleet", index: "07" },
  ];

  const pageLinks = [
    { label: t("aiIntelligence"), href: `/${locale}/ai-intelligence`, section: "ai-intelligence", icon: AiBrainIcon },
    { label: t("about"), href: `/${locale}/about`, section: "about", icon: InfoCircleIcon },
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

      <header className="sticky top-0 z-50 w-full bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors duration-200">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          
          {/* LEFT: Brand Emblem & Status Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/${locale}`}
              className="group flex items-center gap-2.5 focus:outline-none"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 transition-transform duration-200 group-hover:scale-105 shadow-2xs">
                <StarburstIcon size={16} className="text-white dark:text-neutral-900" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-semibold tracking-tight text-neutral-950 dark:text-white leading-none">
                  CargoMind
                </span>
                <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-neutral-400 dark:text-neutral-500 leading-tight mt-0.5">
                  {t("brandSubtitle")}
                </span>
              </div>
            </Link>

            {/* Subtle Live System Status Indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/60 dark:bg-neutral-900/60 font-mono text-[9px] tracking-wider text-neutral-500 dark:text-neutral-400 ml-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">{t("online")}</span>
            </div>
          </div>

          {/* CENTER: Navigation Links (Floating Pill Style) */}
          <nav className="hidden xl:flex items-center gap-0.5 bg-neutral-100/70 dark:bg-neutral-900/70 p-1 rounded-full border border-neutral-200/60 dark:border-neutral-800/60 shrink-0">
            {navLinks.map((item) => {
              const isScrollActive = pathname === `/${locale}` && activeSection === item.section;
              const isActive = isScrollActive;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative px-2.5 py-1 text-xs rounded-full font-medium transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Divider between sections and dedicated pages */}
            <div className="h-3.5 w-px bg-neutral-300 dark:bg-neutral-700 mx-1" />

            {pageLinks.map((item) => {
              const isPageActive = pathname.includes(item.section);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative px-2.5 py-1 text-xs rounded-full font-medium transition-all duration-150 whitespace-nowrap ${
                    isPageActive
                      ? "bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Search, Theme, Language, Intro Replay & Launch AI */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Trigger Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="group hidden sm:flex h-9 items-center gap-2 px-3 rounded-full border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all bg-neutral-50/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-mono text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer shadow-2xs"
              title={t("searchTitle")}
            >
              <SearchIcon size={14} className="text-neutral-400 dark:text-neutral-500 group-hover:text-black dark:group-hover:text-white transition-colors" strokeWidth={1.8} />
              <span className="hidden md:inline text-[11px] font-sans text-neutral-500 dark:text-neutral-400">{t("searchBtn")}</span>
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-[9px] font-mono font-semibold text-neutral-600 dark:text-neutral-300">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Search Icon Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="sm:hidden flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-all"
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
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-all shadow-2xs cursor-pointer"
            >
              <RefreshIcon size={14} strokeWidth={1.8} />
            </button>

            {/* Quick Action Button: Launch AI */}
            <Link
              href={`/${locale}/ai-intelligence`}
              className="hidden sm:inline-flex items-center h-9 px-4 text-xs font-semibold uppercase tracking-wider bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 transition-all rounded-full shadow-xs active:scale-95 whitespace-nowrap"
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
                <CloseIcon size={18} strokeWidth={1.8} />
              ) : (
                <MenuIcon size={18} strokeWidth={1.8} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-xl px-4 sm:px-6 py-5 space-y-4 shadow-xl transition-all">
            {/* Search Palette Trigger */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchModalOpen(true);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/90 dark:bg-neutral-900/90 text-xs font-mono text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <SearchIcon size={15} />
                <span className="font-sans text-neutral-700 dark:text-neutral-300">{t("searchPlaceholder")}</span>
              </span>
              <kbd className="px-1.5 py-0.5 bg-neutral-200/70 dark:bg-neutral-800 text-[10px] rounded font-semibold text-neutral-600 dark:text-neutral-300">⌘K</kbd>
            </button>

            {/* Corridor Sections */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 px-1 mb-2">
                {t("corridorModules")}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {navLinks.map((item) => {
                  const isScrollActive = pathname === `/${locale}` && activeSection === item.section;
                  const isActive = isScrollActive;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className={`text-[9px] font-mono ${isActive ? "text-neutral-300 dark:text-neutral-600" : "text-neutral-400 dark:text-neutral-600"}`}>
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
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs transition-all ${
                        isPageActive
                          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold shadow-xs"
                          : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Utilities Bottom Row */}
            <div className="pt-3 border-t border-neutral-200/70 dark:border-neutral-800/70 space-y-3">
              <ThemeSwitcher compact={false} />

              <div className="flex items-center justify-between pt-1 gap-2">
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowIntro(true);
                    }}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-xs font-mono uppercase text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
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