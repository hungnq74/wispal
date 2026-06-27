/**
 * Wispal UI kit — the reusable components from "Wispal Design System.dc.html" §08.
 *
 * Tactile pixel buttons with a chunky bottom edge, soft-bordered night cards, pills,
 * toggles, progress that fills with focus, chips and speech bubbles. Everything is built
 * on the themeable token layer in app/design/design.css, so each ambience reskins the
 * same components. Classes are prefixed `ds-` and scoped under `.ds-root`.
 */
import type { CSSProperties, ReactNode } from "react";
import { PixelIcon, type IconName } from "@/features/design/pixel";

function cx(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

// ── Layout / documentation scaffolding ──────────────────────────────────────────────
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("ds-eyebrow", className)}>{children}</div>;
}

export function SectionHeader({ kicker, title, children }: { kicker: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="ds-section-head">
      <div className="ds-eyebrow">{kicker}</div>
      <h2 className="ds-section-title">{title}</h2>
      {children && <p className="ds-section-sub">{children}</p>}
    </header>
  );
}

export function Card({
  children,
  variant = "light",
  className,
  style,
}: {
  children: ReactNode;
  /** "light" = dawn panel, "night" = signature gradient panel. */
  variant?: "light" | "night";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cx("ds-card", variant === "night" && "ds-card--night", className)} style={style}>
      {children}
    </div>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "locked";

export function Button({
  children,
  variant = "primary",
  icon,
  className,
  type = "button",
  ...rest
}: {
  children: ReactNode;
  variant?: BtnVariant;
  icon?: IconName;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const inkOnAccent = variant === "primary";
  return (
    <button type={type} className={cx("ds-btn", `ds-btn--${variant}`, className)} {...rest} disabled={variant === "locked" || rest.disabled}>
      {icon && <PixelIcon name={icon} color={inkOnAccent ? "var(--on-accent)" : "currentColor"} unit={3} />}
      {children}
    </button>
  );
}

export function IconButton({ icon, label, ...rest }: { icon: IconName; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-label={label} className="ds-btn-icon" {...rest}>
      <PixelIcon name={icon} color="var(--ink)" unit={3} title={label} />
    </button>
  );
}

// ── Pills / segmented choice ─────────────────────────────────────────────────────────
export function Pill({
  children,
  active = false,
  className,
  ...rest
}: { children: ReactNode; active?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={cx("ds-pill", active && "ds-pill--active", className)} aria-pressed={active} {...rest}>
      {children}
    </button>
  );
}

// ── Toggle ───────────────────────────────────────────────────────────────────────────
export function Toggle({
  on,
  accent = "var(--wisp-d)",
  label,
  ...rest
}: { on: boolean; accent?: string; label?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={cx("ds-toggle", on && "ds-toggle--on")}
      style={on ? ({ "--ds-toggle-accent": accent } as CSSProperties) : undefined}
      {...rest}
    >
      <span className="ds-toggle__knob" />
    </button>
  );
}

// ── Progress ──────────────────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = "var(--wisp)", className }: { value: number; color?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cx("ds-progress", className)} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="ds-progress__fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Chips / badges ────────────────────────────────────────────────────────────────────
export function Chip({
  children,
  tone = "outline",
  icon,
  className,
}: {
  children: ReactNode;
  /** outline = on-surface; or fill with an accent token. */
  tone?: "outline" | "wisp" | "glow" | "bloom" | "ember" | "rest";
  icon?: IconName;
  className?: string;
}) {
  const filled = tone !== "outline";
  return (
    <span className={cx("ds-chip", `ds-chip--${tone}`, className)}>
      {icon && <PixelIcon name={icon} color={filled ? "var(--on-accent)" : "var(--ink)"} unit={3} />}
      {children}
    </span>
  );
}

// ── Speech bubble ─────────────────────────────────────────────────────────────────────
export function SpeechBubble({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("ds-bubble", className)}>{children}</div>;
}

// ── Inputs ────────────────────────────────────────────────────────────────────────────
export function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="ds-field-label">{children}</div>;
}

/** A read-only intention field with a blinking wisp caret (showcase representation). */
export function IntentionField({ value }: { value: string }) {
  return (
    <div className="ds-input">
      {value}
      <span className="ds-caret">|</span>
    </div>
  );
}

// ── Swatch (colour docs) ──────────────────────────────────────────────────────────────
export function Swatch({ color, name, hex, note }: { color: string; name: string; hex: string; note?: string }) {
  return (
    <div className="ds-swatch">
      <span className="ds-swatch__chip" style={{ background: color }} />
      <div>
        <div className="ds-swatch__name">{name}</div>
        <div className="ds-swatch__meta">
          {hex}
          {note ? ` · ${note}` : ""}
        </div>
      </div>
    </div>
  );
}

// ── Browser frame (applied screens) ───────────────────────────────────────────────────
export function BrowserFrame({ tab, children }: { tab: string; children: ReactNode }) {
  return (
    <div className="ds-screen">
      <div className="ds-screen__chrome">
        <span className="ds-screen__dots">
          <i /><i /><i />
        </span>
        <span className="ds-screen__tab">{tab}</span>
      </div>
      <div className="ds-screen__body">{children}</div>
    </div>
  );
}
