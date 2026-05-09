"use client";

interface VerifyEmailScreenProps {
  email: string;
  onBack: () => void;
}

export function VerifyEmailScreen({ email, onBack }: VerifyEmailScreenProps) {
  return (
    <div className="flex flex-col gap-4 text-center">
      <div className="w-14 h-14 bg-[#f7f6f3] rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">✉️</span>
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#111111]">Verify your email</h2>
        <p className="text-sm text-[#aaaaaa] mt-2 leading-relaxed">
          We sent a verification link to{" "}
          <strong className="text-[#111111]">{email}</strong>.
          <br />
          Check your inbox and click the link to activate your account.
        </p>
      </div>
      <div className="bg-[#f7f6f3] rounded-xl px-4 py-3 text-sm text-[#aaaaaa]">
        Didn't receive it? Check your spam folder or{" "}
        <button type="button" onClick={onBack} className="text-[#111111] font-semibold hover:underline">
          try again
        </button>
        .
      </div>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-[#aaaaaa] hover:text-[#111111] transition-colors"
      >
        Back to sign in
      </button>
    </div>
  );
}
