import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { getSessionUser } from "@/lib/session";
import { CartProvider } from "@/components/CartContext";
import { SiteHeader, CartDrawer } from "@/components/Shell";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "CraftKhoj — A Provenance-Based Marketplace for Nepali Heritage Crafts",
  description: "Every object leaves a trail. Verified artisan profiles, transparent provenance records, and authentic Nepali heritage crafts.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en">
      <body>
        <CartProvider role={user?.role ?? null}>
          <SiteHeader user={user ? { role: user.role, fullName: user.fullName } : null} />
          <main>{children}</main>
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
        <Toaster position="bottom-right" toastOptions={{ style: { background: "#374B4A", color: "#C5FFFD", border: "3px solid #374B4A", borderRadius: 0 } }} />
      </body>
    </html>
  );
}
