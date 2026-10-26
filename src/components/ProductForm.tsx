"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Save } from "lucide-react";

export type ProductFormInitial = {
  id?: number;
  title: string; description: string; price: string; stock: string; categoryId: string;
  origin: string; tags: string; image: string; materials: string;
  productionDate: string; productionMethod: string; processNotes: string; processImageUrl: string;
};

export function emptyProductInitial(): ProductFormInitial {
  return { title: "", description: "", price: "", stock: "1", categoryId: "", origin: "", tags: "", image: "", materials: "", productionDate: "", productionMethod: "", processNotes: "", processImageUrl: "" };
}

async function uploadFile(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) { toast.error(data.error ?? "Upload failed."); return null; }
  return data.url as string;
}

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="form-field">
      <label>{label}</label>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/uploads/… or https://" />
        <label className="mini-action" style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
          {busy ? "Uploading…" : "Upload file"}
          <input type="file" accept="image/*" style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              const url = await uploadFile(file);
              setBusy(false);
              if (url) onChange(url);
            }} />
        </label>
      </div>
      {value && <img src={value} alt="" style={{ marginTop: 8, height: 90, border: "2px solid var(--forest)" }} />}
    </div>
  );
}

export function ProductForm({
  categories, initial, mode,
}: { categories: { id: number; name: string }[]; initial: ProductFormInitial; mode: "create" | "edit" }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof ProductFormInitial) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      categoryId: Number(form.categoryId),
      origin: form.origin,
      tags: form.tags,
      image: form.image || undefined,
      materials: form.materials.split(",").map((m) => m.trim()).filter(Boolean),
      productionDate: form.productionDate || undefined,
      productionMethod: form.productionMethod,
      processNotes: form.processNotes,
      processImageUrl: form.processImageUrl || undefined,
    };
    const res = await fetch(mode === "create" ? "/api/products" : `/api/products/${initial.id}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast.error(data.error ?? "Could not save the product."); return; }
    toast.success(mode === "create" ? "Product submitted — it enters verification as PENDING." : "Saved. Provenance edits re-enter verification.");
    router.push(mode === "create" ? "/studio/products" : `/studio/products/${initial.id}/edit`);
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="dashboard-panel">
        <div className="panel-head"><h2>The piece</h2></div>
        <div className="form-grid" style={{ marginTop: 0 }}>
          <div className="form-field full">
            <label>Title</label>
            <input required minLength={3} maxLength={200} value={form.title} onChange={set("title")} placeholder="e.g. Hand-woven Dhaka shawl, $45" />
          </div>
          <div className="form-field">
            <label>Price (USD)</label>
            <input required type="number" min="1" step="0.01" value={form.price} onChange={set("price")} />
          </div>
          <div className="form-field">
            <label>Stock</label>
            <input required type="number" min="0" value={form.stock} onChange={set("stock")} />
          </div>
          <div className="form-field">
            <label>Category</label>
            <select required value={form.categoryId} onChange={set("categoryId")}>
              <option value="">Choose a category…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Origin village / town</label>
            <input value={form.origin} onChange={set("origin")} placeholder="e.g. Palpa, Tansen" />
          </div>
          <div className="form-field">
            <label>Tags (comma-separated)</label>
            <input value={form.tags} onChange={set("tags")} placeholder="textile, gift, nonzero" />
          </div>
          <div className="form-field full">
            <label>Description</label>
            <textarea required rows={4} style={{ background: "var(--paper)", border: "2px solid var(--forest)", padding: "11px 12px", font: "500 13px 'DM Sans'" }} value={form.description} onChange={set("description")} placeholder="What it is, how it was made, the story behind it" />
          </div>
        </div>
      </div>

      <div className="dashboard-panel" style={{ background: "var(--sky)" }}>
        <div className="panel-head"><h2>Provenance evidence</h2><span className="status-badge status-blue"><span className="status-dot" />Verifier picks this up</span></div>
        <div className="form-grid" style={{ marginTop: 0 }}>
          <div className="form-field">
            <label>Production date</label>
            <input type="date" value={form.productionDate} onChange={set("productionDate")} />
          </div>
          <div className="form-field">
            <label>Production method</label>
            <input value={form.productionMethod} onChange={set("productionMethod")} placeholder="e.g. Backstrap loom, 6 days" />
          </div>
          <div className="form-field full">
            <label>Process notes</label>
            <textarea rows={3} style={{ background: "var(--paper)", border: "2px solid var(--forest)", padding: "11px 12px", font: "500 13px 'DM Sans'" }} value={form.processNotes} onChange={set("processNotes")} placeholder="Describe the steps, certification, or anything a verifier should know" />
          </div>
          <ImageField label="Primary product image" value={form.image} onChange={(v) => setForm({ ...form, image: v })} />
          <ImageField label="Process photo (workshop picture)" value={form.processImageUrl} onChange={(v) => setForm({ ...form, processImageUrl: v })} />
          <div className="form-field full">
            <label>Materials (comma-separated)</label>
            <input value={form.materials} onChange={set("materials")} placeholder="cotton thread, natural dye, bamboo" />
          </div>
        </div>
        <button className="brutal-button brutal-button-dark" style={{ marginTop: 20 }} disabled={busy} type="submit">
          <Save size={16} /> {mode === "create" ? "Submit for verification" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
