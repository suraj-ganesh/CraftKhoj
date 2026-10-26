import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DashPage } from "@/components/Panels";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/products", label: "My products" },
  { href: "/studio/orders", label: "Orders" },
  { href: "/studio/provenance", label: "Provenance records" },
  { href: "/studio/profile", label: "Workshop profile" },
];

export default async function StudioProfilePage() {
  const user = await requireRole("ARTISAN");
  const profile = await prisma.artisanProfile.findUnique({ where: { userId: user.id }, include: { user: true } });
  if (!profile) notFoundComponent();

  return (
    <DashPage kicker="Artisan studio" title="Workshop profile." lead="This page doubles as your public-facing artisan identity across the marketplace." tabs={tabs}>
      <ProfileForm
        initial={{
          fullName: profile!.user.fullName,
          email: profile!.user.email,
          craftSpecialty: profile!.craftSpecialty ?? "",
          district: profile!.district ?? districts[0],
          bio: profile!.bio ?? "",
          workshopAddress: profile!.workshopAddress ?? "",
          portraitUrl: profile!.portraitUrl ?? "",
          trustScore: Number(profile!.trustScore),
        }}
      />
    </DashPage>
  );
}

const districts = ["Kathmandu", "Lalitpur", "Bhaktapur", "Kaski", "Chitwan", "Palpa", "Banke", "Dhading"];

function notFoundComponent() {
  throw new Error("Profile not found. Contact an administrator.");
}
