import Link from "next/link";
import { SectionKicker } from "@/components/craft";

export default function NotFound() {
  return (
    <section className="page-intro">
      <div className="page-intro-inner">
        <SectionKicker number="404">Record not found</SectionKicker>
        <h1>No page or record lives here.</h1>
        <p>The piece, artisan, or provenance record you tried to open does not exist — or it may still be awaiting verification.</p>
        <div className="hero-actions" style={{ marginTop: 26 }}>
          <Link className="brutal-button brutal-button-blue" href="/shop">Browse the collection</Link>
          <Link className="brutal-button" href="/provenance">Verify a record</Link>
        </div>
      </div>
    </section>
  );
}
