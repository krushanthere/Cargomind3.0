"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { createShipment } from "@/lib/api/shipments";
import type { CreateShipmentRequest, ShipmentTempClass } from "@/types";

function ArrowLeftIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path
        d="M19 12H5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 19L5 12L12 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M7 17L17 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M9 7H17V15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7.5L12 3L20 7.5V16.5L12 21L4 16.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 7.5L12 12L19.5 7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 12V20.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 10.5C20 15.5 12 21 12 21C12 21 4 15.5 4 10.5C4 6.36 7.58 3 12 3C16.42 3 20 6.36 20 10.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10.5"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ThermometerIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <path
        d="M14 14.76V5C14 3.895 13.105 3 12 3C10.895 3 10 3.895 10 5V14.76C8.775 15.469 8 16.78 8 18.25C8 20.459 9.791 22.25 12 22.25C14.209 22.25 16 20.459 16 18.25C16 16.78 15.225 15.469 14 14.76Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 8V18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 7V12L15.5 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IndianRupeeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 5H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M6 9H17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 5C12.5 5 15 6.5 15 9C15 11.5 12.5 13 8 13H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 13L16.5 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L13.8 9.2L21 11L13.8 12.8L12 20L10.2 12.8L3 11L10.2 9.2L12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CreateShipmentPage() {
  const [form, setForm] = useState<CreateShipmentRequest>({
    origin_hub_id: "",
    dest_hub_id: "",
    weight_kg: 0,
    volume_cbm: 0,
    temp_class: "chilled",
    sla_deadline: "",
    max_cost: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdShipmentId, setCreatedShipmentId] = useState<string | null>(
    null,
  );

  function updateField<K extends keyof CreateShipmentRequest>(
    field: K,
    value: CreateShipmentRequest[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(false);
    setCreatedShipmentId(null);

    if (!form.origin_hub_id.trim()) {
      setError("Please enter the origin hub.");
      return;
    }

    if (!form.dest_hub_id.trim()) {
      setError("Please enter the destination hub.");
      return;
    }

    if (form.origin_hub_id.trim() === form.dest_hub_id.trim()) {
      setError("Origin and destination hubs cannot be the same.");
      return;
    }

    if (form.weight_kg <= 0) {
      setError("Weight must be greater than 0 kg.");
      return;
    }

    if (form.volume_cbm <= 0) {
      setError("Volume must be greater than 0 m³.");
      return;
    }

    if (!form.sla_deadline) {
      setError("Please select an SLA deadline.");
      return;
    }

    if (form.max_cost <= 0) {
      setError("Maximum cost must be greater than ₹0.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await createShipment(form);

      setSuccess(true);

      if (response?.id) {
        setCreatedShipmentId(response.id);
      }

      setForm({
        origin_hub_id: "",
        dest_hub_id: "",
        weight_kg: 0,
        volume_cbm: 0,
        temp_class: "chilled",
        sla_deadline: "",
        max_cost: 0,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the shipment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="cargomind-grid min-h-[calc(100vh-88px)] px-7 pb-16 pt-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <section className="animate-fade-up">
          <Link
            href="/shipments"
            className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-[#111216]"
          >
            <ArrowLeftIcon />
            Back to shipments
          </Link>

          <div className="mt-7 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 backdrop-blur-md">
                <PackageIcon />
                Shipment Intake
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.055em] text-[#111a20] sm:text-5xl">
                Create shipment
              </h1>

              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-slate-500">
                Add a shipment request to the CargoMind network.
                Once created, the optimization engine can evaluate
                it for intelligent consolidation.
              </p>
            </div>

            <div className="hidden items-center gap-3 rounded-2xl border border-white/70 bg-white/40 px-4 py-3 text-[10px] text-slate-500 lg:flex">
              <SparkIcon />
              <span>Optimization-ready shipment intake</span>
            </div>
          </div>
        </section>

        {/* Success */}
        {success && (
          <section className="mt-7 rounded-[25px] border border-emerald-200/70 bg-emerald-50/70 p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-[12px] font-semibold text-emerald-700">
                  Shipment created successfully
                </p>

                <p className="mt-1 text-[10px] leading-5 text-emerald-700/70">
                  {createdShipmentId
                    ? `Shipment ${createdShipmentId} has been added to the network.`
                    : "The shipment has been added to the network."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {createdShipmentId && (
                  <Link
                    href={`/shipments/${createdShipmentId}`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-[10px] font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    View shipment
                    <ArrowUpRightIcon />
                  </Link>
                )}

                <Link
                  href="/shipments"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/70 px-4 text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-white"
                >
                  Shipment registry
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Error */}
        {error && (
          <section className="mt-7 rounded-[25px] border border-rose-200/70 bg-rose-50/70 p-5">
            <p className="text-[12px] font-semibold text-rose-700">
              Unable to create shipment
            </p>

            <p className="mt-1 text-[10px] leading-5 text-rose-600/70">
              {error}
            </p>
          </section>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-7 grid gap-5 xl:grid-cols-[1.45fr_0.55fr]"
        >
          <div className="space-y-5">
            {/* Route */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-400/10 text-slate-600">
                  <MapPinIcon />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Movement
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                    Origin & destination
                  </h2>

                  <p className="mt-1 text-[10px] leading-5 text-slate-400">
                    Define the hub-to-hub corridor for this shipment.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="origin_hub_id"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Origin hub
                  </label>

                  <input
                    id="origin_hub_id"
                    type="text"
                    value={form.origin_hub_id}
                    onChange={(event) =>
                      updateField(
                        "origin_hub_id",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. DELHI_HUB"
                    className="h-13 w-full rounded-2xl border border-white/70 bg-white/50 px-4 text-[12px] text-[#111a20] outline-none transition-all placeholder:text-slate-300 focus:border-slate-300 focus:bg-white/80"
                  />

                  <p className="mt-2 text-[9px] text-slate-400">
                    ID of the shipment origin hub.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="dest_hub_id"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Destination hub
                  </label>

                  <input
                    id="dest_hub_id"
                    type="text"
                    value={form.dest_hub_id}
                    onChange={(event) =>
                      updateField(
                        "dest_hub_id",
                        event.target.value,
                      )
                    }
                    placeholder="e.g. MUMBAI_HUB"
                    className="h-13 w-full rounded-2xl border border-white/70 bg-white/50 px-4 text-[12px] text-[#111a20] outline-none transition-all placeholder:text-slate-300 focus:border-slate-300 focus:bg-white/80"
                  />

                  <p className="mt-2 text-[9px] text-slate-400">
                    ID of the shipment destination hub.
                  </p>
                </div>
              </div>
            </section>

            {/* Cargo */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-600">
                  <ThermometerIcon />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Cargo profile
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                    Weight, volume & temperature
                  </h2>

                  <p className="mt-1 text-[10px] leading-5 text-slate-400">
                    These constraints are used by the consolidation
                    and risk engines.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-3">
                <div>
                  <label
                    htmlFor="weight_kg"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Weight
                  </label>

                  <div className="relative">
                    <input
                      id="weight_kg"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.weight_kg === 0
                          ? ""
                          : form.weight_kg
                      }
                      onChange={(event) =>
                        updateField(
                          "weight_kg",
                          Number(event.target.value),
                        )
                      }
                      placeholder="0"
                      className="h-13 w-full rounded-2xl border border-white/70 bg-white/50 px-4 pr-14 text-[12px] text-[#111a20] outline-none transition-all placeholder:text-slate-300 focus:border-slate-300 focus:bg-white/80"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="volume_cbm"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Volume
                  </label>

                  <div className="relative">
                    <input
                      id="volume_cbm"
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        form.volume_cbm === 0
                          ? ""
                          : form.volume_cbm
                      }
                      onChange={(event) =>
                        updateField(
                          "volume_cbm",
                          Number(event.target.value),
                        )
                      }
                      placeholder="0"
                      className="h-13 w-full rounded-2xl border border-white/70 bg-white/50 px-4 pr-14 text-[12px] text-[#111a20] outline-none transition-all placeholder:text-slate-300 focus:border-slate-300 focus:bg-white/80"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400">
                      m³
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="temp_class"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Temperature class
                  </label>

                  <select
                    id="temp_class"
                    value={form.temp_class}
                    onChange={(event) =>
                      updateField(
                        "temp_class",
                        event.target
                          .value as ShipmentTempClass,
                      )
                    }
                    className="h-13 w-full rounded-2xl border border-white/70 bg-white/50 px-4 text-[12px] text-[#111a20] outline-none transition-all focus:border-slate-300 focus:bg-white/80"
                  >
                    <option value="frozen">
                      Frozen
                    </option>

                    <option value="chilled">
                      Chilled
                    </option>

                    <option value="ambient">
                      Ambient
                    </option>
                  </select>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {(
                  [
                    {
                      value: "frozen",
                      title: "Frozen",
                      description:
                        "Strict low-temperature cargo",
                    },
                    {
                      value: "chilled",
                      title: "Chilled",
                      description:
                        "Temperature-controlled cargo",
                    },
                    {
                      value: "ambient",
                      title: "Ambient",
                      description:
                        "Standard temperature cargo",
                    },
                  ] as {
                    value: ShipmentTempClass;
                    title: string;
                    description: string;
                  }[]
                ).map((option) => {
                  const active =
                    form.temp_class === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateField(
                          "temp_class",
                          option.value,
                        )
                      }
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-[#111216]/20 bg-white/80 shadow-sm"
                          : "border-transparent bg-white/35 hover:bg-white/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-[#111a20]">
                          {option.title}
                        </span>

                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            active
                              ? "bg-[#111216]"
                              : "bg-slate-300"
                          }`}
                        />
                      </div>

                      <p className="mt-2 text-[9px] leading-4 text-slate-400">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SLA & budget */}
            <section className="cargomind-panel rounded-[30px] p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-600">
                  <ClockIcon />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                    Commercial constraints
                  </p>

                  <h2 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#111a20]">
                    SLA deadline & maximum cost
                  </h2>

                  <p className="mt-1 text-[10px] leading-5 text-slate-400">
                    The optimizer uses these values when generating
                    candidate plans.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="sla_deadline"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    SLA deadline
                  </label>

                  <input
                    id="sla_deadline"
                    type="datetime-local"
                    value={form.sla_deadline}
                    onChange={(event) =>
                      updateField(
                        "sla_deadline",
                        event.target.value,
                      )
                    }
                    className="h-13 w-full rounded-2xl border border-white/70 bg-white/50 px-4 text-[12px] text-[#111a20] outline-none transition-all focus:border-slate-300 focus:bg-white/80"
                  />

                  <p className="mt-2 text-[9px] text-slate-400">
                    Latest acceptable delivery time.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="max_cost"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Maximum cost
                  </label>

                  <div className="relative">
                    <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <IndianRupeeIcon />
                    </div>

                    <input
                      id="max_cost"
                      type="number"
                      min="0"
                      step="100"
                      value={
                        form.max_cost === 0
                          ? ""
                          : form.max_cost
                      }
                      onChange={(event) =>
                        updateField(
                          "max_cost",
                          Number(event.target.value),
                        )
                      }
                      placeholder="0"
                      className="h-13 w-full rounded-2xl border border-white/70 bg-white/50 px-11 pr-4 text-[12px] text-[#111a20] outline-none transition-all placeholder:text-slate-300 focus:border-slate-300 focus:bg-white/80"
                    />
                  </div>

                  <p className="mt-2 text-[9px] text-slate-400">
                    Maximum acceptable shipment cost.
                  </p>
                </div>
              </div>
            </section>

            {/* Submit */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/shipments"
                className="inline-flex h-13 items-center justify-center rounded-2xl border border-white/70 bg-white/45 px-7 text-[11px] font-medium text-slate-600 transition-colors hover:bg-white/70"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#111216] px-7 text-[11px] font-semibold text-white shadow-[0_15px_35px_rgba(17,18,22,0.15)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#24252a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating shipment...
                  </>
                ) : (
                  <>
                    Create shipment
                    <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowUpRightIcon />
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right information panel */}
          <aside className="space-y-5">
            <div className="relative overflow-hidden rounded-[30px] bg-[#111216] p-7 text-white shadow-[0_25px_70px_rgba(17,18,22,0.12)]">
              <div className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-2 text-cyan-300">
                  <SparkIcon />

                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em]">
                    CargoMind intelligence
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-semibold tracking-[-0.035em]">
                  What happens next?
                </h3>

                <p className="mt-3 text-[11px] leading-6 text-white/45">
                  Your shipment becomes part of the optimization
                  network. CargoMind can evaluate compatible
                  shipments together and generate multiple
                  consolidation strategies.
                </p>

                <div className="mt-7 space-y-4">
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-cyan-300">
                      01
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-white/80">
                        Compatibility check
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-white/35">
                        Temperature, route and cargo constraints are
                        evaluated.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-cyan-300">
                      02
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-white/80">
                        Risk prediction
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-white/35">
                        Delay and spoilage risk can be evaluated for
                        candidate movements.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-cyan-300">
                      03
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-white/80">
                        Consolidation
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-white/35">
                        The optimizer can group compatible shipments
                        into candidate plans.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cargomind-panel rounded-[30px] p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-600">
                  <PackageIcon />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-400">
                    Data requirements
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-[#111a20]">
                    Required shipment fields
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  "Origin hub",
                  "Destination hub",
                  "Weight & volume",
                  "Temperature class",
                  "SLA deadline",
                  "Maximum cost",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/10 text-[9px] font-bold text-emerald-600">
                      ✓
                    </span>

                    <span className="text-[10px] text-slate-500">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}