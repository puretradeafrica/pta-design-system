/**
 * Demo: the Sales Pipeline board, rebuilt entirely from Layer 3 primitives.
 *
 * Nothing here styles anything. Every colour, size, space and radius comes from a
 * token, and the board itself is one `<DataTable>` call. That is the point: this
 * file is what a builder writes, and they cannot produce a divergent board from it.
 *
 * Deal data is a realistic sample, not a live Supabase read.
 */

import React from "react";
import {
  Avatar, Badge, Button, CellStack, DataTable, Empty, EmptyState, Field, KpiStrip,
  Modal, PageHeader, Sidebar, StagePill, StatusPill, TextInput, Toast, Toolbar, Card,
  stageColor,
  type Column, type DealState, type TableGroup,
} from "../src/index.ts";
import { semantic } from "../src/tokens/semantic.ts";
import { scale } from "../src/tokens/scale.ts";

/* ------------------------------------------------------------------ deal data */

interface Deal {
  id: string;
  deal: string;
  structure: "Stock" | "Back-to-Back" | "Sourcing TBC";
  client: string;
  product: string;
  volume: number | null;
  trader: string;
  initials: string;
  type: string | null;
  value: number | null;
  currency: string;
  gp: number | null;
  sales: { label: string; state: DealState } | null;
  stock: { label: string; state: DealState } | null;
  transport: { label: string; state: DealState } | null;
  due: string | null;
  folder: string | null;
}

/** Stage colours come from the design system, never from a literal. */
const STAGE_COLOR: Record<string, string> = {
  "New Sales Enquiry": stageColor("New Sales Enquiry"),
  "Ready to Quote": stageColor("Ready to Quote"),
  "Quote Submitted": stageColor("Quote Submitted"),
};

const GROUPS: TableGroup<Deal>[] = [
  {
    id: "enquiry", label: "New Sales Enquiry", color: STAGE_COLOR["New Sales Enquiry"], count: 3,
    rows: [
      { id: "1", deal: "KAM25951", structure: "Back-to-Back", client: "Kamoto Copper Company S.A.",
        product: "Magnesium Oxide", volume: 2508, trader: "Alan Wierciak", initials: "AW", type: null,
        value: 2620860, currency: "USD", gp: 0.037, sales: null, stock: null, transport: null,
        due: "2025-12-12", folder: null },
      { id: "2", deal: "QUO26773", structure: "Back-to-Back", client: "Mauritanian Copper Mines SA",
        product: "Various", volume: 22, trader: "Thomas Vallee", initials: "TV", type: "Standard",
        value: 99770, currency: "USD", gp: 0.109, sales: null, stock: null,
        transport: { label: "N/A", state: "notRequired" }, due: "2026-07-24", folder: null },
      { id: "3", deal: "NOR26444", structure: "Stock", client: "Norin Mining (Beijing) Limited",
        product: "Mining Solvent", volume: null, trader: "Gregg Gilson", initials: "GG", type: null,
        value: null, currency: "USD", gp: null, sales: null, stock: null, transport: null,
        due: null, folder: null },
    ],
  },
  {
    id: "ready", label: "Ready to Quote", color: STAGE_COLOR["Ready to Quote"], count: 2,
    rows: [
      { id: "4", deal: "MUS26758", structure: "Back-to-Back", client: "Ruashi Mining SAS (Musonoi Project)",
        product: "Steel", volume: 798, trader: "Erin Wu", initials: "EW", type: "Standard",
        value: 42945, currency: "USD", gp: 0.163,
        sales: { label: "Price Confirmed", state: "confirmed" },
        stock: { label: "Commodity Confirmed", state: "confirmed" },
        transport: { label: "Transport Confirmed", state: "confirmed" },
        due: "2026-08-24", folder: "https://example.invalid/folder" },
      { id: "5", deal: "QUO26879", structure: "Stock", client: "Brother Mining SASU",
        product: "Mining Solvent", volume: 124, trader: "Gregg Gilson", initials: "GG", type: "Standard",
        value: 378820, currency: "USD", gp: 0.071,
        sales: { label: "Price Confirmed", state: "confirmed" },
        stock: { label: "Commodity Pending", state: "pending" },
        transport: { label: "Transport Not Required", state: "notRequired" },
        due: "2026-08-21", folder: null },
    ],
  },
  {
    id: "submitted", label: "Quote Submitted", color: STAGE_COLOR["Quote Submitted"], count: 44,
    rows: [
      { id: "6", deal: "HAN26784", structure: "Stock", client: "Hanrui Metal Congo SARL",
        product: "Mining Solvent", volume: 68, trader: "Erin Wu", initials: "EW", type: "Standard",
        value: 187000, currency: "USD", gp: 0.091,
        sales: { label: "Price Confirmed", state: "confirmed" },
        stock: { label: "Commodity Confirmed", state: "confirmed" },
        transport: { label: "Transport Blocked", state: "blocked" },
        due: "2026-08-24", folder: "https://example.invalid/folder" },
      { id: "7", deal: "QUO26756", structure: "Stock", client: "CMOC Kisanfu Mining SARL",
        product: "Mining Solvent", volume: 100, trader: "Erin Wu", initials: "EW", type: "Standard",
        value: 290000, currency: "USD", gp: 0.156,
        sales: { label: "Price Confirmed", state: "confirmed" },
        stock: { label: "Commodity Confirmed", state: "confirmed" },
        transport: { label: "Transport Confirmed", state: "confirmed" },
        due: null, folder: null },
      { id: "8", deal: "ROS26801", structure: "Back-to-Back", client: "Rossing Uranium Limited",
        product: "Sulphuric Acid", volume: 4200, trader: "Alan Wierciak", initials: "AW", type: "Standard",
        value: 1140000, currency: "USD", gp: 0.042,
        sales: { label: "Price Confirmed", state: "confirmed" },
        stock: { label: "Commodity Pending", state: "pending" },
        transport: { label: "Transport Confirmed", state: "confirmed" },
        due: "2026-09-02", folder: null },
    ],
  },
];

const SYMBOL: Record<string, string> = { USD: "$", ZAR: "R", EUR: "€", NAD: "N$" };
const money = (n: number | null, cur: string) =>
  n == null ? null : SYMBOL[cur] + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

/* -------------------------------------------------------------- the board page */

function BoardPage({ onToast }: { onToast: (m: string) => void }) {
  const [query, setQuery] = React.useState("");
  const [enquiryOpen, setEnquiryOpen] = React.useState(false);

  const groups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GROUPS;
    return GROUPS
      .map((g) => ({
        ...g,
        rows: g.rows.filter((r) =>
          [r.deal, r.client, r.product, r.trader].some((v) => v.toLowerCase().includes(q))),
      }))
      .filter((g) => g.rows.length > 0);
  }, [query]);

  const columns: Column<Deal>[] = [
    { key: "deal", header: "Deal", width: "89px",
      render: (r) => <CellStack primary={r.deal} secondary={r.structure} /> },
    { key: "client", header: "Client", width: "162px", render: (r) => r.client },
    { key: "product", header: "Product Group", width: "110px", render: (r) => r.product },
    { key: "volume", header: "Vol (MT)", width: "71px", numeric: true,
      render: (r) => (r.volume == null ? <Empty /> : r.volume.toLocaleString()) },
    { key: "trader", header: "Trader", width: "136px",
      render: (r) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: scale.space.xs + 2 }}>
          <Avatar name={r.trader} initials={r.initials} />
          <span style={{ color: semantic.text.secondary, overflow: "hidden", textOverflow: "ellipsis" }}>
            {r.trader}
          </span>
        </span>
      ) },
    { key: "type", header: "Type", width: "99px",
      render: (r) => (r.type ? <Badge tone="neutral">{r.type}</Badge> : <Empty />) },
    { key: "stage", header: "Stage", width: "143px",
      render: (r) => {
        const group = GROUPS.find((g) => g.rows.some((x) => x.id === r.id))!;
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start",
                        gap: scale.space.xs + 1 }}>
            <StagePill label={group.label} color={group.color} />
            <div style={{ display: "flex", gap: scale.space.xs + 1 }}>
            {group.id === "ready" && (
              <Button size="sm" variant="secondary"
                onClick={(e) => { e.stopPropagation(); onToast(`${r.deal} moved to Quote Submitted`); }}>
                Submit
              </Button>
            )}
            {group.id === "submitted" && (
              <>
                <Button size="sm" variant="won"
                  onClick={(e) => { e.stopPropagation(); onToast(`${r.deal} marked Won`); }}>Won</Button>
                <Button size="sm" variant="lost"
                  onClick={(e) => { e.stopPropagation(); onToast(`${r.deal} marked Lost`); }}>Lost</Button>
              </>
            )}
            </div>
          </div>
        );
      } },
    { key: "value", header: "Value", width: "99px", numeric: true,
      render: (r) => money(r.value, r.currency) ?? <Empty /> },
    { key: "gp", header: "GP%", width: "65px", numeric: true,
      render: (r) =>
        r.gp == null ? <Empty /> : (
          <span style={{ color: r.gp >= 0.1 ? semantic.dataSignal.positive : semantic.dataSignal.negative }}>
            {(r.gp * 100).toFixed(1)}%
          </span>
        ) },
    { key: "sales", header: "Sales", width: "132px",
      render: (r) => (r.sales ? <StatusPill state={r.sales.state} label={r.sales.label} /> : <Empty />) },
    { key: "stock", header: "Stock", width: "153px",
      render: (r) => (r.stock ? <StatusPill state={r.stock.state} label={r.stock.label} /> : <Empty />) },
    { key: "transport", header: "Transport", width: "158px",
      render: (r) => (r.transport ? <StatusPill state={r.transport.state} label={r.transport.label} /> : <Empty />) },
    { key: "due", header: "Due", width: "97px",
      render: (r) => (r.due ? <span style={{ color: semantic.text.secondary, whiteSpace: "nowrap" }}>{r.due}</span> : <Empty />) },
    { key: "folder", header: "Folder", width: "76px",
      render: (r) => (
        <span
          onClick={(e) => { e.stopPropagation(); onToast(r.folder ? "Opening SharePoint folder" : "Add a folder link"); }}
          style={{
            color: r.folder ? semantic.interactive.link : semantic.text.faint,
            cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          {r.folder ? "Open" : "+ Folder"}
        </span>
      ) },
  ];

  return (
    <>
      <PageHeader
        brand={<img src="/pta-logo-white.png" alt="Pure Trade Africa" style={{ height: 28, display: "block" }} />}
        title="Sales Pipeline"
        subtitle="Enquiry to deal lifecycle &middot; 273 deals"
        actions={
          <>
            <Button variant="onChrome" onClick={() => setEnquiryOpen(true)}>+ New Enquiry</Button>
            <TextInput
              onChrome
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search deals, clients, products"
              aria-label="Search deals"
              style={{ width: 240 }}
            />
            <Button variant="ghost" onClick={() => onToast("Rules panel")}
              style={{ background: "transparent", color: semantic.text.onChrome, borderColor: semantic.border.onChrome }}>
              Rules
            </Button>
          </>
        }
      />

      <div style={{ padding: scale.space.lg }}>
        {groups.length === 0 ? (
          <EmptyState
            title="No deals match that search"
            message={`Nothing found for "${query}".`}
            action={<Button variant="ghost" onClick={() => setQuery("")}>Clear search</Button>}
          />
        ) : (
          <DataTable
            columns={columns}
            groups={groups}
            getRowKey={(r) => r.id}
            onRowClick={(r) => onToast(`Opening ${r.deal}`)}
            minWidth={1590}
            rowHeight={67}
          />
        )}
      </div>

      {enquiryOpen && (
        <Modal
          title="New Sales Enquiry"
          subtitle="Raise an enquiry against an existing client"
          onClose={() => setEnquiryOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setEnquiryOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => { setEnquiryOpen(false); onToast("Enquiry created"); }}>
                Create enquiry
              </Button>
            </>
          }
        >
          <div style={{ display: "grid", gap: scale.space.lg, gridTemplateColumns: "1fr 1fr" }}>
            <Field label="Client"><TextInput defaultValue="Kamoto Copper Company S.A." /></Field>
            <Field label="Trader"><TextInput defaultValue="Alan Wierciak" /></Field>
            <Field label="Product group"><TextInput placeholder="Magnesium Oxide" /></Field>
            <Field label="Volume (MT)" hint="Leave blank if not yet known">
              <TextInput type="number" placeholder="2508" />
            </Field>
            <Field label="Quote due date" error="Required before the enquiry can be quoted">
              <TextInput type="date" invalid />
            </Field>
            <Field label="Deal structure"><TextInput defaultValue="Back-to-Back" /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}

/* ------------------------------------------------------------- kitchen sink */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: scale.space.lg, alignItems: "center",
      padding: `${scale.space.md}px 0`, borderTop: `${scale.border.thin}px solid ${semantic.border.subtle}` }}>
      <div style={{ fontSize: scale.fontSize.meta, fontWeight: scale.fontWeight.bold,
        textTransform: "uppercase", letterSpacing: "0.05em", color: semantic.text.muted }}>{label}</div>
      <div style={{ display: "flex", gap: scale.space.sm, flexWrap: "wrap", alignItems: "center" }}>{children}</div>
    </div>
  );
}

function KitchenSink({ onToast }: { onToast: (m: string) => void }) {
  return (
    <>
      <PageHeader title="Every primitive" subtitle="Each one in each state" />
      <KpiStrip items={[
        { label: "Total Sales", value: "$2,620,860" },
        { label: "Cost of Sales", value: "$2,523,583" },
        { label: "GP", value: "$97,277", note: "3.7%", tone: "negative" },
        { label: "Finance Cost", value: "$21,123", tone: "critical" },
        { label: "Profit After Finance", value: "$76,153", note: "2.9%", tone: "positive" },
        { label: "Total Volume", value: "2,508", note: "MT" },
      ]} />
      <div style={{ padding: scale.space.xl, maxWidth: 1100 }}>
        <Card>
          <Row label="Button variants">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="won">Won</Button>
            <Button variant="lost">Lost</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </Row>
          <Row label="Button sizes">
            <Button size="sm" variant="ghost">Small</Button>
            <Button size="md" variant="ghost">Medium</Button>
            <Button size="lg" variant="ghost">Large</Button>
          </Row>
          <Row label="Status pills">
            <StatusPill state="confirmed" label="Transport Confirmed" />
            <StatusPill state="pending" label="Commodity Pending" />
            <StatusPill state="blocked" label="Transport Blocked" />
            <StatusPill state="notRequired" label="Not Required" />
          </Row>
          <Row label="Badges">
            <Badge tone="success">Success</Badge>
            <Badge tone="warning">Warning</Badge>
            <Badge tone="danger">Danger</Badge>
            <Badge tone="info">Info</Badge>
            <Badge tone="neutral">Neutral</Badge>
            <Badge tone="danger" solid>Solid</Badge>
          </Row>
          <Row label="Stage pills">
            {Object.entries(STAGE_COLOR).map(([label, color]) => (
              <StagePill key={label} label={label} color={color} />
            ))}
          </Row>
          <Row label="Avatars">
            <Avatar name="Alan Wierciak" initials="AW" />
            <Avatar name="Erin Wu" initials="EW" />
            <Avatar name="Thomas Vallee" />
          </Row>
          <Row label="Inputs">
            <TextInput placeholder="Default" style={{ width: 200 }} />
            <TextInput placeholder="Invalid" invalid style={{ width: 200 }} />
            <TextInput placeholder="Disabled" disabled style={{ width: 200 }} />
          </Row>
          <Row label="Field">
            <div style={{ width: 260 }}>
              <Field label="Quote due date" error="Required before quoting">
                <TextInput type="date" invalid />
              </Field>
            </div>
            <div style={{ width: 260 }}>
              <Field label="Volume (MT)" hint="Leave blank if unknown">
                <TextInput type="number" placeholder="2508" />
              </Field>
            </div>
          </Row>
          <Row label="Data cells">
            <CellStack primary="KAM25951" secondary="Back-to-Back" />
            <Empty />
          </Row>
          <Row label="Toast">
            <Button variant="ghost" onClick={() => onToast("Deal saved")}>Show a toast</Button>
          </Row>
        </Card>

        <div style={{ marginTop: scale.space.xl }}>
          <EmptyState
            title="No deals match that search"
            message="Try a different client, product or trader."
            action={<Button variant="ghost">Clear search</Button>}
          />
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------------ app */

const NAV = [
  { key: "board", label: "Sales Pipeline", href: "#board" },
  { key: "sink", label: "All components", href: "#sink" },
];

export default function App() {
  const [page, setPage] = React.useState<"board" | "sink">("board");
  const [collapsed, setCollapsed] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: semantic.surface.page }}>
      <div onClick={(e) => {
        const a = (e.target as HTMLElement).closest("a");
        if (!a) return;
        const href = a.getAttribute("href");
        if (href === "#board" || href === "#sink") {
          e.preventDefault();
          setPage(href.slice(1) as "board" | "sink");
        }
      }}>
        <Sidebar
          items={NAV}
          active={page}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>
      <main style={{ flex: 1, minWidth: 0 }}>
        {page === "board"
          ? <BoardPage onToast={setToast} />
          : <KitchenSink onToast={setToast} />}
      </main>
      {toast && <Toast tone="success" onDismiss={() => setToast(null)}>{toast}</Toast>}
    </div>
  );
}
