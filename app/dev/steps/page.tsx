"use client";

import { useState } from "react";

export default function DevStepsPage() {
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState<string>("");

  async function createToken() {
    setErr("");
    setRes(null);
    try {
      const r = await fetch("/api/dev/create-steps-token", { method: "POST" });
      const j = await r.json();
      setRes(j);
    } catch (e: any) {
      setErr(e?.message || "error");
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Dev: Steps token</h1>
      <button onClick={createToken} style={{ padding: 12, border: "1px solid #ccc" }}>
        Crear token para Atajos
      </button>

      {err && <pre style={{ marginTop: 16, color: "crimson" }}>{err}</pre>}
      {res && <pre style={{ marginTop: 16 }}>{JSON.stringify(res, null, 2)}</pre>}
      <p style={{ marginTop: 16 }}>
        Copia el campo <b>token</b> y guárdalo.
      </p>
    </div>
  );
}
