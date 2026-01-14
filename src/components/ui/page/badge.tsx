import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

const pageBadgeVariants = cva(
  "gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-(--page-color-error)/20 aria-invalid:border-(--page-color-error) transition-colors overflow-hidden group/badge max-w-full",
  {
    variants: {
      variant: {
        default:
          "bg-(--page-color-primary) text-(--page-color-primary-content) [a]:hover:bg-(--page-color-primary)/80",
        secondary:
          "bg-(--page-color-secondary) text-(--page-color-secondary-content) [a]:hover:bg-(--page-color-secondary)/80",
        destructive:
          "bg-(--page-color-error) [a]:hover:bg-(--page-color-error)/80 focus-visible:ring-(--page-color-error)/40  text-(--page-color-error-content)",
        success:
          "bg-(--page-color-success) [a]:hover:bg-(--page-color-success)/80 focus-visible:ring-(--page-color-success)/40 text-(--page-color-success-content)",
        warning:
          "bg-(--page-color-warning) [a]:hover:bg-(--page-color-warning)/80 focus-visible:ring-(--page-color-warning)/40 text-(--page-color-warning-content)",
        info: "bg-(--page-color-info) [a]:hover:bg-(--page-color-info)/80 focus-visible:ring-(--page-color-info)/40 text-(--page-color-info-content)",
        outline:
          "border-border text-(--page-color-base-content) [a]:hover:bg-(--page-color-base-200) [a]:hover:text-(--page-color-base-content)",
        ghost:
          "hover:bg-(--page-color-base-200) hover:text-(--page-color-base-content)",
        link: "text-(--page-color-primary) underline-offset-4 hover:underline",
      },
      size: {
        xl: "h-24 gap-2 px-6 py-4 text-base [&>svg]:size-6",
        lg: "h-16 gap-1.5 px-3 py-2 text-sm [&>svg]:size-4",
        md: "h-10 [&>svg]:size-3",
        sm: "h-8 [&>svg]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

function PageBadge({
  className,
  variant = "default",
  size = "md",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof pageBadgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(pageBadgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { PageBadge, pageBadgeVariants as badgeVariants };
