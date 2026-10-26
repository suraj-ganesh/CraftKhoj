import Link from "next/link";
import { SectionKicker } from "@/components/craft";

export default function ForbiddenPage() {
  return (
    <section className="page-intro">
      <div className="page-intro-inner">
        <SectionKicker number="403">Access denied</SectionKicker>
        <h1>This area belongs to another role.</h1>
        <p>Your account does not have permission to open this workspace area. Each of the four platform roles — buyer, artisan, verifier, administrator — has its own secured dashboard.</p>
        <div className="hero-actions" style={{ marginTop: 26 }}>
          <Link className="brutal-button brutal-button-blue" href="/">Back to the marketplace</Link>
        </div>
      </div>
    </section>
  );
}
