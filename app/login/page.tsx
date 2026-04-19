"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-fs-slate flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="text-center mb-8">
          <h1 className="font-flash font-bold text-3xl text-white tracking-tight">
            FLASH<span className="text-fs-red">SCORE</span>
          </h1>
          <p className="text-fs-gray-2 text-sm mt-2 font-fs">
            In-App Message Booking
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-fs-slate-light rounded-2xl p-8 shadow-xl"
        >
          <label className="block text-fs-chalk text-sm font-fs mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter access password"
            required
            className="w-full bg-fs-slate border border-fs-gray-3 rounded-lg px-4 py-3 text-white font-fs placeholder-fs-gray-3 focus:outline-none focus:border-fs-red transition-colors"
          />

          {error && (
            <p className="text-fs-red text-sm mt-2 font-fs">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-fs-red text-white font-flash font-bold uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
