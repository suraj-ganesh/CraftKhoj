"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserActions({ userId, userStatus, isSelf }: { userId: number; userStatus: string; isSelf: boolean }) {
  const router = useRouter();

  async function patch(data: Record<string, unknown>) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId, ...data }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Update failed."); return; }
    toast.success("User updated.");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {userStatus !== "ACTIVE"
        ? <button className="mini-action" onClick={() => patch({ status: "ACTIVE" })}>Reinstate</button>
        : !isSelf && <button className="mini-action" style={{ color: "#c14e3d" }} onClick={() => patch({ status: "DEACTIVATED" })}>Deactivate</button>}
      {isSelf
        ? <span style={{ color: "var(--sage)", fontSize: 10 }}>you — no demotion</span>
        : (
          <select
            defaultValue=""
            style={{ font: "500 10px 'DM Sans'", border: "1.5px solid var(--forest)", padding: "3px 6px", background: "var(--paper)" }}
            onChange={(e) => e.target.value && patch({ role: e.target.value })}
          >
            <option value="" disabled>Change role…</option>
            {["BUYER", "ARTISAN", "VERIFIER", "ADMIN"].map((r) => <option key={r} value={r}>{r.toLowerCase()}</option>)}
          </select>
        )}
    </div>
  );
}
