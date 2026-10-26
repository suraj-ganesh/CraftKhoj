"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";

type RecordResult = {
  product: {
    id: number; title: string; provenanceId: string; price: string; origin: string | null;
    image: string; category: string; status: string;
    artisan: { id: number; user: { fullName: string }; district: string | null; craftSpecialty: string | null; portraitUrl: string | null };
    provenanceRecord: { verificationStatus: string; productionMethod: string | null; workshopLocation: string | null; verifiedAt: string | null; verifier: { fullName: string } | null } | null;
  } | null;
};

export function ProvenanceLookupStrip({ sampleId }: { sampleId: string | null }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<RecordResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  async function lookup(id = value) {
    const key = id.trim().toUpperCase();
    if (!key) { toast.error("Enter a Craft Provenance ID first."); return; }
    setBusy(true); setNotFound(false); setResult(null);
    const res = await fetch(`/api/provenance/verify/${encodeURIComponent(key)}`);
    setBusy(false);
    if (res.ok) setResult(await res.json());
    else setNotFound(true);
  }

  return (
    <div className="lookup-box">
      <label htmlFor="lookup-id-inline">Craft Provenance ID</label>
      <div className="lookup-form">
        <input
          id="lookup-id-inline"
          placeholder="CK-PA-2024-…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup()}
        />
        <button onClick={() => lookup()} disabled={busy}>Verify</button>
      </div>
      <div className="lookup-note"><LockKeyhole size={13} /> Public record — no sign-in needed.</div>
      {notFound && <p style={{ marginTop: 14, font: "700 13px 'DM Sans'" }}>No record found for that ID. Double-check the format.</p>}
      {result?.product && (
        <div style={{ marginTop: 16, borderTop: "3px solid var(--forest)", paddingTop: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {result.product.image && <img src={result.product.image} alt="" style={{ border: "2px solid var(--forest)", height: 54, objectFit: "cover", width: 54 }} />}
            <div>
              <strong style={{ font: "700 17px 'Space Grotesk'", display: "block" }}>{result.product.title}</strong>
              <span style={{ color: "var(--sage)", fontSize: 11 }}>By {result.product.artisan?.user?.fullName} · {result.product.artisan?.district}</span>
            </div>
          </div>
          {result.product.provenanceRecord?.verificationStatus === "APPROVED" ? (
            <div className="lookup-note" style={{ marginTop: 12 }}><span className="status-badge status-green"><span className="status-dot" /> Verified record</span></div>
          ) : (
            <div className="lookup-note" style={{ marginTop: 12 }}>Record exists but is not verified publicly.</div>
          )}
          <Link className="text-link" href={`/product/${result.product.id}`} style={{ marginTop: 12, marginBottom: 4 }}>View full record <span aria-hidden>→</span></Link>
        </div>
      )}
    </div>
  );
}

/* -- Full provenance lookup page component -- */
type FullResult = {
  product: {
    id: number; title: string; price: string; provenanceId: string; origin: string | null; description: string | null;
    image: string;
    category: { name: string };
    artisan: { id: number; user: { fullName: string }; district: string | null; craftSpecialty: string | null; portraitUrl: string | null };
    provenanceRecord: {
      verificationStatus: string; productionMethod: string | null; workshopLocation: string | null;
      productionDate: string | null; verifiedAt: string | null; verificationNote: string | null;
      verifier: { fullName: string } | null;
      events: { id: number; eventType: string; description: string | null; eventTime: string }[];
    } | null;
  } | null;
};

import { formatDate } from "@/lib/format";
import { Check, Factory } from "lucide-react";

export function ProvenanceLookup({ initialId }: { initialId?: string }) {
  const [searchId, setSearchId] = useState(initialId ?? "");
  const [result, setResult] = useState<FullResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ranOnce, setRanOnce] = useState(false);

  async function lookup(id = searchId) {
    const key = (id || initialId || "").trim().toUpperCase();
    if (!key) { toast.error("Enter a Craft Provenance ID first."); return; }
    setBusy(true); setNotFound(false); setResult(null); setRanOnce(true);
    const res = await fetch(`/api/provenance/verify/${encodeURIComponent(key)}`);
    setBusy(false);
    if (res.ok) setResult(await res.json());
    else { setNotFound(true); setResult(null); }
  }

  useEffect(() => {
    if (initialId) lookup(initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const p = result?.product;

  return (
    <div>
      <div className="record-card" style={{ marginBottom: ranOnce ? 24 : 0 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", marginBottom: 9 }}>Craft Provenance ID</label>
        <div className="lookup-form">
          <input placeholder="CK-PA-2024-00418" value={searchId} onChange={(e) => setSearchId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && lookup()} />
          <button onClick={() => lookup()} disabled={busy}>Look up</button>
        </div>
        {busy && <div className="lookup-note">Checking the registry�</div>}
        {notFound && <div className="lookup-note" style={{ marginTop: 12 }}><strong style={{ fontSize: 13 }}>No record found for that ID.</strong> Check the format: CK-XX-YYYY-NNNNN.</div>}
      </div>

      {p && (
        <>
          <div className="record-card">
            <div className="record-header">
              <div>
                <span className="lookup-note" style={{ margin: 0, color: "var(--sage)" }}>{p.category?.name}</span>
                <h2>{p.title}</h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <span className="record-id">{p.provenanceId}</span>
                <div style={{ marginTop: 10 }}>
                  {p.provenanceRecord?.verificationStatus === "APPROVED" ? (
                    <span className="status-badge status-green"><span className="status-dot" /> Verified</span>
                  ) : (
                    <span className="status-badge status-orange"><span className="status-dot" /> {p.provenanceRecord?.verificationStatus ?? "Unverified"}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="record-owner">
              {p.artisan.portraitUrl
                ? <img src={p.artisan.portraitUrl} alt="" />
                : <span style={{ alignItems: "center", background: "var(--sky)", border: "2px solid var(--forest)", display: "flex", font: "700 13px 'Space Grotesk'", height: 54, justifyContent: "center", width: 54 }}>{p.artisan.user.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>}
              <div>
                <strong>{p.artisan.user.fullName}</strong>
                <span>{p.artisan.craftSpecialty} � {p.artisan.district}</span>
              </div>
              <a className="text-link" href={`/artisan/${p.artisan.id}`} style={{ marginLeft: "auto", fontSize: 11 }}>Visit profile ?</a>
            </div>

            <div className="record-facts">
              <div className="record-fact"><span>Workshop location</span><strong>{p.provenanceRecord?.workshopLocation ?? "�"}</strong></div>
              <div className="record-fact"><span>Materials & method</span><strong>{p.provenanceRecord?.productionMethod ?? "�"}</strong></div>
              <div className="record-fact"><span>Production date</span><strong>{formatDate(p.provenanceRecord?.productionDate ?? null)}</strong></div>
              <div className="record-fact"><span>Verified by</span><strong>{p.provenanceRecord?.verifier?.fullName ?? "�"}{p.provenanceRecord?.verifiedAt ? ` � ${formatDate(p.provenanceRecord.verifiedAt)}` : ""}</strong></div>
            </div>
            {p.provenanceRecord?.verificationNote && (
              <div className="danger-note" style={{ marginTop: 6 }}>
                <strong>Verifier remarks:</strong> {p.provenanceRecord.verificationNote}
              </div>
            )}
          </div>

          <div className="record-card" style={{ marginTop: 24 }}>
            <span className="eyebrow">Timestamped trail</span>
            <div className="timeline" style={{ marginTop: 22 }}>
              {p.provenanceRecord?.events?.map((e) => (
                <div className="timeline-item" key={e.id}>
                  <time>{formatDate(e.eventTime)}</time>
                  <h3>{e.eventType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
                  <p>{e.description ?? ""}</p>
                </div>
              ))}
            </div>
            <a className="text-link" href={`/product/${p.id}`} style={{ marginTop: 30 }}>View the product page ?</a>
          </div>
        </>
      )}
    </div>
  );
}
