import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowRightIcon } from "./icons";

type Variant = "primary" | "secondary" | "inverse" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group/button inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-ink-900 text-white shadow-button hover:bg-ink-700",
  secondary:
    "border border-line-strong bg-surface/80 text-ink-900 backdrop-blur-sm hover:border-ink-400 hover:bg-surface",
  inverse: "bg-white text-ink-900 shadow-button hover:bg-surface-sunken",
  ghost: "text-accent hover:text-accent-strong",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-[52px] px-8 text-[15px]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Strzałka po prawej, jak w przyciskach z referencji. */
  withArrow?: boolean;
  children: ReactNode;
};

export function buttonClassName({ variant = "primary", size = "md", className }: { variant?: Variant; size?: Size; className?: string }) {
  return cn(base, variants[variant], sizes[size], className);
}

function Content({ children, withArrow }: Pick<CommonProps, "children" | "withArrow">) {
  return (
    <>
      <span>{children}</span>
      {withArrow ? (
        <ArrowRightIcon size={16} className="transition-transform duration-200 group-hover/button:translate-x-0.5" />
      ) : null}
    </>
  );
}

export function Button({
  variant,
  size,
  withArrow,
  className,
  children,
  type = "button",
  ...props
}: CommonProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button type={type} className={buttonClassName({ variant, size, className })} {...props}>
      <Content withArrow={withArrow}>{children}</Content>
    </button>
  );
}

/** Przycisk-link do kotwic na stronie lub innych adresów. */
export function ButtonLink({
  variant,
  size,
  withArrow,
  className,
  children,
  ...props
}: CommonProps & ComponentPropsWithoutRef<"a">) {
  return (
    <a className={buttonClassName({ variant, size, className })} {...props}>
      <Content withArrow={withArrow}>{children}</Content>
    </a>
  );
}
