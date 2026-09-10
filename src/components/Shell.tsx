/**
 * Layer 3: Page shell. PageHeader, Sidebar, Card, Toolbar, KpiStrip.
 *
 * The chrome every PTA app puts around its content. Building it once is what stops
 * Transport View and Pure Track growing headers that are almost, but not quite,
 * the Sales Pipeline's.
 */

import React from "react";
import { semantic } from "../tokens/semantic.ts";
import { scale } from "../tokens/scale.ts";

/* ---------------------------------------------------------------- PageHeader */

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Wordmark or logo. Sits left of the divider. */
  brand?: React.ReactNode;
  /** Buttons and inputs, pushed to the right. */
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, brand, actions }: PageHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: scale.space.md,
        background: semantic.surface.chrome,
        color: semantic.text.onChrome,
        padding: `${scale.space.sm + 2}px ${scale.space.lg}px`,
        minHeight: scale.layout.headerHeight,
      }}
    >
      {brand}
      {brand && (
        <span
          aria-hidden
          style={{ width: 1, height: 30, background: semantic.border.onChrome, flex: "none" }}
        />
      )}
      <div style={{ minWidth: 0 }}>
        {/* Montserrat is permitted here: 18px is the floor for the display face. */}
        <h1
          style={{
            margin: 0,
            fontFamily: scale.font.display,
            fontSize: scale.fontSize.heading,
            fontWeight: scale.fontWeight.bold,
            lineHeight: scale.lineHeight.tight,
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h1>
        {subtitle != null && (
          <div
            style={{
              fontFamily: scale.font.body,
              fontSize: scale.fontSize.meta,
              color: semantic.text.onChromeMuted,
              lineHeight: scale.lineHeight.snug,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {actions != null && (
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: scale.space.sm,
            flexWrap: "wrap",
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ Wordmark */

export function Wordmark({ src, alt = "Pure Trade Africa", height = 28 }: {
  src?: string; alt?: string; height?: number;
}) {
  if (src) return <img src={src} alt={alt} style={{ height, width: "auto", display: "block" }} />;
  return (
    <span
      style={{
        fontFamily: scale.font.display,
        fontSize: scale.fontSize.caption,
        fontWeight: scale.fontWeight.bold,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      PURE TRADE AFRICA
    </span>
  );
}

/* -------------------------------------------------------------------- Sidebar */

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface SidebarProps {
  items: NavItem[];
  active: string;
  collapsed?: boolean;
  onToggle?: () => void;
  footer?: React.ReactNode;
}

export function Sidebar({ items, active, collapsed = false, onToggle, footer }: SidebarProps) {
  const w = collapsed ? scale.layout.sidebarCollapsedWidth : scale.layout.sidebarWidth;
  return (
    <nav
      aria-label="Main"
      style={{
        flex: "none",
        width: w,
        minWidth: w,
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: semantic.surface.chrome,
        color: semantic.text.onChrome,
        fontFamily: scale.font.body,
        transition: "width 180ms ease, min-width 180ms ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: scale.layout.headerHeight,
          padding: `0 ${scale.space.md}px`,
          borderBottom: `${scale.border.thin}px solid ${semantic.border.onChrome}`,
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontFamily: scale.font.display,
              fontSize: scale.fontSize.caption,
              fontWeight: scale.fontWeight.bold,
              whiteSpace: "nowrap",
            }}
          >
            Pure Trade
          </span>
        )}
      </div>

      <div style={{ flex: 1, paddingTop: scale.space.sm }}>
        {items.map((it) => (
          <NavLink key={it.key} item={it} active={it.key === active} collapsed={collapsed} />
        ))}
      </div>

      {footer}

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand" : "Collapse"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: scale.space.md,
            padding: `${scale.space.sm + 2}px ${scale.space.md}px`,
            minHeight: scale.control.minTarget,
            background: "transparent",
            border: "none",
            borderTop: `${scale.border.thin}px solid ${semantic.border.onChrome}`,
            color: semantic.text.onChromeMuted,
            fontFamily: scale.font.body,
            fontSize: scale.control.fontSize,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {collapsed ? "›" : "‹ Collapse"}
        </button>
      )}
    </nav>
  );
}

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const [hot, setHot] = React.useState(false);
  return (
    <a
      href={item.href}
      title={item.label}
      aria-current={active ? "page" : undefined}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: scale.space.md,
        padding: `${scale.space.sm + 2}px ${scale.space.md}px`,
        minHeight: scale.control.minTarget,
        fontSize: scale.control.fontSize,
        fontWeight: active ? scale.fontWeight.bold : scale.fontWeight.regular,
        color: semantic.text.onChrome,
        textDecoration: "none",
        background: active
          ? semantic.interactive.primary
          : hot
            ? semantic.border.onChrome
            : "transparent",
        whiteSpace: "nowrap",
      }}
    >
      {item.icon}
      {!collapsed && <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
    </a>
  );
}

/* ----------------------------------------------------------------------- Card */

export function Card({ children, padded = true, style }: {
  children: React.ReactNode; padded?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: semantic.surface.card,
        border: `${scale.border.thin}px solid ${semantic.border.default}`,
        borderRadius: scale.radius.card,
        padding: padded ? scale.space.lg : 0,
        boxShadow: semantic.elevation.none,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------- Toolbar */

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: scale.space.sm,
        flexWrap: "wrap",
        padding: `${scale.space.md}px 0`,
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------- KpiStrip */

export interface Kpi {
  label: string;
  value: string;
  /** Sub-value under the figure, such as a percentage or unit. */
  note?: string;
  tone?: "default" | "positive" | "negative" | "critical";
}

/**
 * How much room the strip takes.
 *
 * `default` is unchanged from v1.2.2, so no existing board moves.
 *
 * `compact` exists because a strip of four counts is not always the most
 * important thing on the page. On a board whose job is the table underneath
 * it, `default` spends 80px of vertical room to state four numbers, and 33px
 * of that is its own padding. Shipments View asked for a smaller one and the
 * only local way to get it was to override the component, which is the drift
 * this package exists to stop. So the knob belongs here.
 *
 * Every level is built from `space` and `fontSize` steps, so the figure stays
 * on the type scale rather than becoming an in-between size.
 */
const KPI_DENSITY = {
  compact: {
    padY: scale.space.sm,
    padX: scale.space.lg,
    labelGap: scale.space.xxs,
    figure: scale.fontSize.heading,
    minColumn: 120,
  },
  default: {
    padY: scale.space.lg,
    padX: scale.space.xl,
    labelGap: scale.space.xs,
    figure: scale.fontSize.display,
    minColumn: 150,
  },
  relaxed: {
    padY: scale.space.xl,
    padX: scale.space.xxl,
    labelGap: scale.space.xs,
    figure: scale.fontSize.displayLg,
    minColumn: 150,
  },
} as const;

export type KpiDensity = keyof typeof KPI_DENSITY;

export function KpiStrip({
  items,
  density = "default",
}: {
  items: Kpi[];
  /**
   * `compact` for a strip that sits above the content it summarises;
   * `default` for a page's headline figures; `relaxed` for a dashboard whose
   * figures ARE the page.
   */
  density?: KpiDensity;
}) {
  const d = KPI_DENSITY[density];

  const toneColor = (t: Kpi["tone"]) =>
    t === "positive" ? semantic.dataSignal.positive
      : t === "negative" ? semantic.dataSignal.negative
        : t === "critical" ? semantic.dataSignal.critical
          : semantic.text.primary;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(${d.minColumn}px, 1fr))`,
        gap: scale.space.xs,
        background: semantic.surface.card,
        borderBottom: `${scale.border.thin}px solid ${semantic.border.default}`,
        padding: `${d.padY}px ${d.padX}px`,
      }}
    >
      {items.map((k) => (
        <div key={k.label} style={{ textAlign: "center", minWidth: 0 }}>
          <div
            style={{
              fontFamily: scale.font.body,
              fontSize: scale.fontSize.meta,
              // Pinned, like every other line box in this package. Left at
              // `normal` the label's height came from whichever face resolved,
              // so the strip was 2px taller on a machine without Calibri and
              // no density level could promise a height.
              lineHeight: scale.lineHeight.snug,
              color: semantic.text.muted,
              marginBottom: d.labelGap,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {k.label}
          </div>
          <div
            style={{
              fontFamily: scale.font.body,
              fontSize: d.figure,
              fontWeight: scale.fontWeight.bold,
              lineHeight: scale.lineHeight.tight,
              fontVariantNumeric: "tabular-nums lining-nums",
              color: toneColor(k.tone),
            }}
          >
            {k.value}
          </div>
          {k.note && (
            <div
              style={{
                fontFamily: scale.font.body,
                fontSize: scale.fontSize.meta,
                lineHeight: scale.lineHeight.snug,
                color: semantic.text.muted,
                marginTop: scale.space.xxs,
              }}
            >
              {k.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
