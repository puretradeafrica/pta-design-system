/**
 * Layer 3: Badge and StatusPill
 *
 * Both take an EXPLICIT state. Neither ever infers colour from text.
 *
 * The Sales Pipeline derives status colour by running five regular expressions
 * over free text. "Blocked" matches none of them, so it falls through to the
 * neutral grey also used for "Not required", and a blocked deal renders as a deal
 * with nothing to do. Passing a state instead of a string makes that class of bug
 * impossible.
 */

import React from "react";
import { semantic, type DealState } from "../tokens/semantic.ts";
import { scale } from "../tokens/scale.ts";

export type BadgeTone = "success" | "danger" | "warning" | "info" | "neutral";

export interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  /** Saturated fill with white text. For counts and emphatic markers only. */
  solid?: boolean;
  title?: string;
}

export function Badge({ tone = "neutral", solid = false, children, title }: BadgeProps) {
  const t = semantic.status[tone];
  return (
    <span
      title={title}
      style={{
        display: "inline-block",
        padding: `${scale.space.xxs}px ${scale.space.sm}px`,
        borderRadius: scale.radius.badge,
        fontFamily: scale.font.body,
        fontSize: scale.fontSize.meta,
        fontWeight: scale.fontWeight.bold,
        lineHeight: scale.lineHeight.snug,
        whiteSpace: "nowrap",
        background: solid ? t.solid : t.bg,
        color: solid ? semantic.surface.card : t.fg,
      }}
    >
      {children}
    </span>
  );
}

/** Maps a deal state to the tone that represents it. One place, one mapping. */
const STATE_TONE: Record<DealState, BadgeTone> = {
  confirmed: "success",
  pending: "warning",
  blocked: "danger",
  notRequired: "neutral",
  unknown: "neutral",
};

export interface StatusPillProps {
  state: DealState;
  label: string;
  title?: string;
}

/**
 * A deal's Sales, Stock or Transport status.
 *
 * `notRequired` and `unknown` share the neutral tone deliberately: both genuinely
 * mean "nothing to do here". `blocked` does not, which is the whole point.
 */
export function StatusPill({ state, label, title }: StatusPillProps) {
  return <Badge tone={STATE_TONE[state]} title={title}>{label}</Badge>;
}

export interface StagePillProps {
  label: string;
  /** The stage's dot colour. Stages are a domain sequence, not a status. */
  color: string;
}

/**
 * A pipeline stage.
 *
 * Kept separate from StatusPill because a stage is a position in a sequence, not
 * a judgement. Colouring stages as success or danger would say something untrue
 * about a deal that is simply early.
 */
export function StagePill({ label, color }: StagePillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: scale.space.xs + 2,
        padding: `${scale.space.xxs + 1}px ${scale.space.sm + 1}px`,
        borderRadius: scale.radius.pill,
        background: semantic.surface.inset,
        color: semantic.text.secondary,
        fontFamily: scale.font.body,
        fontSize: scale.fontSize.meta,
        fontWeight: scale.fontWeight.bold,
        lineHeight: scale.lineHeight.tight,
        whiteSpace: "nowrap",
      }}
    >
      <span
        aria-hidden
        style={{ width: 7, height: 7, borderRadius: scale.radius.pill, background: color, flex: "none" }}
      />
      {label}
    </span>
  );
}

export interface AvatarProps {
  name: string | null;
  initials?: string | null;
  size?: number;
}

/** Trader initials. Derives initials from the name when none are supplied. */
export function Avatar({ name, initials, size = 24 }: AvatarProps) {
  const text =
    initials ||
    (name ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?");
  return (
    <span
      title={name ?? undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "none",
        borderRadius: scale.radius.pill,
        background: semantic.interactive.primary,
        color: semantic.interactive.primaryText,
        fontFamily: scale.font.body,
        fontSize: scale.fontSize.meta,
        fontWeight: scale.fontWeight.bold,
        lineHeight: 1,
      }}
    >
      {text}
    </span>
  );
}
