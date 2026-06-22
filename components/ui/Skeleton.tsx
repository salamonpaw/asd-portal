export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = "var(--r-sm)",
  className,
  style,
}: {
  width?: string | number;
  height?: number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: `${height}px`,
        borderRadius,
        background: "linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-loading 1.5s infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonText({
  lines = 1,
  gap = 8,
}: {
  lines?: number;
  gap?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? "70%" : "100%"}
        />
      ))}
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--ink-2)",
        borderRadius: "var(--r)",
        padding: 20,
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
      }}
    >
      <Skeleton width={56} height={56} borderRadius="var(--r-sm)" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={14} style={{ marginBottom: 12 }} />
        <Skeleton width="40%" height={28} />
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div
      style={{
        padding: 16,
        borderBottom: "1px solid var(--ink-2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ flex: 1 }}>
        <Skeleton width="40%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={12} />
      </div>
      <Skeleton width={80} height={16} />
    </div>
  );
}
