"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import type { BookingData } from "@/lib/types";
import type { Booking } from "@/app/api/bookings/route";
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
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((data) => setAllBookings(data))
      .catch(() => {});
  }, []);

  function set<K extends keyof BookingData>(key: K, value: BookingData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImageSrc(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingImage(true);
    try {
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
    } catch {
      setErrors((prev) => ({ ...prev, imageUrl: "Upload failed. Please try again." }));
      setPreviewImageSrc("");
      set("imageUrl", "");
    } finally {
      setUploadingImage(false);
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof BookingData, string>> = {};
    if (!form.terminFrom) newErrors.terminFrom = "Required";
    if (!form.terminTo) newErrors.terminTo = "Required";
    if (!form.bookie) newErrors.bookie = "Required";
    if (!form.projectCountry) newErrors.projectCountry = "Required";
    if (!form.usecase) newErrors.usecase = "Required";
    if (!form.iosLink) newErrors.iosLink = "Required";
    if (!form.andLink) newErrors.andLink = "Required";
    if (form.headline.length > 50) newErrors.headline = "Max 50 characters";
    if (form.description.length > 250) newErrors.description = "Max 250 characters";
    if (form.ctaButtonText.length > 20) newErrors.ctaButtonText = "Max 20 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setFormState("loading");
    setErrorMessage("");

    try {
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
    } catch {
      setErrorMessage("Network error. Please try again.");
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

  const conflicts: Booking[] =
    form.terminFrom && form.terminTo && form.projectCountry
      ? allBookings.filter(
          (b) =>
            b.country.trim().toLowerCase() === form.projectCountry.trim().toLowerCase() &&
            b.from <= form.terminTo &&
            b.to >= form.terminFrom
        )
      : [];

  const inputBase =
    "w-full bg-fs-input border rounded-lg px-3.5 py-2.5 text-white font-fs text-sm placeholder-fs-gray-2/60 focus:outline-none transition-colors appearance-none";
  const inputOk = "border-white/15 focus:border-white/40";
  const inputErr = "border-fs-red focus:border-fs-red";
  const inputClass = (field: keyof BookingData) =>
    `${inputBase} ${errors[field] ? inputErr : inputOk}`;
  const labelClass = "block text-white text-sm font-fs font-medium mb-1.5";
  const card = "bg-fs-slate-light rounded-xl p-5 space-y-4";
  const cardTitle = "text-fs-gray-2 text-xs font-fs uppercase tracking-widest pb-1";

  if (formState === "success") {
    return (
      <div className="min-h-screen bg-fs-slate flex items-center justify-center px-4">
        <div className="bg-fs-slate-light rounded-2xl p-10 max-w-md w-full text-center shadow-xl">
          <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-flash font-bold text-2xl text-white mb-2">Campaign Booked!</h2>
          <p className="text-fs-gray-2 font-fs text-sm mb-8">
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
      <header className="bg-fs-slate-dark border-b border-white/8 px-6 py-4 sticky top-0 z-10">
        <h1 className="font-flash font-bold text-xl text-white tracking-tight">
          FLASH<span className="text-fs-red">SCORE</span>
          <span className="text-fs-gray-2 font-fs font-normal text-base ml-3 tracking-normal">
            In-App Message Booking
          </span>
        </h1>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">

        {/* ── Left: Form ── */}
        <div className="lg:w-1/2 overflow-y-auto p-5 lg:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-3 max-w-xl mx-auto">

            {/* Campaign */}
            <div className={card}>
              <p className={cardTitle}>Campaign</p>

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

            {/* Conflict check */}
            {form.terminFrom && form.terminTo && form.projectCountry && (
              <div className={`rounded-lg px-4 py-3 text-xs font-fs ${
                conflicts.length > 0
                  ? "bg-amber-400/10 border border-amber-400/40"
                  : "bg-green-500/10 border border-green-500/30"
              }`}>
                {conflicts.length === 0 ? (
                  <span className="text-green-400">✓ No conflicts for {form.projectCountry} in this period</span>
                ) : (
                  <>
                    <p className="text-amber-400 font-medium mb-2">
                      ⚠ {conflicts.length} existing booking{conflicts.length > 1 ? "s" : ""} in {form.projectCountry}:
                    </p>
                    <div className="space-y-1">
                      {conflicts.map((b, i) => (
                        <div key={i} className="flex items-center gap-3 text-amber-200/80">
                          <span className="font-medium text-white/90">{b.bookie || "—"}</span>
                          <span>{b.from} – {b.to}</span>
                          <span className="text-white/40">{b.status}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Bookie *</label>
                  <input
                    type="text"
                    value={form.bookie}
                    onChange={(e) => set("bookie", e.target.value)}
                    placeholder="e.g. Bet365"
                    className={inputClass("bookie")}
                  />
                  {errors.bookie && <p className="text-fs-red text-xs font-fs mt-1">{errors.bookie}</p>}
                </div>
                <div>
                  <label className={labelClass}>Project / Country *</label>
                  <input
                    type="text"
                    value={form.projectCountry}
                    onChange={(e) => set("projectCountry", e.target.value)}
                    placeholder="e.g. CZ, PL, GB"
                    className={inputClass("projectCountry")}
                  />
                  {errors.projectCountry && <p className="text-fs-red text-xs font-fs mt-1">{errors.projectCountry}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-end">
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
                <div className="flex items-center gap-3 pb-2.5">
                  <input
                    id="worldCup"
                    type="checkbox"
                    checked={form.worldCup2026}
                    onChange={(e) => set("worldCup2026", e.target.checked)}
                    className="w-4.5 h-4.5 accent-fs-red cursor-pointer flex-shrink-0"
                  />
                  <label htmlFor="worldCup" className="text-fs-chalk font-fs text-sm cursor-pointer select-none leading-snug">
                    World Cup 2026
                  </label>
                </div>
              </div>
            </div>

            {/* Creative */}
            <div className={card}>
              <p className={cardTitle}>Creative</p>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label className={labelClass.replace("mb-1.5", "")}>Headline</label>
                  <span className={`text-xs font-fs tabular-nums ${form.headline.length > 45 ? "text-amber-400" : "text-fs-gray-2"}`}>
                    {form.headline.length}/50
                  </span>
                </div>
                <input
                  type="text"
                  value={form.headline}
                  onChange={(e) => set("headline", e.target.value)}
                  placeholder="Bold title shown in the modal"
                  maxLength={50}
                  className={inputClass("headline")}
                />
                {errors.headline && <p className="text-fs-red text-xs font-fs mt-1">{errors.headline}</p>}
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label className={labelClass.replace("mb-1.5", "")}>Description</label>
                  <span className={`text-xs font-fs tabular-nums ${form.description.length > 225 ? "text-amber-400" : "text-fs-gray-2"}`}>
                    {form.description.length}/250
                  </span>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Body text shown below the headline"
                  rows={3}
                  maxLength={250}
                  className={`${inputClass("description")} resize-none`}
                />
                {errors.description && <p className="text-fs-red text-xs font-fs mt-1">{errors.description}</p>}
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label className={labelClass.replace("mb-1.5", "")}>CTA Button Text</label>
                  <span className={`text-xs font-fs tabular-nums ${form.ctaButtonText.length >= 20 ? "text-fs-red" : "text-fs-gray-2"}`}>
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
                {errors.ctaButtonText && <p className="text-fs-red text-xs font-fs mt-1">{errors.ctaButtonText}</p>}
              </div>

              <div>
                <label className={labelClass}>Banner Image</label>
                <p className="text-fs-gray-2 text-xs font-fs mb-2">JPG or PNG · max 10 MB · 1500 × 1000 px recommended (3:2)</p>
                <label
                  htmlFor="bannerImage"
                  className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg px-4 py-5 cursor-pointer transition-colors ${
                    errors.imageUrl ? "border-fs-red" : "border-white/20 hover:border-white/40"
                  }`}
                >
                  {uploadingImage ? (
                    <span className="text-fs-gray-2 font-fs text-sm flex items-center gap-2"><Spinner /> Uploading…</span>
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
                {errors.imageUrl && <p className="text-fs-red text-xs font-fs mt-1">{errors.imageUrl}</p>}
              </div>
            </div>

            {/* Tracking & Links */}
            <div className={card}>
              <p className={cardTitle}>Tracking & Links</p>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>iOS Link *</label>
                  <input
                    type="url"
                    value={form.iosLink}
                    onChange={(e) => set("iosLink", e.target.value)}
                    placeholder="https://"
                    className={inputClass("iosLink")}
                  />
                  {errors.iosLink && <p className="text-fs-red text-xs font-fs mt-1">{errors.iosLink}</p>}
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
                  {errors.andLink && <p className="text-fs-red text-xs font-fs mt-1">{errors.andLink}</p>}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className={card}>
              <p className={cardTitle}>Notes</p>
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any additional notes or instructions…"
                rows={3}
                className={`${inputClass("notes")} resize-none`}
              />
            </div>

            {formState === "error" && (
              <div className="bg-fs-red/10 border border-fs-red/50 rounded-lg px-4 py-3 text-fs-red font-fs text-sm">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={formState === "loading" || uploadingImage}
              className="w-full bg-fs-red text-white font-flash font-bold uppercase tracking-wider py-3.5 rounded-xl text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {formState === "loading" ? <><Spinner /> Submitting…</> : "Book Campaign"}
            </button>
          </form>
        </div>

        {/* ── Right: Live Preview ── */}
        <div className="lg:w-1/2 bg-fs-slate-dark border-t lg:border-t-0 lg:border-l border-white/8 p-6 lg:p-10 flex items-start justify-center lg:sticky lg:top-[65px] lg:h-[calc(100vh-65px)] overflow-y-auto">
          <div className="w-full max-w-sm">
            <p className="text-fs-gray-2 font-fs text-xs uppercase tracking-widest mb-4 text-center">
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
      <div className="relative w-full" style={{ paddingBottom: "66.67%" }}>
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt="Banner preview" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-fs-chalk flex flex-col items-center justify-center gap-2">
            <svg className="w-10 h-10 text-fs-gray-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3h18M3 21h18" />
            </svg>
            <span className="text-fs-gray-2 text-xs font-fs">1500 × 1000 px</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h2 className="font-flash font-bold leading-tight mb-2" style={{ fontSize: "22px", color: "#001E28" }}>
          {headline || <span style={{ color: "#C8CDCD" }}>Headline text</span>}
        </h2>
        <p className="font-fs leading-relaxed mb-5" style={{ fontSize: "15px", color: "#555E61" }}>
          {description || <span style={{ color: "#C8CDCD" }}>Description text will appear here…</span>}
        </p>
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="font-fs text-sm" style={{ color: "#999999" }}>Close</button>
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
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
