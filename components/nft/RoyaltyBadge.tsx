import { Gem, Info } from "lucide-react";
import { clsx } from "clsx";

interface RoyaltyBadgeProps {
  hasRoyalty: boolean;
  royaltyPercent?: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function RoyaltyBadge({
  hasRoyalty,
  royaltyPercent,
  size = "sm",
  showLabel = true,
  className,
}: RoyaltyBadgeProps) {
  if (!hasRoyalty) {
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1 font-sans rounded-full bg-cream-100 text-cream-500",
          size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
          className
        )}
      >
        <Info size={size === "sm" ? 10 : 12} />
        {showLabel && "No royalties"}
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 font-sans rounded-full bg-violet-100 text-violet-700 font-medium",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
        className
      )}
    >
      <Gem size={size === "sm" ? 10 : 12} />
      {showLabel && royaltyPercent !== undefined
        ? `Creator earns ${royaltyPercent}%`
        : showLabel
        ? "Has royalties"
        : null}
    </span>
  );
}
