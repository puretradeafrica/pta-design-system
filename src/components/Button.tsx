/**
 * Layer 3: Button
 *
 * Variants exist so that emphasis is a decision the design system makes once,
 * not a decision each builder makes per screen.
 *
 * `won` and `lost` are deliberately QUIET at rest and commit to colour on hover.
 * The Sales Pipeline currently ships them as solid #16A34A and #DC2626 fills in
 * every Quote Submitted row, which makes the buttons the highest-contrast thing
 * on the board and pulls the eye off the deal values. Destructive and decisive
 * actions should be findable, not loud.
 */

import React from "react";
import { semantic } from "../tokens/semantic.ts";
import { scale } from "../tokens/scale.ts";

export type ButtonVariant =
  | "primary" | "secondary" | "ghost" | "onChrome" | "won" | "lost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Fills the width of its container. For form footers and empty states. */
  block?: boolean;
}

const SIZES: Record<ButtonSize, { height: number; fontSize: number; padX: number }> = {
  sm: { height: scale.control.heightSm, fontSize: scale.fontSize.meta, padX: scale.space.sm },
  md: { height: scale.control.height, fontSize: scale.control.fontSize, padX: scale.control.paddingX },
  lg: { height: scale.control.heightLg, fontSize: scale.fontSize.bodyLg, padX: scale.space.lg },
};

interface VariantStyle {
  bg: string;
  fg: string;
  border: string;
  hoverBg: string;
  hoverFg: string;
  hoverBorder: string;
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: {
    bg: semantic.interactive.primary, fg: semantic.interactive.primaryText,
    border: semantic.interactive.primary,
    hoverBg: semantic.interactive.primaryHover, hoverFg: semantic.interactive.primaryText,
    hoverBorder: semantic.interactive.primaryHover,
  },
  secondary: {
    bg: semantic.interactive.secondary, fg: semantic.interactive.secondaryText,
    border: semantic.interactive.secondary,
    hoverBg: semantic.surface.chromeAlt, hoverFg: semantic.interactive.secondaryText,
    hoverBorder: semantic.surface.chromeAlt,
  },
  ghost: {
    bg: "transparent", fg: semantic.interactive.ghostText, border: semantic.border.default,
    hoverBg: semantic.interactive.ghostHover, hoverFg: semantic.interactive.ghostText,
    hoverBorder: semantic.border.focus,
  },
  /** Sits on `surface.chrome`, so it inverts. */
  onChrome: {
    bg: semantic.surface.card, fg: semantic.surface.chrome, border: semantic.surface.card,
    hoverBg: semantic.surface.hover, hoverFg: semantic.surface.chrome,
    hoverBorder: semantic.surface.hover,
  },
  won: {
    bg: "transparent", fg: semantic.status.success.fg, border: semantic.status.success.bg,
    hoverBg: semantic.status.success.solid, hoverFg: semantic.surface.card,
    hoverBorder: semantic.status.success.solid,
  },
  lost: {
    bg: "transparent", fg: semantic.status.danger.fg, border: semantic.status.danger.bg,
    hoverBg: semantic.status.danger.solid, hoverFg: semantic.surface.card,
    hoverBorder: semantic.status.danger.solid,
  },
};

export function Button({
  variant = "ghost",
  size = "md",
  block = false,
  disabled,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...rest
}: ButtonProps) {
  const [hot, setHot] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const active = hot && !disabled;

  return (
    <button
      {...rest}
      disabled={disabled}
      onMouseEnter={(e) => { setHot(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHot(false); onMouseLeave?.(e); }}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: scale.space.xs,
        width: block ? "100%" : undefined,
        minHeight: s.height,
        padding: `0 ${s.padX}px`,
        fontFamily: scale.font.body,
        fontSize: s.fontSize,
        fontWeight: scale.fontWeight.bold,
        lineHeight: scale.lineHeight.tight,
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        borderRadius: scale.radius.button,
        borderWidth: scale.border.thin,
        borderStyle: "solid",
        borderColor: disabled ? semantic.border.default : active ? v.hoverBorder : v.border,
        background: disabled ? semantic.interactive.disabledBg : active ? v.hoverBg : v.bg,
        color: disabled ? semantic.interactive.disabledText : active ? v.hoverFg : v.fg,
        outline: focused ? `2px solid ${semantic.interactive.focusRing}` : "none",
        outlineOffset: 2,
        transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
        ...style,
      }}
    />
  );
}
