import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "nav" | "section" | "header" | "footer";
};

/** Wspólna szerokość treści i marginesy boczne dla wszystkich sekcji. */
export function Container({ as: Component = "div", className, ...props }: ContainerProps) {
  return <Component className={cn("mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8", className)} {...props} />;
}
