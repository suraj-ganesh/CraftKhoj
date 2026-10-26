// CraftKhoj seed — adapts the legacy demo data (_legacy/client/src/lib/craft-data.ts)
// into the Prisma + PostgreSQL schema. Run with: pnpm db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "Password123!";
const U = (iso: string) => new Date(iso);

async function main() {
  console.log("Seeding CraftKhoj…");
  await prisma.verificationLog.deleteMany();
  await prisma.provenanceEvent.deleteMany();
  await prisma.provenanceRecord.deleteMany();
  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productMaterial.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.material.deleteMany();
  await prisma.craftCategory.deleteMany();
  await prisma.artisanProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ---------- users ----------
  const admin = await prisma.user.create({ data: { fullName: "CraftKhoj Admin", email: "admin@craftkhoj.com", passwordHash, role: "ADMIN" } });
  const verifier = await prisma.user.create({ data: { fullName: "Sunita Verma", email: "verifier@craftkhoj.com", passwordHash, role: "VERIFIER" } });
  const buyer1 = await prisma.user.create({ data: { fullName: "Aarav Shrestha", email: "buyer@craftkhoj.com", passwordHash, role: "BUYER" } });
  const buyer2 = await prisma.user.create({ data: { fullName: "Priya Karki", email: "priya@craftkhoj.com", passwordHash, role: "BUYER" } });

  const mayaUser = await prisma.user.create({ data: { fullName: "Maya Shrestha", email: "maya@craftkhoj.com", passwordHash, role: "ARTISAN" } });
  const saraswatiUser = await prisma.user.create({ data: { fullName: "Saraswati Tamang", email: "saraswati@craftkhoj.com", passwordHash, role: "ARTISAN" } });
  const dawaUser = await prisma.user.create({ data: { fullName: "Dawa Gurung", email: "dara@craftkhoj.com", passwordHash, role: "ARTISAN" } });

  const maya = await prisma.artisanProfile.create({
    data: {
      userId: mayaUser.id, craftSpecialty: "Newari woodcarving", bio: "Maya learned the language of carved windows from her grandfather. Her workshop keeps the rhythm of hand tools, local timber, and patient detail alive in Patan.",
      district: "Lalitpur", workshopAddress: "Patan, Lalitpur", yearsExperience: 24, portraitUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&q=80",
      verificationStatus: "APPROVED", verificationNote: "Workshop visit completed 2023; tools, timber stock, and family guild confirmed.", trustScore: 96,
    },
  });
  const saraswati = await prisma.artisanProfile.create({
    data: {
      userId: saraswatiUser.id, craftSpecialty: "Dhaka weaving", bio: "Saraswati works with a small circle of women weavers to make modern Dhaka pieces that still carry the geometry of the hills.",
      district: "Kathmandu", workshopAddress: "Boudha, Kathmandu", yearsExperience: 18, portraitUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80",
      verificationStatus: "APPROVED", verificationNote: "Frame looms and weaver circle confirmed on site 2022.", trustScore: 94,
    },
  });
  const dawa = await prisma.artisanProfile.create({
    data: {
      userId: dawaUser.id, craftSpecialty: "Terracotta pottery", bio: "Dawa's studio is one of Bhaktapur's small working kilns, where local clay is shaped by hand and fired slowly for a deep, earthen finish.",
      district: "Bhaktapur", workshopAddress: "Thimi, Bhaktapur", yearsExperience: 31, portraitUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
      verificationStatus: "APPROVED", verificationNote: "Kiln and clay source verified 2024.", trustScore: 91,
    },
  });
  // a pending artisan registration so the verifier queue is not empty
  const bikashUser = await prisma.user.create({ data: { fullName: "Bikash Manandhar", email: "bikash@craftkhoj.com", passwordHash, role: "ARTISAN" } });
  const bikash = await prisma.artisanProfile.create({
    data: {
      userId: bikashUser.id, craftSpecialty: "Mithila & Newari painting", bio: "Fourth-generation painter working on the painted windows and paubha scrolls of the valley.",
      district: "Kathmandu", workshopAddress: "Kirtipur, Kathmandu", yearsExperience: 12,
      portraitUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&q=80",
      verificationStatus: "PENDING", trustScore: 0,
    },
  });

  // ---------- categories ----------
  const catData = [
    { name: "Textile", description: "Dhaka weaves, felted wool, and block-printed cloth." },
    { name: "Pottery", description: "Terracotta and red-clay vessels from valley kilns." },
    { name: "Woodcraft", description: "Carved windows, bowls, and architectural panels." },
    { name: "Metalcraft", description: "Cast brass, hammered bowls, and repoussé work." },
    { name: "Jewellery", description: "Wearable brass, silver, and glass beadwork." },
    { name: "Paper craft", description: "Lokta paper, hand-bound books, and stationery." },
  ];
  const cats = {} as Record<string, { id: number }>;
  for (const c of catData) cats[c.name] = await prisma.craftCategory.create({ data: c });

  // ---------- materials ----------
  const matNames = ["Sal wood", "Natural oil finish", "Cotton", "Acrylic warp", "Bhaktapur red clay", "Natural slip", "Brass", "Gold wash", "Lokta paper", "Cotton thread", "Mango wood", "Beeswax"];
  const mats = {} as Record<string, { id: number }>;
  for (const m of matNames) mats[m] = await prisma.material.create({ data: { name: m } });

  // ---------- provenance helper ----------
  async function makeProduct(opts: {
    artisan: { id: number }, title: string; category: { id: number }; price: number; stock: number;
    image: string; description: string; origin: string; provenanceId: string | null;
    materials: string[]; method: string; productionDate: string; status: "APPROVED" | "PENDING";
    tags: string; featured?: boolean; processNotes?: string;
    events: { date: string; title: string; detail: string }[];
  }) {
    const product = await prisma.product.create({
      data: {
        artisanId: opts.artisan.id, categoryId: opts.category.id, title: opts.title, description: opts.description,
        price: opts.price, stock: opts.stock, status: opts.status, provenanceId: opts.provenanceId,
        origin: opts.origin, productionMethod: opts.method, productionDate: U(opts.productionDate),
        processImageUrl: null, tags: opts.tags, isFeatured: opts.featured ?? false,
        images: { create: { imageUrl: opts.image, isPrimary: true } },
        materials: { create: opts.materials.map((m) => ({ materialId: mats[m].id })) },
      },
    });

    const record = await prisma.provenanceRecord.create({
      data: {
        productId: product.id, workshopLocation: opts.origin, productionDate: U(opts.productionDate),
        productionMethod: opts.method, processNotes: opts.processNotes ?? null,
        verificationStatus: opts.status === "APPROVED" ? "APPROVED" : "PENDING",
        verifierId: opts.status === "APPROVED" ? verifier.id : null,
        verifiedAt: opts.status === "APPROVED" ? U(opts.events[opts.events.length - 1].date) : null,
        verificationNote: opts.status === "APPROVED" ? "Evidence reviewed and accepted — workshop, materials, and method confirmed." : null,
      },
    });

    for (const e of opts.events) {
      await prisma.provenanceEvent.create({
        data: { provenanceRecordId: record.id, eventType: e.title.includes("verified") ? "APPROVED" : "SUBMITTED", description: `${e.title} — ${e.detail}`, performedById: e.title.includes("verified") ? verifier.id : null, eventTime: U(e.date) },
      });
    }

    if (opts.status === "APPROVED") {
      await prisma.verificationLog.create({
        data: { verifierId: verifier.id, decision: "APPROVED", remarks: "Workshop, material, and method evidence accepted.", provenanceRecordId: record.id, createdAt: U(opts.events[opts.events.length - 1].date) },
      });
    }
    return product;
  }

  // ---------- products (from legacy craft-data) ----------
  const sajha = await makeProduct({
    artisan: maya, category: cats["Woodcraft"], title: "Sajha Window Panel", price: 168, stock: 4,
    image: "https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=900&q=85",
    description: "A small architectural fragment inspired by the lattice windows of Patan. Designed to hang as a wall piece or frame a quiet corner.",
    origin: "Patan, Lalitpur", provenanceId: "CK-PA-2024-00418", materials: ["Sal wood", "Natural oil finish"],
    method: "Hand-carved with traditional chisels", productionDate: "2024-10-18", status: "APPROVED",
    tags: "architectural, hand-carved, heritage", featured: true,
    processNotes: "Carved from seasoned sal wood over six days; oil finish hand-rubbed.",
    events: [
      { date: "2024-10-18", title: "Finished in the workshop", detail: "Final carving and oil finish completed by Maya Shrestha." },
      { date: "2024-10-26", title: "Provenance verified", detail: "Evidence reviewed by the CraftKhoj verification team." },
      { date: "2024-11-02", title: "Listed on CraftKhoj", detail: "Product record made public with a unique Craft Provenance ID." },
    ],
  });

  const indreni = await makeProduct({
    artisan: saraswati, category: cats["Textile"], title: "Indreni Dhaka Runner", price: 74, stock: 12,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=85",
    description: "A woven table runner built around a repeating indreni motif. Lightweight, joyful, and made for everyday rituals.",
    origin: "Boudha, Kathmandu", provenanceId: "CK-KT-2024-00372", materials: ["Cotton", "Acrylic warp"],
    method: "Handwoven on a frame loom", productionDate: "2024-09-04", status: "APPROVED",
    tags: "woven, table linen, everyday", featured: true,
    events: [
      { date: "2024-09-04", title: "Warp prepared", detail: "Cotton weft and the indreni pattern plan were prepared in Boudha." },
      { date: "2024-09-12", title: "Woven and inspected", detail: "The finished runner was checked for tension, color, and edge quality." },
      { date: "2024-09-20", title: "Provenance verified", detail: "Workshop and process evidence accepted by CraftKhoj." },
    ],
  });

  const vessel = await makeProduct({
    artisan: dawa, category: cats["Pottery"], title: "Bhaktapur Red-Clay Vessel", price: 52, stock: 7,
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=85",
    description: "A generous, slightly irregular vessel with the warm color of Bhaktapur clay. Each one carries the small marks of the wheel.",
    origin: "Thimi, Bhaktapur", provenanceId: "CK-BH-2024-00186", materials: ["Bhaktapur red clay", "Natural slip"],
    method: "Wheel-thrown and wood-fired", productionDate: "2024-08-22", status: "APPROVED",
    tags: "ceramic, vessel, kiln-fired", featured: true,
    events: [
      { date: "2024-08-22", title: "Thrown at the studio", detail: "Shaped on Dawa's kick wheel using clay sourced from the local valley." },
      { date: "2024-08-26", title: "Wood-fired", detail: "Fired slowly in the studio kiln for an earthen surface." },
      { date: "2024-08-30", title: "Provenance verified", detail: "Production notes and workshop photos accepted by CraftKhoj." },
    ],
  });

  const earrings = await makeProduct({
    artisan: maya, category: cats["Jewellery"], title: "Sun Gilt Earrings", price: 96, stock: 2,
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
    description: "Small brass earrings with a sunburst texture, made in a family metal studio and finished by hand.",
    origin: "Kumbeshwar, Lalitpur", provenanceId: "CK-LP-2024-00502", materials: ["Brass", "Gold wash"],
    method: "Hand-hammered and cast", productionDate: "2024-11-03", status: "APPROVED",
    tags: "brass, wearable, small batch",
    events: [
      { date: "2024-11-03", title: "Cast and hammered", detail: "Each pair was shaped and textured by hand in the Kumbeshwar studio." },
      { date: "2024-11-09", title: "Quality checked", detail: "Pair count, clasp strength, and finish were checked before listing." },
      { date: "2024-11-11", title: "Provenance verified", detail: "Workshop and material evidence accepted by CraftKhoj." },
    ],
  });

  const notebook = await makeProduct({
    artisan: saraswati, category: cats["Paper craft"], title: "Lokta Field Notebook", price: 28, stock: 18,
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85",
    description: "A hand-bound notebook with lokta paper, made to hold sketches, recipes, and the small evidence of a life well observed.",
    origin: "Kirtipur, Kathmandu", provenanceId: "CK-KT-2024-00241", materials: ["Lokta paper", "Cotton thread"],
    method: "Hand-pulped, sun-dried, and bound", productionDate: "2024-07-11", status: "APPROVED",
    tags: "paper, stationery, gift",
    events: [
      { date: "2024-07-11", title: "Paper sheets dried", detail: "Lokta pulp was spread and sun-dried in Kirtipur." },
      { date: "2024-07-16", title: "Bound by hand", detail: "Sheets were folded and sewn with cotton thread." },
      { date: "2024-07-18", title: "Provenance verified", detail: "Paper source, workshop, and process notes accepted by CraftKhoj." },
    ],
  });

  const bowl = await makeProduct({
    artisan: maya, category: cats["Woodcraft"], title: "Pipal Leaf Serving Bowl", price: 44, stock: 0,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85",
    description: "A shallow serving bowl with a pipal-leaf silhouette, carved from a single piece of locally sourced wood.",
    origin: "Patan, Lalitpur", provenanceId: "CK-PA-2024-00311", materials: ["Mango wood", "Beeswax"],
    method: "Hand-carved and beeswax sealed", productionDate: "2024-06-28", status: "APPROVED",
    tags: "serving, wood, organic form",
    events: [
      { date: "2024-06-28", title: "Carved from one blank", detail: "The form was shaped from a single piece of mango wood." },
      { date: "2024-07-04", title: "Sealed and photographed", detail: "Finished with beeswax and documented for the provenance record." },
      { date: "2024-07-06", title: "Provenance verified", detail: "Workshop and material evidence accepted by CraftKhoj." },
    ],
  });

  // a PENDING product so the verifier queue shows something
  await makeProduct({
    artisan: bikash, category: cats["Metalcraft"], title: "Paubha Horizon Plate", price: 60, stock: 5,
    image: "https://images.unsplash.com/photo-1533158326339-7f3cf2404354?auto=format&fit=crop&w=900&q=85",
    description: "A cast brass plate engraved with a paubha horizon line — mountains, clouds, and the sun wheel in low relief.",
    origin: "Kirtipur, Kathmandu", provenanceId: null, materials: ["Brass"],
    method: "Sand-cast and chiselled", productionDate: "2026-01-12", status: "PENDING",
    tags: "brass, engraved, ritual",
    events: [
      { date: "2026-01-12", title: "Submitted from the workshop", detail: "Bikash submitted casting photos and chisel work for review." },
    ],
  });

  // ---------- reviews ----------
  await prisma.review.createMany({
    data: [
      { productId: sajha.id, buyerId: buyer1.id, rating: 5, comment: "The carving is sharper in person than any photo. It has hung above our entryway since November.", createdAt: U("2024-11-20") },
      { productId: sajha.id, buyerId: buyer2.id, rating: 5, comment: "Maya's panel is heirloom quality. The provenance record made me confident ordering from abroad.", createdAt: U("2024-12-02") },
      { productId: indreni.id, buyerId: buyer1.id, rating: 5, comment: "Joyful runner — colors survived the first wash.", createdAt: U("2024-10-05") },
      { productId: indreni.id, buyerId: buyer2.id, rating: 4, comment: "Lovely weave, slightly lighter weight than I expected.", createdAt: U("2024-10-11") },
      { productId: vessel.id, buyerId: buyer1.id, rating: 5, comment: "Beautiful speckles from the firing. Arrived packed in straw.", createdAt: U("2024-09-15") },
      { productId: earrings.id, buyerId: buyer2.id, rating: 5, comment: "Sunburst texture catches light exactly as described.", createdAt: U("2024-11-25") },
      { productId: notebook.id, buyerId: buyer1.id, rating: 4, comment: "Great texture for fountain pens. Cover could be stiffer.", createdAt: U("2024-08-02") },
      { productId: bowl.id, buyerId: buyer2.id, rating: 5, comment: "Used it for daal at a dinner — guests noticed the pipal shape before the food.", createdAt: U("2024-07-20") },
    ],
  });

  // ---------- orders ----------
  const order1 = await prisma.order.create({
    data: {
      buyerId: buyer1.id, totalAmount: 294, paymentMethod: "SIMULATED", paymentStatus: "PAID", orderStatus: "DELIVERED",
      shippingName: "Aarav Shrestha", shippingPhone: "9841223344", shippingAddress: "Jhamsikhel Road 44, Lalitpur", createdAt: U("2024-11-10"),
      orderItems: { create: [
        { productId: sajha.id, quantity: 1, unitPrice: 168 },
        { productId: indreni.id, quantity: 1, unitPrice: 74 },
        { productId: vessel.id, quantity: 1, unitPrice: 52 },
      ] },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      buyerId: buyer2.id, totalAmount: 190, paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING", orderStatus: "SHIPPED",
      shippingName: "Priya Karki", shippingPhone: "9841556677", shippingAddress: "Baluwatar, Kathmandu", createdAt: U("2024-12-05"),
      orderItems: { create: [
        { productId: earrings.id, quantity: 1, unitPrice: 96 },
        { productId: notebook.id, quantity: 1, unitPrice: 28 },
        { productId: bowl.id, quantity: 1, unitPrice: 44 },
      ] },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      buyerId: buyer1.id, totalAmount: 148, paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING", orderStatus: "PLACED",
      shippingName: "Aarav Shrestha", shippingPhone: "9841223344", shippingAddress: "Jhamsikhel Road 44, Lalitpur", createdAt: U("2026-01-20"),
      orderItems: { create: [
        { productId: indreni.id, quantity: 2, unitPrice: 74 },
      ] },
    },
  });

  // ---------- cart ----------
  await prisma.cartItem.create({ data: { buyerId: buyer1.id, productId: vessel.id, quantity: 1 } });

  // ---------- report ----------
  await prisma.report.create({
    data: {
      productId: earrings.id, reporterId: buyer2.id, reason: "COUNTERFEIT_CLAIM",
      description: "A shop near Thamel sells identical sunburst earrings stamped 'Made in India'. Listing claims Kumbeshwar origin — please re-check the workshop receipts.",
      status: "OPEN", createdAt: U("2026-01-22"),
    },
  });

  console.log("Seed complete:");
  console.log(`  users: admin@craftkhoj.com, verifier@craftkhoj.com, buyer@craftkhoj.com (+ maya/saraswati/dara@craftkhoj.com artisans)`);
  console.log(`  password for every account: ${PASSWORD}`);
  console.log(`  orders seeded: #${order1.id}, #${order2.id}, #${order3.id}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
