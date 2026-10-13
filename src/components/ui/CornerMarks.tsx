import { cn } from "@/lib/cn";

/**
 * Narożne znaczniki w stylu ramki rysunku technicznego.
 * Rodzic musi mieć `position: relative`.
 */
export function CornerMarks({ className, size = 10 }: { className?: string; size?: number }) {
  const corner = "pointer-events-none absolute border-current";
  const style = { width: size, height: size };
  return (
    <span aria-hidden="true" className={cn("text-line-strong", className)}>
      <span className={cn(corner, "-top-px -left-px border-t border-l")} style={style} />
      <span className={cn(corner, "-top-px -right-px border-t border-r")} style={style} />
      <span className={cn(corner, "-bottom-px -left-px border-b border-l")} style={style} />
      <span className={cn(corner, "-right-px -bottom-px border-r border-b")} style={style} />
    </span>
  );
}
