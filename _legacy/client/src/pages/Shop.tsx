import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MarketShell, SectionKicker, SelectArrow } from "@/components/craft/MarketShell";
import { ProductCard } from "@/components/craft/CraftCards";
import { categories, products } from "@/lib/craft-data";

export default function Shop() {
  const [category, setCategory] = useState<(typeof categories)[number]>("All crafts");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const filtered = useMemo(() => {
    const result = products.filter((product) => {
      const matchesCategory = category === "All crafts" || product.category === category;
      const haystack = `${product.title} ${product.category} ${product.origin} ${product.artisanName}`.toLowerCase();
      return matchesCategory && haystack.includes(query.toLowerCase());
    });
    return [...result].sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "rating" ? b.rating - a.rating : Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }, [category, query, sort]);
  return <MarketShell><section className="page-intro"><div className="page-intro-inner"><SectionKicker number="01">Browse the archive</SectionKicker><h1>The considered collection.</h1><p>Heritage crafts from workshops across Nepal, with the story attached.</p></div></section><section className="page-content"><div className="category-tabs">{categories.map((item) => <button className={`category-tab ${category === item ? "active" : ""}`} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div><div className="catalog-toolbar"><span className="catalog-count">{filtered.length} pieces / {category}</span><div className="catalog-tools"><div className="select-wrap"><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products"><option value="featured">Sort: Featured</option><option value="rating">Sort: Most loved</option><option value="price-low">Sort: Price low</option><option value="price-high">Sort: Price high</option></select><SelectArrow /></div><label style={{ alignItems: "center", display: "flex", position: "relative" }}><Search size={16} style={{ left: 10, position: "absolute" }} /><input className="search-input" style={{ paddingLeft: 32 }} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search crafts" /></label></div></div>{filtered.length ? <div className="catalog-grid">{filtered.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="lookup-box" style={{ textAlign: "center" }}><h2>No pieces found.</h2><p style={{ marginTop: 8 }}>Try another craft, district, or maker.</p></div>}</section></MarketShell>;
}
