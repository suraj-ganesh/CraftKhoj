"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function CategoryForm({ existing }: { existing: { id: number; name: string; info: string; image: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast.error(data.error ?? "Could not create category."); return; }
    toast.success(`Category "${name}" created.`);
    setName(""); setDesc("");
    router.refresh();
  }

  async function remove(id: number, name: string) {
    const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? `Could not remove "${name}".`); return; }
    toast.success(`Category "${name}" removed.`);
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: ".8fr 1.2fr", alignItems: "start" }}>
      <div className="dashboard-panel" style={{ background: "var(--sky)" }}>
        <div className="panel-head"><h2>New craft category</h2></div>
        <form onSubmit={create}>
          <div className="form-field" style={{ marginTop: 14 }}>
            <label htmlFor="cat-name">Name</label>
            <input id="cat-name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Papier-mâché" />
          </div>
          <div className="form-field" style={{ marginTop: 12 }}>
            <label htmlFor="cat-desc">One-line description</label>
            <input id="cat-desc" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          <button className="brutal-button brutal-button-dark full-width" style={{ marginTop: 16 }} disabled={busy} type="submit">
            <Plus size={15} /> Add category
          </button>
        </form>
      </div>

      <div className="dashboard-panel">
        <div className="panel-head"><h2>Existing categories</h2><span>{existing.length} total</span></div>
        <div className="queue-list" style={{ marginTop: 14 }}>
          {existing.map((c) => (
            <div className="queue-item" key={c.id}>
              {c.image && <img className="queue-thumb" src={c.image} alt="" />}
              <div>
                <strong style={{ font: "700 14px 'Space Grotesk'" }}>{c.name}</strong>
                <span>{c.info}</span>
              </div>
              <button className="mini-action" style={{ marginLeft: "auto", color: "#c14e3d" }} onClick={() => remove(c.id, c.name)}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
