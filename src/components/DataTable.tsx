/**
 * Layer 3: DataTable
 *
 * The component that most justifies a component library rather than tokens alone.
 * Tokens stop the wrong colour; only a shared table stops two builders producing
 * two different tables.
 *
 * It fixes the board's worst structural defect. The Sales Pipeline renders each
 * stage group as its own `<table>` with `table-layout: auto`, so column widths are
 * computed per group and Deal, Client and Value sit at different x-positions in
 * every group. Measured on real data, columns drift by up to 64px down the board,
 * which breaks vertical scanning entirely.
 *
 * Here, every group shares ONE column template and `table-layout: fixed`, so the
 * drift is structurally zero. A builder cannot reintroduce it without deleting the
 * component.
 */

import React from "react";
import { semantic } from "../tokens/semantic.ts";
import { scale } from "../tokens/scale.ts";

export type Align = "left" | "right";
export type Density = keyof typeof scale.density;

export interface Column<Row> {
  key: string;
  header: string;
  /** Percentage or px. Shared across every group, which is what fixes alignment. */
  width: string;
  align?: Align;
  /**
   * Right-aligns and switches on tabular figures, so digits line up down the
   * column. Stays in the body face: Carlito's figures are already tabular and
   * lining, so no separate mono is needed and the row keeps one texture.
   */
  numeric?: boolean;
  render: (row: Row) => React.ReactNode;
}

export interface TableGroup<Row> {
  id: string;
  label: string;
  /** Stage colour for the group dot. */
  color: string;
  /** Total in this group, which may exceed the rows shown. */
  count: number;
  rows: Row[];
}

export interface DataTableProps<Row> {
  columns: Column<Row>[];
  groups: TableGroup<Row>[];
  getRowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  density?: Density;
  /** Minimum table width before the container scrolls sideways. */
  minWidth?: number;
  /**
   * Overrides the density's reserved row height. Needed when a cell stacks
   * content vertically, such as a stage pill above its action buttons, which
   * needs more than the two text lines the density reserves.
   */
  rowHeight?: number;
  emptyMessage?: string;
}

export function DataTable<Row>({
  columns,
  groups,
  getRowKey,
  onRowClick,
  density = "default",
  minWidth = 1180,
  rowHeight,
  emptyMessage = "Nothing to show.",
}: DataTableProps<Row>) {
  const base = scale.density[density];
  const d = rowHeight ? { ...base, rowHeight } : base;

  if (groups.length === 0) {
    return (
      <div
        style={{
          background: semantic.surface.card,
          border: `${scale.border.thin}px solid ${semantic.border.default}`,
          borderRadius: scale.radius.card,
          padding: scale.space.huge,
          textAlign: "center",
          color: semantic.text.muted,
          fontFamily: scale.font.body,
          fontSize: scale.fontSize.body,
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: scale.space.xl }}>
      {groups.map((g) => (
        <section
          key={g.id}
          style={{
            background: semantic.surface.card,
            border: `${scale.border.thin}px solid ${semantic.border.default}`,
            borderRadius: scale.radius.card,
            overflow: "hidden",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              gap: scale.space.sm,
              padding: `${scale.space.sm}px ${scale.space.md}px`,
              borderBottom: `${scale.border.thin}px solid ${semantic.border.subtle}`,
            }}
          >
            <span
              aria-hidden
              style={{ width: 9, height: 9, borderRadius: scale.radius.pill, background: g.color, flex: "none" }}
            />
            <h2
              style={{
                margin: 0,
                fontFamily: scale.font.body,
                fontSize: scale.fontSize.body,
                fontWeight: scale.fontWeight.bold,
                color: semantic.text.heading,
                lineHeight: scale.lineHeight.tight,
              }}
            >
              {g.label}
            </h2>
            <span
              style={{
                fontFamily: scale.font.body,
                fontSize: scale.fontSize.meta,
                color: semantic.text.faint,
              }}
            >
              {g.count}
            </span>
          </header>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth,
                borderCollapse: "collapse",
                // Fixed layout plus a shared colgroup is what pins the columns.
                tableLayout: "fixed",
                fontFamily: scale.font.body,
                fontSize: d.fontSize,
                color: semantic.text.primary,
                lineHeight: scale.lineHeight.snug,
              }}
            >
              <colgroup>
                {columns.map((c) => (
                  <col key={c.key} style={{ width: c.width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      scope="col"
                      style={{
                        textAlign: c.align ?? (c.numeric ? "right" : "left"),
                        padding: `${scale.space.sm}px ${d.cellPaddingX}px`,
                        borderBottom: `${scale.border.thin}px solid ${semantic.border.subtle}`,
                        fontSize: scale.fontSize.meta,
                        fontWeight: scale.fontWeight.bold,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: semantic.text.muted,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.rows.map((row) => (
                  <Row
                    key={getRowKey(row)}
                    row={row}
                    columns={columns}
                    density={d}
                    onClick={onRowClick}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function Row<R>({
  row, columns, density, onClick,
}: {
  row: R;
  columns: Column<R>[];
  density: (typeof scale.density)[Density];
  onClick?: (row: R) => void;
}) {
  const [hot, setHot] = React.useState(false);
  const clickable = Boolean(onClick);

  return (
    <tr
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onClick={clickable ? () => onClick!(row) : undefined}
      style={{
        background: hot && clickable ? semantic.surface.hover : "transparent",
        cursor: clickable ? "pointer" : "default",
        // Reserved two-line height, so a row with a wrapping client name and one
        // without are the same height.
        height: density.rowHeight,
      }}
    >
      {columns.map((c) => (
        <td
          key={c.key}
          style={{
            padding: `${density.rowPaddingY}px ${density.cellPaddingX}px`,
            borderBottom: `${scale.border.thin}px solid ${semantic.border.subtle}`,
            textAlign: c.align ?? (c.numeric ? "right" : "left"),
            verticalAlign: "middle",
            // Body face, tabular figures. No font swap, no slashed zero, and no
            // optical correction to get wrong.
            fontVariantNumeric: c.numeric ? "tabular-nums lining-nums" : undefined,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {c.render(row)}
        </td>
      ))}
    </tr>
  );
}

/**
 * Two lines in one cell: a value with its qualifier underneath.
 * Used for the deal number and its sourcing structure.
 */
/**
 * A figure inside a non-numeric cell, such as a value sitting beside a label.
 * Switches on tabular figures without changing face or size.
 */
export function Num({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      style={{
        fontVariantNumeric: "tabular-nums lining-nums",
        color: tone,
      }}
    >
      {children}
    </span>
  );
}

export function CellStack({
  primary, secondary,
}: { primary: React.ReactNode; secondary?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
      <span
        style={{
          fontWeight: scale.fontWeight.bold,
          color: semantic.text.heading,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {primary}
      </span>
      {secondary != null && (
        <span
          style={{
            fontSize: scale.fontSize.meta,
            color: semantic.text.faint,
            whiteSpace: "nowrap",
          }}
        >
          {secondary}
        </span>
      )}
    </div>
  );
}

/** The one true way to render a missing value. Never an empty cell. */
export function Empty() {
  return <span style={{ color: semantic.text.faint }}>&mdash;</span>;
}
