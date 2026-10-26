export type PriceLike = number | string | { toString(): string };

export const formatPrice = (price: PriceLike) => {
  const value = typeof price === "number" ? price : Number(price.toString());
  return `$${value.toLocaleString("en-US")}`;
};

export const trustLabel = (score: number) =>
  score >= 95 ? "Exceptional trust" : score >= 90 ? "Verified artisan" : "Building trust";

export const formatDate = (date: Date | string | null) => {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** District -> archive code used in Craft Provenance IDs (e.g. Lalitpur -> PA). */
export const DISTRICT_CODES: Record<string, string> = {
  Kathmandu: "KT",
  Lalitpur: "PA",
  Bhaktapur: "BH",
  Kaski: "PL",
  Chitwan: "CT",
  Palpa: "PL",
  Banke: "BN",
  Dhaka: "DK",
};

export const districtCode = (district: string) => DISTRICT_CODES[district] ?? district.slice(0, 2).toUpperCase();
