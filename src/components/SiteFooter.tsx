import Link from "next/link";
import { Logo } from "./Shell";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Logo />
          <p className="footer-intro">The more honest way to buy the handmade. A provenance-based marketplace for Nepali heritage crafts.</p>
        </div>
        <div className="footer-links">
          <div>
            <span className="eyebrow">Explore</span>
            <Link href="/shop">Browse crafts</Link>
            <Link href="/provenance">Verify a record</Link>
            <Link href="/artisans">Meet the makers</Link>
            <Link href="/login">Sign in / register</Link>
          </div>
          <div>
            <span className="eyebrow">For the community</span>
            <Link href="/studio">Artisan workspace</Link>
            <Link href="/verifier">Verifier queue</Link>
            <Link href="/admin">Admin dashboard</Link>
            <Link href="/shop">Order history</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2025 CraftKhoj / Made with respect for the maker.</span>
        <span>Authenticity · Visibility · Connection</span>
      </div>
    </footer>
  );
}
