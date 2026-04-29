import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, padding = "md", className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-white rounded-2xl border border-cream-200",
          hover && "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-cream-300 hover:-translate-y-0.5",
          {
            "p-0": padding === "none",
            "p-3": padding === "sm",
            "p-5": padding === "md",
            "p-7": padding === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
