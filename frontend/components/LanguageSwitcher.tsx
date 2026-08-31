"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const LOCALE_META: Record<string, { label: string; nativeLabel: string; flag: string }> = {
  en: { label: "English", nativeLabel: "English", flag: "EN" },
  hi: { label: "Hindi", nativeLabel: "हिन्दी", flag: "हि" },
  or: { label: "Odia", nativeLabel: "ଓଡ଼ିଆ", flag: "ଓ" },
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: string) => {
    // Replace the current locale prefix in the pathname
    const segments = pathname.split("/");
    // segments[0] is empty string, segments[1] is locale
    segments[1] = newLocale;
    const newPath = segments.join("/") || `/${newLocale}`;
    router.push(newPath);
    setIsOpen(false);
  };

  const currentMeta = LOCALE_META[locale] || LOCALE_META.en;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-neutral-200 hover:border-black transition-all bg-neutral-50/80 hover:bg-white text-xs font-mono text-neutral-600 hover:text-black cursor-pointer shadow-2xs"
        title="Switch Language"
        aria-label="Switch Language"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-neutral-400 group-hover:text-black transition-colors"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-[11px] font-semibold">{currentMeta.flag}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {Object.entries(LOCALE_META).map(([code, meta]) => (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-xs transition-colors cursor-pointer ${
                locale === code
                  ? "bg-neutral-100 text-black font-semibold"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] w-6 text-center font-bold">
                  {meta.flag}
                </span>
                <div className="flex flex-col items-start">
                  <span>{meta.nativeLabel}</span>
                  {meta.nativeLabel !== meta.label && (
                    <span className="text-[10px] text-neutral-400">{meta.label}</span>
                  )}
                </div>
              </div>
              {locale === code && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
