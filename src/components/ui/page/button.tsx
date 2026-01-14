import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

const pageButtonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-(--page-color-error)/20 dark:aria-invalid:ring-(--page-color-error)/40 aria-invalid:border-(--page-color-error) dark:aria-invalid:border-(--page-color-error)/50 rounded-(--page-radius-box) border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-(--page-color-primary) text-(--page-color-primary-content) [a]:hover:bg-(--page-color-primary)/80",
        outline:
          "border-border bg-(--page-color-base-200) hover:bg-(--page-color-base-300) hover:text-(--page-color-base-content) dark:bg-(--page-color-base-200)/30 dark:border-(--page-color-base-200) dark:hover:bg-(--page-color-base-200)/50 aria-expanded:bg-(--page-color-base-200) aria-expanded:text-(--page-color-base-content)",
        secondary:
          "bg-(--page-color-secondary) text-(--page-color-secondary-content) hover:bg-(--page-color-secondary)/80 aria-expanded:bg-(--page-color-secondary) aria-expanded:text-(--page-color-secondary-content)",
        ghost:
          "hover:bg-(--page-color-base-200) hover:text-(--page-color-base-content) dark:hover:bg-(--page-color-base-200)/50 aria-expanded:bg-(--page-color-base-200) aria-expanded:text-(--page-color-base-content)",
        destructive:
          "bg-(--page-color-error)/10 hover:bg-(--page-color-error)/20 focus-visible:ring-(--page-color-error)/20 dark:focus-visible:ring-(--page-color-error)/40 dark:bg-(--page-color-error)/20 text-(--page-color-error) focus-visible:border-(--page-color-error)/40 dark:hover:bg-(--page-color-error)/30",
        success:
          "bg-(--page-color-success)/10 hover:bg-(--page-color-success)/20 focus-visible:ring-(--page-color-success)/20 dark:focus-visible:ring-(--page-color-success)/40 dark:bg-(--page-color-success)/20 text-(--page-color-success) focus-visible:border-(--page-color-success)/40 dark:hover:bg-(--page-color-success)/30",
        link: "text-(--page-color-primary) underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--page-radius-box),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--page-radius-box),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-(--page-radius-box) has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xl: "h-10 gap-2 px-3 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--page-radius-box),10px)] in-data-[slot=button-group]:rounded-(--page-radius-box) [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--page-radius-box),12px)] in-data-[slot=button-group]:rounded-(--page-radius-box)",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function PageButton({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof pageButtonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(pageButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { PageButton, pageButtonVariants };
