import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArtisanCard, SectionKicker } from "@/components/craft";

export const dynamic = "force-dynamic";

export default async function ArtisansPage() {
  const artisans = await prisma.artisanProfile.findMany({
    where: { verificationStatus: "APPROVED" },
    include: { user: true, _count: { select: { products: true } } },
    orderBy: { trustScore: "desc" },
  });

  return (
    <>
      <section className="page-intro">
        <div className="page-intro-inner">
          <SectionKicker number="02">Artisan stories</SectionKicker>
          <h1>Meet the makers behind the records.</h1>
          <p>Every workshop profile here is verified by a CraftKhoj verifier — identity, craft specialty, district, and workshop address.</p>
        </div>
      </section>
      <section className="page-content">
        {artisans.length === 0 ? (
          <div className="lookup-box">No verified artisans yet. <strong>Check back soon.</strong></div>
        ) : (
          <div className="artisan-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            {artisans.map((a) => (
              <ArtisanCard
                key={a.id}
                artisan={{
                  id: a.id, name: a.user.fullName, craftSpecialty: a.craftSpecialty, district: a.district,
                  bio: a.bio, trustScore: Number(a.trustScore), portraitUrl: a.portraitUrl,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
