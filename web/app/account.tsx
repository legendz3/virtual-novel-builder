"use client";

import { useCallback, useEffect, useState } from "react";

type ChatgptAccount = {
  state: "disconnected" | "connecting" | "connected" | "error";
  email?: string;
  plan?: string;
  models?: string[];
  user_code?: string;
  verification_uri?: string;
  message?: string;
};

// ChatGPT (Codex) device-code sign-in. Once connected, agent model and image calls run on the ChatGPT plan.
export function AccountPanel() {
  const [account, setAccount] = useState<ChatgptAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (refresh = false) => {
    const res = await fetch(`/api/backend/account/chatgpt${refresh ? "?refresh=1" : ""}`);
    if (res.ok) setAccount(await res.json());
  }, []);
  const act = async (action: "connect" | "cancel" | "disconnect") => {
    setBusy(true);
    try {
      const res = await fetch(`/api/backend/account/chatgpt/${action}`, { method: "POST" });
      setAccount(await res.json());
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (account?.state !== "connecting") return;
    const timer = setInterval(() => void load(), 2000);
    return () => clearInterval(timer);
  }, [account?.state, load]);

  const state = account?.state ?? "disconnected";
  return (
    <section className="account" aria-live="polite">
      <h2>ChatGPT account</h2>
      {state === "connected" && (
        <>
          <p>
            {account?.email ?? "Signed in"}
            {account?.plan ? ` · ${account.plan}` : ""}
          </p>
          <p className="muted">Agents run on this ChatGPT plan · {account?.models?.length ?? 0} models</p>
          <div className="row">
            <button onClick={() => void load(true)} disabled={busy}>Refresh</button>
            <button onClick={() => void act("disconnect")} disabled={busy}>Disconnect</button>
          </div>
        </>
      )}
      {state === "connecting" && (
        <>
          <p className="muted">Open the OpenAI device page, sign in, and enter this code:</p>
          <p className="code" aria-label="Device code">{account?.user_code}</p>
          <div className="row">
            {account?.verification_uri && (
              <a className="button primary" href={account.verification_uri} target="_blank" rel="noopener noreferrer">
                Open device page
              </a>
            )}
            <button onClick={() => void act("cancel")} disabled={busy}>Cancel</button>
          </div>
        </>
      )}
      {(state === "disconnected" || state === "error") && (
        <>
          {state === "error" && <p className="error">{account?.message}</p>}
          <p className="muted">Not connected: agents use the server&apos;s OpenAI API key.</p>
          <button className="primary" onClick={() => void act("connect")} disabled={busy}>Connect ChatGPT</button>
        </>
      )}
    </section>
  );
}

