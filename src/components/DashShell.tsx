"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type DashTab = { href: string; label: string };

export function DashTabs({ tabs }: { tabs: DashTab[] }) {
  const pathname = usePathname();
  return (
    <div className="workspace-tabs">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return <Link key={tab.href} className={`workspace-tab ${active ? "active" : ""}`} href={tab.href}>{tab.label}</Link>;
      })}
    </div>
  );
}
