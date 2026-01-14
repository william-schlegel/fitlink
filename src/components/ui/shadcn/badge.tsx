import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "gap-1 rounded-(--page-radius-box) border border-transparent text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-colors overflow-hidden group/badge",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
        success:
          "bg-success/10 [a]:hover:bg-success/20 focus-visible:ring-success/20 dark:focus-visible:ring-success/40 text-success dark:bg-success/20",
        warning:
          "bg-warning/10 [a]:hover:bg-warning/20 focus-visible:ring-warning/20 dark:focus-visible:ring-warning/40 text-warning dark:bg-warning/20",
        info: "bg-info/10 [a]:hover:bg-info/20 focus-visible:ring-info/20 dark:focus-visible:ring-info/40 text-info dark:bg-info/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },

      size: {
        xl: "h-12 gap-2 px-6 py-4 text-base [&>svg]:size-6",
        lg: "h-8 gap-1.5 px-3 py-2 text-sm [&>svg]:size-4",
        md: "h-5 px-2 py-1 [&>svg]:size-3",
        sm: "h-4 p-1 py-0.5 [&>svg]:size-3",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
export type BadgeSize = VariantProps<typeof badgeVariants>["size"];

function Badge({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
