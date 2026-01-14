import { cn } from "@/lib/utils";
import "./text.css";

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
    <Comp
      style={{
        ["--page-text-light" as never]: `var(--page-color-${color}-content)`,
        ["--page-text-dark" as never]: `var(--page-color-${color})`,
      }}
      className={cn("page-text", className)}
    >
      {children}
    </Comp>
  );
}
