import { ShieldCheck as ShieldCheckInline } from "lucide-react";
import { ProvenanceLookup } from "@/components/ProvenanceLookup";
import { SectionKicker } from "@/components/craft";

export default async function ProvenancePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;

  return (
    <>
      <section className="page-intro">
        <div className="page-intro-inner">
          <SectionKicker number="03">Verify a record</SectionKicker>
          <h1>The public provenance registry.</h1>
          <p>Approved products carry a unique Craft Provenance ID. Look it up here to see its verified maker, origin, materials, method, and full timestamped trail.</p>
        </div>
      </section>
      <section className="provenance-page">
        <div className="provenance-search-panel">
          <p>Every record is issued only after a verifier reviews the artisan's evidence: workshop location, materials, production method, date, and process photos.</p>
          <div className="provenance-example">
            <span>Example format</span>
            <strong>CK-PA-2024-00418</strong>
          </div>
          <div style={{ fontSize: 11, color: "var(--sage)", display: "flex", gap: 6, alignItems: "center", marginTop: 18 }}>
            <ShieldCheckInline size={14} /> Search is public. Buyers trust what they can check.
          </div>
        </div>
        <div>
          <ProvenanceLookup initialId={id ?? ""} />
        </div>
      </section>
    </>
  );
}
