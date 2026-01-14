import { cn } from "@/lib/utils";

export default function PageText({
  children,
  className,
  level = "p",
  color = "base",
}: {
  children: React.ReactNode;
  className?: string;
  level?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  color?:
    | "base"
    | "primary"
    | "secondary"
    | "accent"
    | "neutral"
    | "info"
    | "success"
    | "warning"
    | "error";
}) {
  const Comp = level;
  return (
    <Comp className={cn(`text-(--page-color-${color}-content)`, className)}>
      {children}
    </Comp>
  );
}
