"use client";

import { useState } from "react";

type RevealedCredential = {
  username: string;
  password: string;
  domain: string;
  podName: string;
};

export function CredentialReveal({
  enabled,
  username,
  unavailableReason,
}: {
  enabled: boolean;
  username: string;
  unavailableReason: string;
}) {
  const [credential, setCredential] = useState<RevealedCredential | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function revealCredential() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/lab-credentials/reveal", {
        method: "POST",
        cache: "no-store",
      });
      const body = (await response.json()) as RevealedCredential & {
        error?: string;
      };

      if (!response.ok) {
        setError(body.error ?? "Credential could not be revealed.");
        return;
      }

      setCredential(body);
    } catch {
      setError("Credential could not be revealed.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword() {
    if (credential) {
      await navigator.clipboard.writeText(credential.password);
    }
  }

  if (credential) {
    return (
      <div className="mt-4 grid gap-3">
        <div className="rounded-md border bg-background p-4 text-sm">
          <p className="text-muted-foreground">Username</p>
          <p className="mt-1 font-mono font-medium">{credential.username}</p>
          <p className="mt-3 text-muted-foreground">Password</p>
          <p className="mt-1 break-all font-mono font-medium">{credential.password}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            onClick={copyPassword}
            type="button"
          >
            Copy password
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
            onClick={() => setCredential(null)}
            type="button"
          >
            Hide credential
          </button>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Do not email, save, or share this credential. Guacamole uses the same assigned identity to open the Windows session.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">
        {enabled
          ? `${username} is ready for a controlled reveal.`
          : unavailableReason}
      </p>
      <button
        className="mt-4 inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!enabled || loading}
        onClick={revealCredential}
        type="button"
      >
        {loading ? "Revealing…" : "Reveal lab credential"}
      </button>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
