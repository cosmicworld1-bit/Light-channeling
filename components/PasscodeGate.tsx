"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

export default function PasscodeGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "locked" | "unlocked">("checking");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => res.json())
      .then((data) => setStatus(data.ok ? "unlocked" : "locked"))
      .catch(() => setStatus("locked"));
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        setStatus("unlocked");
      } else {
        setError("Incorrect passcode");
      }
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "checking") {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">
        Checking access…
      </div>
    );
  }

  if (status === "locked") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
          <h1 className="text-center text-lg font-semibold">Light Channeling Assistant</h1>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            placeholder="Enter passcode"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-center text-lg tracking-widest focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting || passcode.length === 0}
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {submitting ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
