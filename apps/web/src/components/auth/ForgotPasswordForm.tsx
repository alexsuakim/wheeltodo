"use client";

import { useState } from "react";
import { getSupabaseClient } from "@todo/shared";
import { ArrowLeft } from "lucide-react";

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      });
      if (authError) {
        setError(authError.message);
      } else {
        setSent(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <span className="text-2xl">📬</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#111111]">Check your inbox</h2>
          <p className="text-sm text-[#aaaaaa] mt-1">
            We sent a password reset link to <strong className="text-[#111111]">{email}</strong>.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[#111111] font-semibold hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[#aaaaaa] hover:text-[#111111] transition-colors self-start mb-1"
      >
        <ArrowLeft size={14} strokeWidth={2} />
        Back
      </button>

      <h2 className="text-xl font-bold text-[#111111]">Reset password</h2>
      <p className="text-sm text-[#aaaaaa]">Enter your email and we'll send you a reset link.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        className="w-full bg-white border border-[#E8E5E0] rounded-xl px-4 py-3.5 text-[#111111] text-base placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#111111] text-white font-semibold text-base rounded-full py-3.5 hover:bg-[#333333] active:scale-[0.98] transition disabled:opacity-50"
      >
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
