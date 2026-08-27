/**
 * Layer 3: Field, Modal, EmptyState, Toast.
 *
 * The pieces every app reinvents slightly differently. Fields in particular: the
 * Sales Pipeline sets inputs to `0.7rem` globally, which renders at 10.5px, then
 * shrinks again under a 92% page transform. These start at the real control size
 * and stay there.
 */

import React from "react";
import { semantic } from "../tokens/semantic.ts";
import { scale } from "../tokens/scale.ts";

/* ------------------------------------------------------------------ TextInput */

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className" | "size"> {
  invalid?: boolean;
  /** Renders on `surface.chrome`, such as a header search box. */
  onChrome?: boolean;
}

export function TextInput({ invalid, onChrome, style, ...rest }: TextInputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <input
      {...rest}
      onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
      style={{
        minHeight: scale.control.height,
        padding: `0 ${scale.space.md}px`,
        fontFamily: scale.font.body,
        fontSize: scale.control.fontSize,
        color: semantic.text.primary,
        background: semantic.surface.card,
        borderRadius: scale.radius.button,
        borderWidth: scale.border.thin,
        borderStyle: "solid",
        borderColor: invalid
          ? semantic.status.danger.solid
          : focused
            ? semantic.border.focus
            : onChrome
              ? "transparent"
              : semantic.border.default,
        outline: focused ? `2px solid ${semantic.interactive.focusRing}` : "none",
        outlineOffset: 1,
        ...style,
      }}
    />
  );
}

/* ---------------------------------------------------------------------- Field */

export interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, hint, error, children }: FieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: scale.space.xs, minWidth: 0 }}>
      <label
        htmlFor={htmlFor}
        style={{
          fontFamily: scale.font.body,
          fontSize: scale.fontSize.meta,
          fontWeight: scale.fontWeight.bold,
          color: semantic.text.muted,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </label>
      {children}
      {(error || hint) && (
        <span
          style={{
            fontFamily: scale.font.body,
            fontSize: scale.fontSize.meta,
            color: error ? semantic.status.danger.fg : semantic.text.muted,
          }}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- Modal */

export interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}

export function Modal({ title, subtitle, onClose, children, footer, width = 720 }: ModalProps) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: semantic.surface.scrim,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: scale.space.huge,
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: width,
          background: semantic.surface.card,
          borderRadius: scale.radius.card,
          boxShadow: semantic.elevation.modal,
          overflow: "hidden",
        }}
      >
        <header
          style={{
            background: semantic.surface.chrome,
            color: semantic.text.onChrome,
            padding: `${scale.space.md}px ${scale.space.xl}px`,
            display: "flex",
            alignItems: "center",
            gap: scale.space.md,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: scale.font.display,
                fontSize: scale.fontSize.heading,
                fontWeight: scale.fontWeight.bold,
                lineHeight: scale.lineHeight.tight,
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <div
                style={{
                  fontFamily: scale.font.body,
                  fontSize: scale.fontSize.meta,
                  color: semantic.text.onChromeMuted,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              marginLeft: "auto",
              minWidth: scale.control.minTarget,
              minHeight: scale.control.minTarget,
              background: "transparent",
              border: "none",
              color: semantic.text.onChrome,
              fontSize: scale.fontSize.bodyLg,
              cursor: "pointer",
            }}
          >
            &times;
          </button>
        </header>

        <div style={{ padding: scale.space.xl, fontFamily: scale.font.body, fontSize: scale.fontSize.body, color: semantic.text.primary }}>
          {children}
        </div>

        {footer && (
          <footer
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: scale.space.sm,
              padding: `${scale.space.md}px ${scale.space.xl}px`,
              borderTop: `${scale.border.thin}px solid ${semantic.border.subtle}`,
              background: semantic.surface.page,
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- EmptyState */

export function EmptyState({ title, message, action }: {
  title: string; message?: string; action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: semantic.surface.card,
        border: `${scale.border.thin}px solid ${semantic.border.default}`,
        borderRadius: scale.radius.card,
        padding: scale.space.huge,
        textAlign: "center",
        fontFamily: scale.font.body,
      }}
    >
      <div
        style={{
          fontSize: scale.fontSize.bodyLg,
          fontWeight: scale.fontWeight.bold,
          color: semantic.text.primary,
          marginBottom: scale.space.xs,
        }}
      >
        {title}
      </div>
      {message && (
        <div style={{ fontSize: scale.fontSize.body, color: semantic.text.muted, marginBottom: scale.space.lg }}>
          {message}
        </div>
      )}
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------------- Toast */

export type ToastTone = "success" | "danger" | "info";

export function Toast({ tone = "info", children, onDismiss }: {
  tone?: ToastTone; children: React.ReactNode; onDismiss?: () => void;
}) {
  const t = semantic.status[tone];
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        bottom: scale.space.lg,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        gap: scale.space.sm,
        padding: `${scale.space.sm + 2}px ${scale.space.lg}px`,
        borderRadius: scale.radius.button,
        border: `${scale.border.thin}px solid ${t.solid}`,
        background: t.bg,
        color: t.fg,
        boxShadow: semantic.elevation.overlay,
        fontFamily: scale.font.body,
        fontSize: scale.fontSize.body,
      }}
    >
      <span>{children}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "inherit", fontSize: scale.fontSize.body, opacity: 0.7,
            minWidth: scale.space.xl, minHeight: scale.space.xl,
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
}
