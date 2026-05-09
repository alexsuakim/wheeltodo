"use client";

import { useState } from "react";
import { getSupabaseClient } from "@todo/shared";

interface SignUpFormProps {
  onVerify: (email: string) => void;
  onLogin: () => void;
}

export function SignUpForm({ onVerify, onLogin }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        onVerify(email.trim());
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-xl font-bold text-[#111111] mb-1">Create account</h2>

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
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        className="w-full bg-white border border-[#E8E5E0] rounded-xl px-4 py-3.5 text-[#111111] text-base placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition"
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        autoComplete="new-password"
        className="w-full bg-white border border-[#E8E5E0] rounded-xl px-4 py-3.5 text-[#111111] text-base placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#111111] text-white font-semibold text-base rounded-full py-3.5 hover:bg-[#333333] active:scale-[0.98] transition disabled:opacity-50"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-[#aaaaaa] mt-1">
        Already have an account?{" "}
        <button type="button" onClick={onLogin} className="text-[#111111] font-semibold hover:underline">
          Sign in
        </button>
      </p>
    </form>
  );
}
