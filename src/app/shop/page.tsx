import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";
import { listProducts } from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { ProductCard, SectionKicker, SelectArrow } from "@/components/craft";

export const dynamic = "force-dynamic";

const sorts = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating", label: "Best rated" },
];

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const category = sp.category ?? "All crafts";
  const sort = sp.sort ?? "newest";

  const [products, categories] = await Promise.all([
    listProducts({ q, category, sort, status: "APPROVED" }),
    prisma.craftCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const tabs = ["All crafts", ...categories.map((c) => c.name)];
  const qs = (patch: Record<string, string>) => {
    const next = new URLSearchParams({ ...(q && { q }), category, sort, ...patch });
    for (const [k, v] of [...next.entries()]) if (!v || v === "All crafts" || (k === "sort" && v === "newest")) next.delete(k);
    const s = next.toString();
    return s ? `/shop?${s}` : "/shop";
  };

  return (
    <>
      <section className="page-intro">
        <div className="page-intro-inner">
          <SectionKicker number="01">Shop the collection</SectionKicker>
          <h1>Every piece, every maker, every record.</h1>
          <p>Search the catalog, filter by craft category, and sort by price or rating. Verified pieces carry their Craft Provenance ID.</p>
        </div>
      </section>
      <section className="page-content">
        <form className="catalog-toolbar" action="/shop" method="get">
          <input className="search-input" type="search" name="q" defaultValue={q} placeholder="Search crafts, makers, origins…" />
          {category !== "All crafts" && <input type="hidden" name="category" value={category} />}
          {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
          <div className="catalog-tools">
            <button className="brutal-button brutal-button-dark" type="submit" style={{ minHeight: 42 }}><Search size={15} /> Search</button>
            <div className="select-wrap">
              <select name="sort" defaultValue={sort}>
                {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <SelectArrow />
            </div>
          </div>
        </form>

        <div className="category-tabs">
          {tabs.map((tab) => (
            <Link key={tab} href={qs({ category: tab })} className={`category-tab ${category === tab ? "active" : ""}`}>{tab}</Link>
          ))}
        </div>

        <div className="catalog-toolbar" style={{ borderBottom: 0, paddingTop: 10 }}>
          <span className="catalog-count">{products.length} {products.length === 1 ? "piece" : "pieces"}</span>
          {(q || category !== "All crafts" || sort !== "newest") && <Link className="text-link" href="/shop">Clear filters</Link>}
        </div>

        {products.length > 0 ? (
          <div className="catalog-grid">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="lookup-box"><h2 style={{ fontSize: 25 }}>Nothing matches that search yet.</h2><p>Try a different term or clear the filters.</p></div>
        )}
      </section>
    </>
  );
}
