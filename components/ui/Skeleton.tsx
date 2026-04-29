import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "bg-gradient-to-r from-cream-200 via-cream-100 to-cream-200 bg-[length:700px_100%] animate-shimmer",
        {
          "rounded": rounded === "sm",
          "rounded-lg": rounded === "md",
          "rounded-xl": rounded === "lg",
          "rounded-full": rounded === "full",
        },
        className
      )}
    />
  );
}

export function NFTCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
      <Skeleton className="w-full aspect-square" rounded="sm" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-1/3 mt-3" />
      </div>
    </div>
  );
}
