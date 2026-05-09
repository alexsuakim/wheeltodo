"use client";

import { useState } from "react";
import { getSupabaseClient } from "@todo/shared";

interface LoginFormProps {
  onAuthenticated: () => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
}

export function LoginForm({ onAuthenticated, onSignUp, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        setError(authError.message);
      } else {
        onAuthenticated();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-xl font-bold text-[#111111] mb-1">Sign in</h2>

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
        autoComplete="current-password"
        className="w-full bg-white border border-[#E8E5E0] rounded-xl px-4 py-3.5 text-[#111111] text-base placeholder-[#aaaaaa] focus:outline-none focus:ring-2 focus:ring-[#111111]/20 transition"
      />

      <button
        type="button"
        onClick={onForgotPassword}
        className="text-sm text-[#aaaaaa] hover:text-[#111111] self-end transition-colors"
      >
        Forgot password?
      </button>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-13 bg-[#111111] text-white font-semibold text-base rounded-full py-3.5 hover:bg-[#333333] active:scale-[0.98] transition disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-[#aaaaaa] mt-1">
        No account?{" "}
        <button type="button" onClick={onSignUp} className="text-[#111111] font-semibold hover:underline">
          Sign up
        </button>
      </p>
    </form>
  );
}
