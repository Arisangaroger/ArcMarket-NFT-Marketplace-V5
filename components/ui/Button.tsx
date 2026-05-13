import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "violet" | "sage";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-display font-medium rounded-xl transition-all duration-200 select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          {
            // Primary — sky blue
            "bg-sky-500 hover:bg-sky-600 active:scale-95 text-white shadow-sm":
              variant === "primary",
            // Secondary — cream/stone
            "bg-cream-200 hover:bg-cream-300 active:scale-95 text-cream-800 border border-cream-300":
              variant === "secondary",
            // Ghost
            "hover:bg-cream-100 active:scale-95 text-cream-700 border border-cream-200":
              variant === "ghost",
            // Danger
            "bg-coral-500 hover:bg-coral-600 active:scale-95 text-white":
              variant === "danger",
            // Violet — for royalties
            "bg-violet-500 hover:bg-violet-600 active:scale-95 text-white":
              variant === "violet",
            // Sage — for earnings
            "bg-sage-500 hover:bg-sage-600 active:scale-95 text-white":
              variant === "sage",
            // Sizes
            "text-xs px-3 py-1.5 gap-1.5": size === "sm",
            "text-sm px-4 py-2.5": size === "md",
            "text-base px-6 py-3": size === "lg",
            "w-full": fullWidth,
          },
          className
        )}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
