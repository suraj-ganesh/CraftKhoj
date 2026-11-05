type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Optional explicit width (CSS value). Defaults to 100%. */
  width?: string;
  /** Optional explicit height (CSS value). Defaults to 1em. */
  height?: string;
  /** Rounded corners variant. */
  rounded?: "none" | "sm" | "md" | "full";
};

const radiusClasses = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  full: "rounded-full",
} as const;

/**
 * A single shimmering skeleton block used to represent pending content.
 *
 * Renders a muted paper rectangle with a slow, left-to-right gradient sweep.
 * Pair with `SkeletonGroup` to lay out matching field skeletons.
 */
export function Skeleton({
  width = "100%",
  height = "1em",
  rounded = "md",
  className = "",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden bg-[var(--paper)] border-2 border-[var(--forest)] ${radiusClasses[rounded]} before:content-[''] before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-[var(--mint)] before:to-transparent before:animate-shimmer ${className}`}
      style={{ width, height }}
      aria-busy="true"
      {...props}
    />
  );
}

type SkeletonGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Number of skeleton children to render when none are provided. */
  count?: number;
  /** Gap between children (Tailwind spacing utility). */
  gap?: string;
};

/**
 * A flex column container that stacks skeleton blocks evenly.
 * Useful for representing a form field (label + input) or a list row.
 */
export function SkeletonGroup({
  count = 1,
  gap = "gap-3",
  className = "",
  children,
  ...props
}: SkeletonGroupProps) {
  if (children) {
    return (
      <div className={`flex flex-col ${gap} ${className}`} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${gap} ${className}`} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} />
      ))}
    </div>
  );
}

/** A skeleton that mimics a short label line (label + value). */
export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <SkeletonGroup gap="gap-2" className={className}>
      <Skeleton width="30%" height="0.75em" rounded="sm" />
      <Skeleton width="80%" height="1.1em" rounded="md" />
    </SkeletonGroup>
  );
}

/** A skeleton that mimics a form field: a label + an input box. */
export function SkeletonField({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Skeleton width="28%" height="0.7em" rounded="sm" />
      <Skeleton width="100%" height="2.75em" rounded="md" />
    </div>
  );
}

/** A skeleton that mimics a two-column form grid row. */
export function SkeletonGridRow({ cols = 2, className = "" }: { cols?: number; className?: string }) {
  return (
    <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonField key={i} />
      ))}
    </div>
  );
}

/** A skeleton that mimics a button. */
export function SkeletonButton({ className = "" }: { className?: string }) {
  return <Skeleton width="100%" height="3.1em" rounded="md" className={className} />;
}