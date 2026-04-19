"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import type { BookingData } from "@/lib/types";
import CalendarPicker from "@/app/components/CalendarPicker";

const USECASES = ["Legacy bookie", "New bookie", "Affil + fix", "Fix only"] as const;

type FormState = "idle" | "loading" | "success" | "error";

const EMPTY_FORM: BookingData = {
  terminFrom: "",
  terminTo: "",
  bookie: "",
  projectCountry: "",
  usecase: "Legacy bookie",
  worldCup2026: false,
  headline: "",
  description: "",
  ctaButtonText: "",
  iosTrackingId: "",
  andTrackingId: "",
  iosLink: "",
  andLink: "",
  imageUrl: "",
  notes: "",
};

export default function BookingForm() {
  const [form, setForm] = useState<BookingData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof BookingData, string>>>({});
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewImageSrc, setPreviewImageSrc] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof BookingData>(key: K, value: BookingData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Immediate local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImageSrc(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();

    if (res.ok) {
      set("imageUrl", json.url);
    } else {
      setErrors((prev) => ({ ...prev, imageUrl: json.error || "Upload failed" }));
      setPreviewImageSrc("");
      set("imageUrl", "");
    }
    setUploadingImage(false);
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof BookingData, string>> = {};

    // Date range — required
    if (!form.terminFrom) newErrors.terminFrom = "Required";
    if (!form.terminTo) newErrors.terminTo = "Required";

    // Bookie — required
    if (!form.bookie) newErrors.bookie = "Required";

    // Country — required
    if (!form.projectCountry) newErrors.projectCountry = "Required";

    // Usecase — always has a value but validate it's one of the allowed options
    if (!form.usecase) newErrors.usecase = "Required";

    // Links — required
    if (!form.iosLink) {
      newErrors.iosLink = "Required";
    }
    if (!form.andLink) {
      newErrors.andLink = "Required";
    }

    // Char limits (optional fields)
    if (form.headline.length > 55) newErrors.headline = "Max 55 characters";
    if (form.description.length > 270) newErrors.description = "Max 270 characters";
    if (form.ctaButtonText.length > 20) newErrors.ctaButtonText = "Max 20 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setFormState("loading");
    setErrorMessage("");

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setFormState("success");
    } else {
      const json = await res.json();
      setErrorMessage(json.error || "Submission failed. Please try again.");
      setFormState("error");
    }
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setErrors({});
    setFormState("idle");
    setErrorMessage("");
    setPreviewImageSrc("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const inputBase =
    "w-full bg-fs-slate border rounded-lg px-4 py-3 text-white font-fs placeholder-fs-gray-3 focus:outline-none transition-colors";
  const inputOk = "border-fs-gray-3 focus:border-fs-gray-1";
  const inputErr = "border-fs-red";
  const inputClass = (field: keyof BookingData) =>
    `${inputBase} ${errors[field] ? inputErr : inputOk}`;
  const labelClass = "block text-fs-chalk text-sm font-fs mb-1.5";

  if (formState === "success") {
    return (
      <div className="min-h-screen bg-fs-slate flex items-center justify-center px-4">
        <div className="bg-fs-slate-light rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="text-green-400 text-5xl mb-4">✓</div>
          <h2 className="font-flash font-bold text-2xl text-white mb-2">Campaign Booked!</h2>
          <p className="text-fs-gray-2 font-fs mb-8">
            Your campaign has been submitted and added to the booking sheet.
          </p>
          <button
            onClick={handleReset}
            className="bg-fs-red text-white font-flash font-bold uppercase tracking-wider px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fs-slate">
      {/* Header */}
      <header className="bg-fs-slate-dark border-b border-fs-slate-light px-6 py-4 sticky top-0 z-10">
        <h1 className="font-flash font-bold text-xl text-white tracking-tight">
          FLASH<span className="text-fs-red">SCORE</span>
          <span className="text-fs-gray-2 font-fs font-normal text-base ml-3 tracking-normal">
            In-App Message Booking
          </span>
        </h1>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">

        {/* ── Left: Form ── */}
        <div className="lg:w-1/2 overflow-y-auto p-6 lg:p-10">
          <form onSubmit={handleSubmit} noValidate className="space-y-5 max-w-xl mx-auto">

            {/* Campaign Date (calendar range picker) */}
            <div>
              <label className={labelClass}>Campaign Date *</label>
              <CalendarPicker
                from={form.terminFrom}
                to={form.terminTo}
                onChange={(from, to) => {
                  set("terminFrom", from);
                  set("terminTo", to);
                }}
                errorFrom={errors.terminFrom}
                errorTo={errors.terminTo}
              />
            </div>

            {/* Bookie */}
            <div>
              <label className={labelClass}>Bookie *</label>
              <input
                type="text"
                value={form.bookie}
                onChange={(e) => set("bookie", e.target.value)}
                placeholder="e.g. Bet365"
                className={inputClass("bookie")}
              />
              {errors.bookie && (
                <p className="text-fs-red text-xs font-fs mt-1">{errors.bookie}</p>
              )}
            </div>

            {/* Project / Country */}
            <div>
                <label className={labelClass}>Project / Country *</label>
                <input
                  type="text"
                  value={form.projectCountry}
                  onChange={(e) => set("projectCountry", e.target.value)}
                  placeholder="e.g. CZ, PL, GB"
                  className={inputClass("projectCountry")}
                />
                {errors.projectCountry && (
                  <p className="text-fs-red text-xs font-fs mt-1">{errors.projectCountry}</p>
                )}
            </div>

            {/* Usecase */}
            <div>
              <label className={labelClass}>Usecase *</label>
              <select
                value={form.usecase}
                onChange={(e) => set("usecase", e.target.value as BookingData["usecase"])}
                className={inputClass("usecase")}
              >
                {USECASES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* World Cup */}
            <div className="flex items-center gap-3">
              <input
                id="worldCup"
                type="checkbox"
                checked={form.worldCup2026}
                onChange={(e) => set("worldCup2026", e.target.checked)}
                className="w-5 h-5 accent-fs-red cursor-pointer rounded"
              />
              <label htmlFor="worldCup" className="text-fs-chalk font-fs text-sm cursor-pointer select-none">
                World Cup 2026 campaign
              </label>
            </div>

            <div className="border-t border-fs-slate-light pt-1" />

            {/* Headline */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className={labelClass.replace("mb-1.5", "")}>Headline</label>
                <span className={`text-xs font-fs ${form.headline.length > 50 ? "text-amber-400" : "text-fs-gray-3"}`}>
                  {form.headline.length}/55 · Max 50 chars recommended
                </span>
              </div>
              <input
                type="text"
                value={form.headline}
                onChange={(e) => set("headline", e.target.value)}
                placeholder="Bold title shown in the modal"
                maxLength={55}
                className={inputClass("headline")}
              />
              {errors.headline && <p className="text-fs-red text-xs font-fs mt-1">{errors.headline}</p>}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className={labelClass.replace("mb-1.5", "")}>Description</label>
                <span className={`text-xs font-fs ${form.description.length > 250 ? "text-amber-400" : "text-fs-gray-3"}`}>
                  {form.description.length}/270 · Max 250 chars recommended
                </span>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Body text shown below the headline"
                rows={3}
                maxLength={270}
                className={`${inputClass("description")} resize-none`}
              />
              {errors.description && (
                <p className="text-fs-red text-xs font-fs mt-1">{errors.description}</p>
              )}
            </div>

            {/* CTA */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <label className={labelClass.replace("mb-1.5", "")}>CTA Button Text</label>
                <span className={`text-xs font-fs ${form.ctaButtonText.length > 20 ? "text-fs-red" : "text-fs-gray-3"}`}>
                  {form.ctaButtonText.length}/20
                </span>
              </div>
              <input
                type="text"
                value={form.ctaButtonText}
                onChange={(e) => set("ctaButtonText", e.target.value)}
                placeholder="e.g. BET NOW"
                maxLength={20}
                className={inputClass("ctaButtonText")}
              />
              {errors.ctaButtonText && (
                <p className="text-fs-red text-xs font-fs mt-1">{errors.ctaButtonText}</p>
              )}
            </div>

            <div className="border-t border-fs-slate-light pt-1" />

            {/* Tracking IDs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>iOS Tracking ID</label>
                <input
                  type="text"
                  value={form.iosTrackingId}
                  onChange={(e) => set("iosTrackingId", e.target.value)}
                  placeholder="iOS"
                  className={inputClass("iosTrackingId")}
                />
              </div>
              <div>
                <label className={labelClass}>AND Tracking ID</label>
                <input
                  type="text"
                  value={form.andTrackingId}
                  onChange={(e) => set("andTrackingId", e.target.value)}
                  placeholder="Android"
                  className={inputClass("andTrackingId")}
                />
              </div>
            </div>

            {/* Links */}
            <div>
              <label className={labelClass}>iOS Link *</label>
              <input
                type="url"
                value={form.iosLink}
                onChange={(e) => set("iosLink", e.target.value)}
                placeholder="https://"
                className={inputClass("iosLink")}
              />
            </div>
            <div>
              <label className={labelClass}>AND Link *</label>
              <input
                type="url"
                value={form.andLink}
                onChange={(e) => set("andLink", e.target.value)}
                placeholder="https://"
                className={inputClass("andLink")}
              />
            </div>

            <div className="border-t border-fs-slate-light pt-1" />

            {/* Banner Image */}
            <div>
              <label className={labelClass}>Banner Image</label>
              <p className="text-fs-gray-3 text-xs font-fs mb-2">
                JPG or PNG · max 10 MB · recommended 1500 × 1000 px (3:2)
              </p>
              <label
                htmlFor="bannerImage"
                className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg px-4 py-6 cursor-pointer transition-colors ${
                  errors.imageUrl
                    ? "border-fs-red"
                    : "border-fs-gray-3 hover:border-fs-gray-1"
                }`}
              >
                {uploadingImage ? (
                  <span className="text-fs-gray-2 font-fs text-sm flex items-center gap-2">
                    <Spinner /> Uploading…
                  </span>
                ) : form.imageUrl ? (
                  <span className="text-green-400 font-fs text-sm">✓ Image uploaded — click to replace</span>
                ) : (
                  <span className="text-fs-gray-2 font-fs text-sm">Click to select image</span>
                )}
              </label>
              <input
                ref={fileInputRef}
                id="bannerImage"
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                className="sr-only"
              />
              {errors.imageUrl && (
                <p className="text-fs-red text-xs font-fs mt-1">{errors.imageUrl}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any additional notes or instructions…"
                rows={4}
                className={`${inputClass("notes")} resize-none`}
              />
            </div>

            {/* Error banner */}
            {formState === "error" && (
              <div className="bg-fs-red/10 border border-fs-red rounded-lg px-4 py-3 text-fs-red font-fs text-sm">
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={formState === "loading" || uploadingImage}
              className="w-full bg-fs-red text-white font-flash font-bold uppercase tracking-wider py-4 rounded-lg text-base hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {formState === "loading" ? (
                <>
                  <Spinner />
                  Submitting…
                </>
              ) : (
                "Book Campaign"
              )}
            </button>
          </form>
        </div>

        {/* ── Right: Live Preview ── */}
        <div className="lg:w-1/2 bg-fs-slate-dark border-t lg:border-t-0 lg:border-l border-fs-slate-light p-6 lg:p-10 flex items-start justify-center lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] overflow-y-auto">
          <div className="w-full max-w-sm">
            <p className="text-fs-gray-3 font-fs text-xs uppercase tracking-widest mb-4 text-center">
              Live Preview
            </p>
            <ModalPreview
              headline={form.headline}
              description={form.description}
              ctaButtonText={form.ctaButtonText}
              imageSrc={previewImageSrc}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalPreview({
  headline,
  description,
  ctaButtonText,
  imageSrc,
}: {
  headline: string;
  description: string;
  ctaButtonText: string;
  imageSrc: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Banner — 3:2 */}
      <div className="relative w-full" style={{ paddingBottom: "66.67%" }}>
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt="Banner preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-fs-chalk flex flex-col items-center justify-center gap-2">
            <svg
              className="w-10 h-10 text-fs-gray-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3h18M3 21h18"
              />
            </svg>
            <span className="text-fs-gray-2 text-xs font-fs">1500 × 1000 px</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h2
          className="font-flash font-bold leading-tight mb-2"
          style={{ fontSize: "22px", color: "#001E28" }}
        >
          {headline || <span style={{ color: "#C8CDCD" }}>Headline text</span>}
        </h2>
        <p
          className="font-fs leading-relaxed mb-5"
          style={{ fontSize: "15px", color: "#555E61" }}
        >
          {description || (
            <span style={{ color: "#C8CDCD" }}>Description text will appear here…</span>
          )}
        </p>

        <div className="flex items-center justify-between gap-3">
          <button type="button" className="font-fs text-sm" style={{ color: "#999999" }}>
            Close
          </button>
          <button
            type="button"
            className="font-flash font-bold uppercase tracking-wider text-sm px-5 py-2.5 rounded-lg text-white"
            style={{ backgroundColor: "#001E28" }}
          >
            {ctaButtonText || <span style={{ color: "#C8CDCD" }}>CTA Button</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
