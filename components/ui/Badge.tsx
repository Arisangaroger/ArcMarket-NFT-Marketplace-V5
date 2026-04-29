import { clsx } from "clsx";
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "sky" | "violet" | "sage" | "amber" | "coral" | "gray";
  size?: "sm" | "md";
  className?: string;
}

export function Badge({ children, variant = "gray", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-sans font-medium rounded-full",
        {
          "text-xs px-2 py-0.5": size === "sm",
          "text-sm px-3 py-1": size === "md",
          "bg-sky-100 text-sky-700": variant === "sky",
          "bg-violet-100 text-violet-700": variant === "violet",
          "bg-sage-100 text-sage-700": variant === "sage",
          "bg-amber-100 text-amber-700": variant === "amber",
          "bg-coral-100 text-coral-700": variant === "coral",
          "bg-cream-200 text-cream-700": variant === "gray",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
