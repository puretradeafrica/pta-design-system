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

export function KpiStrip({ items }: { items: Kpi[] }) {
  const toneColor = (t: Kpi["tone"]) =>
    t === "positive" ? semantic.dataSignal.positive
      : t === "negative" ? semantic.dataSignal.negative
        : t === "critical" ? semantic.dataSignal.critical
          : semantic.text.primary;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))`,
        gap: scale.space.xs,
        background: semantic.surface.card,
        borderBottom: `${scale.border.thin}px solid ${semantic.border.default}`,
        padding: `${scale.space.lg}px ${scale.space.xl}px`,
      }}
    >
      {items.map((k) => (
        <div key={k.label} style={{ textAlign: "center", minWidth: 0 }}>
          <div
            style={{
              fontFamily: scale.font.body,
              fontSize: scale.fontSize.meta,
              color: semantic.text.muted,
              marginBottom: scale.space.xs,
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
              fontSize: scale.fontSize.display,
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
                color: semantic.text.muted,
                marginTop: 2,
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
