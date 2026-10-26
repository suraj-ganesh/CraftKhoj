"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function RecommendedGrid({ products }: { products: { id: number; title: string; image: string; category?: string; price: string; similarity?: number }[] }) {
  return (
    <div className="queue-list" style={{ margin: "14px 0 16px" }}>
      {products.map((p) => (
        <div className="queue-item" key={p.id}>
          {p.image && <img className="queue-thumb" src={p.image} alt="" />}
          <div>
            <strong style={{ font: "700 13px 'Space Grotesk'" }}>{p.title}</strong>
            <span>{p.category} · {p.price}</span>
          </div>
          <Link className="mini-action" href={`/product/${p.id}`} style={{ marginLeft: "auto" }}>View <ArrowRight size={13} /></Link>
        </div>
      ))}
    </div>
  );
}
