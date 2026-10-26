"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";

export function ReviewForm({ productId, productTitle, productPrice, image }: { productId: number; productTitle: string; productPrice: string; image: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, rating, title, comment }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { toast.error(data.error ?? "Could not submit review."); return; }
    toast.success("Review published — it now counts toward the maker's trust score.");
    router.push("/buyer/orders");
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: 20, gridTemplateColumns: ".9fr 1.1fr", alignItems: "start" }}>
      <div className="dashboard-panel" style={{ background: "var(--sky)" }}>
        {image && <img src={image} alt="" style={{ width: "100%", borderBottom: "3px solid var(--forest)", maxHeight: 220, objectFit: "cover" }} />}
        <div style={{ padding: 18 }}>
          <span className="eyebrow">Reviewing</span>
          <h2 style={{ marginTop: 6 }}>{productTitle}</h2>
          <p style={{ fontSize: 12, color: "var(--sage)", marginTop: 8 }}>
            Honest reviews keep the marketplace healthy. Ratings feed directly into artisan trust scores (weight 0.25 of the composite).
          </p>
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="panel-head"><h2>Your review</h2></div>
        <form onSubmit={submit}>
          <div style={{ margin: "18px 0 4px" }}>
            <label className="eyebrow" style={{ display: "block", marginBottom: 8 }}>Rating</label>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <Star size={28} fill={n <= rating ? "#f5b301" : "none"} color={n <= rating ? "#f5b301" : "var(--sage)"} />
                </button>
              ))}
              <strong style={{ alignSelf: "center", marginLeft: 8, font: "700 15px 'Space Grotesk'" }}>{rating}/5</strong>
            </div>
          </div>
          <div className="form-field" style={{ marginTop: 14 }}>
            <label htmlFor="title">Headline (optional)</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sum it up in a few words" />
          </div>
          <div className="form-field" style={{ marginTop: 14 }}>
            <label htmlFor="comment">Your experience</label>
            <textarea id="comment" required minLength={5} rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Quality, delivery, packaging, how the piece sits in your home…" />
          </div>
          <button className="brutal-button brutal-button-dark full-width" style={{ marginTop: 18 }} disabled={busy} type="submit">
            Publish review
          </button>
          <small style={{ color: "var(--sage)", display: "block", fontSize: 10, marginTop: 8 }}>
            For {productTitle} ({formatPrice(productPrice)}). Only buyers with a paid order can review — verified at the API.
          </small>
        </form>
      </div>
    </div>
  );
}
