export type CraftCategory = "Textile" | "Pottery" | "Woodcraft" | "Metalcraft" | "Jewellery" | "Paper craft";

export type ProvenanceEvent = {
  date: string;
  title: string;
  detail: string;
};

export type Artisan = {
  id: string;
  name: string;
  location: string;
  district: string;
  craft: string;
  initials: string;
  bio: string;
  trustScore: number;
  years: number;
  verifiedSince: string;
  portrait: string;
};

export type Product = {
  id: string;
  title: string;
  category: CraftCategory;
  price: number;
  stock: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  origin: string;
  artisanId: string;
  artisanName: string;
  provenanceId: string;
  materials: string[];
  method: string;
  productionDate: string;
  verified: boolean;
  featured?: boolean;
  tags: string[];
  events: ProvenanceEvent[];
};

export const HERO_IMAGE = "/manus-storage/async-images/8LnElhfgAMHKbQPSxh5uQM/image-1.webp";

export const artisans: Artisan[] = [
  {
    id: "maya-shrestha",
    name: "Maya Shrestha",
    location: "Patan, Lalitpur",
    district: "Lalitpur",
    craft: "Newari woodcarving",
    initials: "MS",
    bio: "Maya learned the language of carved windows from her grandfather. Her workshop keeps the rhythm of hand tools, local timber, and patient detail alive in Patan.",
    trustScore: 96,
    years: 24,
    verifiedSince: "2023",
    portrait: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&q=80",
  },
  {
    id: "saraswati-tamang",
    name: "Saraswati Tamang",
    location: "Boudha, Kathmandu",
    district: "Kathmandu",
    craft: "Dhaka weaving",
    initials: "ST",
    bio: "Saraswati works with a small circle of women weavers to make modern Dhaka pieces that still carry the geometry of the hills.",
    trustScore: 94,
    years: 18,
    verifiedSince: "2022",
    portrait: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80",
  },
  {
    id: "dawa-gurung",
    name: "Dawa Gurung",
    location: "Thimi, Bhaktapur",
    district: "Bhaktapur",
    craft: "Terracotta pottery",
    initials: "DG",
    bio: "Dawa’s studio is one of Bhaktapur’s small working kilns, where local clay is shaped by hand and fired slowly for a deep, earthen finish.",
    trustScore: 91,
    years: 31,
    verifiedSince: "2024",
    portrait: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
  },
];

export const products: Product[] = [
  {
    id: "sajha-window",
    title: "Sajha Window Panel",
    category: "Woodcraft",
    price: 168,
    stock: 4,
    rating: 4.9,
    reviews: 28,
    image: "https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=900&q=85",
    description: "A small architectural fragment inspired by the lattice windows of Patan. Designed to hang as a wall piece or frame a quiet corner.",
    origin: "Patan, Lalitpur",
    artisanId: "maya-shrestha",
    artisanName: "Maya Shrestha",
    provenanceId: "CK-PA-2024-00418",
    materials: ["Sal wood", "Natural oil finish"],
    method: "Hand-carved with traditional chisels",
    productionDate: "18 October 2024",
    verified: true,
    featured: true,
    tags: ["architectural", "hand-carved", "heritage"],
    events: [
      { date: "18 Oct 2024", title: "Finished in the workshop", detail: "Final carving and oil finish completed by Maya Shrestha." },
      { date: "26 Oct 2024", title: "Provenance verified", detail: "Evidence reviewed by the CraftKhoj verification team." },
      { date: "02 Nov 2024", title: "Listed on CraftKhoj", detail: "Product record made public with a unique Craft Provenance ID." },
    ],
  },
  {
    id: "indreni-dhaka",
    title: "Indreni Dhaka Runner",
    category: "Textile",
    price: 74,
    stock: 12,
    rating: 4.8,
    reviews: 41,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=85",
    description: "A woven table runner built around a repeating indreni motif. Lightweight, joyful, and made for everyday rituals.",
    origin: "Boudha, Kathmandu",
    artisanId: "saraswati-tamang",
    artisanName: "Saraswati Tamang",
    provenanceId: "CK-KT-2024-00372",
    materials: ["Cotton", "Acrylic warp"],
    method: "Handwoven on a frame loom",
    productionDate: "04 September 2024",
    verified: true,
    featured: true,
    tags: ["woven", "table linen", "everyday"],
    events: [
      { date: "04 Sep 2024", title: "Warp prepared", detail: "Cotton weft and the indreni pattern plan were prepared in Boudha." },
      { date: "12 Sep 2024", title: "Woven and inspected", detail: "The finished runner was checked for tension, color, and edge quality." },
      { date: "20 Sep 2024", title: "Provenance verified", detail: "Workshop and process evidence accepted by CraftKhoj." },
    ],
  },
  {
    id: "bhaktapur-vessel",
    title: "Bhaktapur Red-Clay Vessel",
    category: "Pottery",
    price: 52,
    stock: 7,
    rating: 4.7,
    reviews: 19,
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85",
    description: "A generous, slightly irregular vessel with the warm color of Bhaktapur clay. Each one carries the small marks of the wheel.",
    origin: "Thimi, Bhaktapur",
    artisanId: "dawa-gurung",
    artisanName: "Dawa Gurung",
    provenanceId: "CK-BH-2024-00186",
    materials: ["Bhaktapur red clay", "Natural slip"],
    method: "Wheel-thrown and wood-fired",
    productionDate: "22 August 2024",
    verified: true,
    featured: true,
    tags: ["ceramic", "vessel", "kiln-fired"],
    events: [
      { date: "22 Aug 2024", title: "Thrown at the studio", detail: "Shaped on Dawa’s kick wheel using clay sourced from the local valley." },
      { date: "26 Aug 2024", title: "Wood-fired", detail: "Fired slowly in the studio kiln for an earthen surface." },
      { date: "30 Aug 2024", title: "Provenance verified", detail: "Production notes and workshop photos accepted by CraftKhoj." },
    ],
  },
  {
    id: "sun-gilt-earrings",
    title: "Sun Gilt Earrings",
    category: "Jewellery",
    price: 96,
    stock: 2,
    rating: 4.9,
    reviews: 13,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
    description: "Small brass earrings with a sunburst texture, made in a family metal studio and finished by hand.",
    origin: "Kumbeshwar, Lalitpur",
    artisanId: "maya-shrestha",
    artisanName: "Maya Shrestha",
    provenanceId: "CK-LP-2024-00502",
    materials: ["Brass", "Gold wash"],
    method: "Hand-hammered and cast",
    productionDate: "03 November 2024",
    verified: true,
    tags: ["brass", "wearable", "small batch"],
    events: [
      { date: "03 Nov 2024", title: "Cast and hammered", detail: "Each pair was shaped and textured by hand in the Kumbeshwar studio." },
      { date: "09 Nov 2024", title: "Quality checked", detail: "Pair count, clasp strength, and finish were checked before listing." },
      { date: "11 Nov 2024", title: "Provenance verified", detail: "Workshop and material evidence accepted by CraftKhoj." },
    ],
  },
  {
    id: "lokta-notebook",
    title: "Lokta Field Notebook",
    category: "Paper craft",
    price: 28,
    stock: 18,
    rating: 4.6,
    reviews: 34,
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85",
    description: "A hand-bound notebook with lokta paper, made to hold sketches, recipes, and the small evidence of a life well observed.",
    origin: "Kirtipur, Kathmandu",
    artisanId: "saraswati-tamang",
    artisanName: "Saraswati Tamang",
    provenanceId: "CK-KT-2024-00241",
    materials: ["Lokta paper", "Cotton thread"],
    method: "Hand-pulped, sun-dried, and bound",
    productionDate: "11 July 2024",
    verified: true,
    tags: ["paper", "stationery", "gift"],
    events: [
      { date: "11 Jul 2024", title: "Paper sheets dried", detail: "Lokta pulp was spread and sun-dried in Kirtipur." },
      { date: "16 Jul 2024", title: "Bound by hand", detail: "Sheets were folded and sewn with cotton thread." },
      { date: "18 Jul 2024", title: "Provenance verified", detail: "Paper source, workshop, and process notes accepted by CraftKhoj." },
    ],
  },
  {
    id: "pipal-bowl",
    title: "Pipal Leaf Serving Bowl",
    category: "Woodcraft",
    price: 44,
    stock: 0,
    rating: 4.5,
    reviews: 8,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85",
    description: "A shallow serving bowl with a pipal-leaf silhouette, carved from a single piece of locally sourced wood.",
    origin: "Patan, Lalitpur",
    artisanId: "maya-shrestha",
    artisanName: "Maya Shrestha",
    provenanceId: "CK-PA-2024-00311",
    materials: ["Mango wood", "Beeswax"],
    method: "Hand-carved and beeswax sealed",
    productionDate: "28 June 2024",
    verified: true,
    tags: ["serving", "wood", "organic form"],
    events: [
      { date: "28 Jun 2024", title: "Carved from one blank", detail: "The form was shaped from a single piece of mango wood." },
      { date: "04 Jul 2024", title: "Sealed and photographed", detail: "Finished with beeswax and documented for the provenance record." },
      { date: "06 Jul 2024", title: "Provenance verified", detail: "Workshop and material evidence accepted by CraftKhoj." },
    ],
  },
];

export const categories = ["All crafts", "Textile", "Pottery", "Woodcraft", "Metalcraft", "Jewellery", "Paper craft"] as const;

export const formatPrice = (price: number) => `$${price.toLocaleString("en-US")}`;

export const getProduct = (id: string) => products.find((product) => product.id === id);
export const getArtisan = (id: string) => artisans.find((artisan) => artisan.id === id);

export const trustLabel = (score: number) => (score >= 95 ? "Exceptional trust" : score >= 90 ? "Verified artisan" : "Building trust");
