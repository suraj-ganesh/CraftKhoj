import type { ReactNode } from "react";
import { DashTabs, type DashTab } from "./DashShell";

export function DashPage({
  kicker, title, lead, tabs, children, tone = "paper",
}: { kicker: string; title: string; lead?: string; tabs: DashTab[]; children: ReactNode; tone?: "paper" | "plain" }) {
  return (
    <section className={tone === "paper" ? "workspace-page" : "page-content"} style={tone === "plain" ? { paddingBottom: 40 } : undefined}>
      <div className="workspace-inner">
        <div className="workspace-top">
          <div>
            <span className="eyebrow">{kicker}</span>
            <h1>{title}</h1>
            {lead && <p>{lead}</p>}
          </div>
        </div>
        <DashTabs tabs={tabs} />
        {children}
      </div>
    </section>
  );
}

export function MetricCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function Panel({ title, action, children, tone }: { title: string; action?: ReactNode; children: ReactNode; tone?: "white" | "sky" | "mint" }) {
  return (
    <div className={`dashboard-panel ${tone === "sky" ? "panel-sky" : ""}`}>
      <div className="panel-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
