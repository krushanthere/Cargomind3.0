"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  CpuIcon,
  ShieldCheckIcon,
  AiBrainIcon,
  ArrowRightIcon,
  CheckmarkCircleIcon,
} from "../../../components/icons/Hugeicons";

export default function AboutPage() {
  const t = useTranslations("about");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    fleetSize: "Local Cooperative Fleet",
    inquiry: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const inquiryRecord = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `inquiry-${Date.now()}`,
      name: formData.name,
      email: formData.email,
      fleetSize: formData.fleetSize,
      inquiry: formData.inquiry,
      submittedAt: new Date().toISOString(),
      status: "received",
    };

    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("cargomind_inquiries");
        const inquiries = stored ? JSON.parse(stored) : [];
        inquiries.unshift(inquiryRecord);
        localStorage.setItem("cargomind_inquiries", JSON.stringify(inquiries.slice(0, 50)));
      }
    } catch (err) {
      console.warn("Failed to persist inquiry to localStorage", err);
    }

    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-white dark:bg-[#09090b] text-[#0a0a0a] dark:text-[#f4f4f5] transition-colors duration-200">
      {/* Top Breadcrumb & Status */}
      <div className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-surface-1">
        <div className="mx-auto max-w-[1680px] px-6 sm:px-10 py-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="text-black dark:text-white font-semibold">{t("breadcrumb.module")}</span>
            <span>{"//"}</span>
            <span>{t("breadcrumb.subtitle")}</span>
          </div>
          <div className="font-mono text-neutral-600 dark:text-neutral-400">{t("breadcrumb.version")}</div>
        </div>
      </div>

      {/* HERO MANIFESTO (Large Typography, Swiss Editorial) */}
      <div className="mx-auto max-w-[1680px] px-6 sm:px-10 py-16 sm:py-24 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-4xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500 mb-4">
            {t("hero.label")}
          </div>
          <h1 className="text-4xl sm:text-6xl font-light tracking-[-0.04em] text-black dark:text-white leading-[1.06]">
            {t("hero.headline")} <br />
            <span className="font-semibold">{t("hero.headlineBold")}</span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 font-light leading-relaxed">
            {t("hero.description")}
          </p>
        </div>
      </div>

      {/* THE THREE CORE PILLARS (CARD-FREE 1px SPLIT GRID) */}
      <div className="mx-auto max-w-[1680px] border-b border-neutral-200 dark:border-neutral-800">
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
          
          {/* PILLAR 1: Dynamic Matching */}
          <div className="p-8 sm:p-12 space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              {t("pillars.p1.label")}
            </div>
            <div className="flex items-center gap-3 text-black dark:text-white">
              <CpuIcon size={24} strokeWidth={1.5} />
              <h2 className="text-xl font-medium tracking-tight">
                {t("pillars.p1.title")}
              </h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
              {t("pillars.p1.description")}
            </p>
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
              {t("pillars.p1.metric")}
            </div>
          </div>

          {/* PILLAR 2: Fairness & Equity */}
          <div className="p-8 sm:p-12 space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              {t("pillars.p2.label")}
            </div>
            <div className="flex items-center gap-3 text-black dark:text-white">
              <ShieldCheckIcon size={24} strokeWidth={1.5} />
              <h2 className="text-xl font-medium tracking-tight">
                {t("pillars.p2.title")}
              </h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
              {t("pillars.p2.description")}
            </p>
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
              {t("pillars.p2.metric")}
            </div>
          </div>

          {/* PILLAR 3: Offline-First Reliability */}
          <div className="p-8 sm:p-12 space-y-6">
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
              {t("pillars.p3.label")}
            </div>
            <div className="flex items-center gap-3 text-black dark:text-white">
              <AiBrainIcon size={24} strokeWidth={1.5} />
              <h2 className="text-xl font-medium tracking-tight">
                {t("pillars.p3.title")}
              </h2>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 font-light leading-relaxed">
              {t("pillars.p3.description")}
            </p>
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
              {t("pillars.p3.metric")}
            </div>
          </div>
        </div>
      </div>

      {/* ARCHITECTURAL PIPELINE (LINEAR FLOW, NO CARDS) */}
      <div className="mx-auto max-w-[1680px] p-8 sm:p-14 border-b border-neutral-200 dark:border-neutral-800">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
          {t("architecture.label")}
        </div>
        <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-black dark:text-white mb-10">
          {t("architecture.title")}
        </h3>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 divide-neutral-100 dark:divide-neutral-800">
          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black dark:text-white">{t("architecture.steps.s01.step")}</div>
            <div className="text-sm font-medium text-black dark:text-neutral-200">{t("architecture.steps.s01.title")}</div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
              {t("architecture.steps.s01.description")}
            </p>
          </div>

          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black dark:text-white">{t("architecture.steps.s02.step")}</div>
            <div className="text-sm font-medium text-black dark:text-neutral-200">{t("architecture.steps.s02.title")}</div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
              {t("architecture.steps.s02.description")}
            </p>
          </div>

          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black dark:text-white">{t("architecture.steps.s03.step")}</div>
            <div className="text-sm font-medium text-black dark:text-neutral-200">{t("architecture.steps.s03.title")}</div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
              {t("architecture.steps.s03.description")}
            </p>
          </div>

          <div className="pt-4 sm:pt-0 space-y-2">
            <div className="font-mono text-xs font-semibold text-black dark:text-white">{t("architecture.steps.s04.step")}</div>
            <div className="text-sm font-medium text-black dark:text-neutral-200">{t("architecture.steps.s04.title")}</div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">
              {t("architecture.steps.s04.description")}
            </p>
          </div>
        </div>
      </div>

      {/* COOPERATIVE & NGO INQUIRY FORM */}
      <div className="mx-auto max-w-[1680px] p-8 sm:p-14">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-3">
              {t("form.label")}
            </div>
            <h3 className="text-3xl sm:text-4xl font-light tracking-tight text-black dark:text-white leading-tight">
              {t("form.headline")} <br />
              <span className="font-semibold">{t("form.headlineBold")}</span>
            </h3>
            <p className="mt-4 text-neutral-600 dark:text-neutral-300 font-light leading-relaxed max-w-md text-sm sm:text-base">
              {t("form.description")}
            </p>

            <div className="mt-8 font-mono text-xs text-neutral-500 dark:text-neutral-400 space-y-2">
              <div>{t("form.specs.protocol")}</div>
              <div>{t("form.specs.deployment")}</div>
              <div>{t("form.specs.governance")}</div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="pt-2">
            {submitted ? (
              <div className="p-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-center space-y-3">
                <CheckmarkCircleIcon size={32} className="mx-auto text-black dark:text-white" />
                <h4 className="text-lg font-medium text-black dark:text-white">{t("form.success.title")}</h4>
                <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  {t("form.success.description")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    {t("form.fields.name")}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t("form.fields.namePlaceholder")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full swiss-input text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    {t("form.fields.email")}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={t("form.fields.emailPlaceholder")}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full swiss-input text-sm"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                    {t("form.fields.inquiry")}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t("form.fields.inquiryPlaceholder")}
                    value={formData.inquiry}
                    onChange={(e) => setFormData({ ...formData, inquiry: e.target.value })}
                    className="w-full swiss-input text-sm resize-none"
                  />
                </div>

                <div className="pt-6 flex items-center justify-between">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-mono text-xs font-semibold uppercase tracking-wider rounded-full flex items-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all cursor-pointer"
                  >
                    <span>{t("form.fields.submit")}</span>
                    <ArrowRightIcon size={14} strokeWidth={2} />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
