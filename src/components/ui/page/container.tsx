import { TThemes } from "@/components/themeSelector";
import { cn } from "@/lib/utils";
import "./pageTheme.css";

export default function PageContainer({
  children,
  theme = "light",
  className,
}: {
  children: React.ReactNode;
  theme?: TThemes;
  className?: string;
}) {
  return (
    <div
      data-theme={theme ?? "light"}
      className={cn(
        "bg-(--page-color-base-100) text-(--page-color-base-content)",
        className,
      )}
    >
      {children}
    </div>
  );
}
