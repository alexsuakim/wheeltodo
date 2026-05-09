"use client";

import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { SignUpForm } from "./SignUpForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { VerifyEmailScreen } from "./VerifyEmailScreen";

type View = "login" | "signup" | "forgot" | "verify";

interface AuthPageProps {
  onAuthenticated: () => void;
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [view, setView] = useState<View>("login");
  const [verifyEmail, setVerifyEmail] = useState("");

  return (
    <div className="min-h-screen bg-[#f2f0eb] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 bg-white rounded-2xl border border-[#E8E5E0] flex items-center justify-center shadow-sm">
            <span className="text-3xl text-[#111111]">◎</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#111111]">Wheel Todo</h1>
            <p className="text-sm text-[#aaaaaa] mt-0.5">Spin. Focus. Done.</p>
          </div>
        </div>

        {view === "login" && (
          <LoginForm
            onAuthenticated={onAuthenticated}
            onSignUp={() => setView("signup")}
            onForgotPassword={() => setView("forgot")}
          />
        )}
        {view === "signup" && (
          <SignUpForm
            onVerify={(email) => { setVerifyEmail(email); setView("verify"); }}
            onLogin={() => setView("login")}
          />
        )}
        {view === "forgot" && (
          <ForgotPasswordForm onBack={() => setView("login")} />
        )}
        {view === "verify" && (
          <VerifyEmailScreen email={verifyEmail} onBack={() => setView("login")} />
        )}
      </div>
    </div>
  );
}
