"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.ComponentProps<"fieldset">
>(({ className, ...props }, ref) => (
  <fieldset
    ref={ref}
    className={cn("space-y-6", className)}
    {...props}
  />
));
FieldSet.displayName = "FieldSet";

const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  React.ComponentProps<"legend"> & {
    variant?: "legend" | "label";
  }
>(({ className, variant = "legend", ...props }, ref) => {
  if (variant === "label") {
    return (
      <legend
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      />
    );
  }
  return (
    <legend
      ref={ref}
      className={cn("text-base font-semibold leading-none", className)}
      {...props}
    />
  );
});
FieldLegend.displayName = "FieldLegend";

const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-6", className)}
    {...props}
  />
));
FieldGroup.displayName = "FieldGroup";

const Field = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    orientation?: "vertical" | "horizontal" | "responsive";
    "data-invalid"?: boolean;
  }
>(({ className, orientation = "vertical", "data-invalid": invalid, ...props }, ref) => {
  const orientationClasses =
    orientation === "horizontal"
      ? "flex-row items-center gap-4"
      : orientation === "responsive"
        ? "@container/field-group flex-col gap-2 md:flex-row md:items-center md:gap-4"
        : "flex-col gap-2";
  
  return (
    <div
      ref={ref}
      role="group"
      data-invalid={invalid}
      className={cn("flex", orientationClasses, invalid && "data-[invalid=true]:text-destructive", className)}
      {...props}
    />
  );
});
Field.displayName = "Field";

const FieldContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5", className)}
    {...props}
  />
));
FieldContent.displayName = "FieldContent";

const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<"label"> & {
    asChild?: boolean;
  }
>(({ className, asChild = false, ...props }, ref) => {
  if (asChild) {
    return <Label ref={ref} className={className} {...props} />;
  }
  return (
    <Label
      ref={ref}
      className={cn(className)}
      {...props}
    />
  );
});
FieldLabel.displayName = "FieldLabel";

const FieldTitle = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
));
FieldTitle.displayName = "FieldTitle";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-base-content/70 text-balance", className)}
    {...props}
  />
));
FieldDescription.displayName = "FieldDescription";

const FieldSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-4", className)}
    {...props}
  >
    <div className="flex-1 border-t border-border" />
        {children && (
      <>
        <span className="text-sm text-base-content/70">{children}</span>
        <div className="flex-1 border-t border-border" />
      </>
    )}
    {!children && <div className="flex-1 border-t border-border" />}
  </div>
));
FieldSeparator.displayName = "FieldSeparator";

const FieldError = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    errors?: Array<{ message?: string } | undefined>;
  }
>(({ className, errors, children, ...props }, ref) => {
  if (errors && errors.length > 0) {
    const errorMessages = errors
      .filter((e): e is { message: string } => e !== undefined && e.message !== undefined)
      .map((e) => e.message);
    
    if (errorMessages.length === 0) return null;
    
    if (errorMessages.length === 1) {
      return (
        <div
          ref={ref}
          className={cn("text-sm text-destructive", className)}
          role="alert"
          {...props}
        >
          {errorMessages[0]}
        </div>
      );
    }
    
    return (
      <ul
        ref={ref as React.ForwardedRef<HTMLUListElement>}
        className={cn("text-sm text-destructive list-disc list-inside space-y-1", className)}
        role="alert"
        {...props}
      >
        {errorMessages.map((message, index) => (
          <li key={index}>{message}</li>
        ))}
      </ul>
    );
  }
  
  if (!children) return null;
  
  return (
    <div
      ref={ref}
      className={cn("text-sm text-destructive", className)}
      role="alert"
      {...props}
    >
      {children}
    </div>
  );
});
FieldError.displayName = "FieldError";

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
};

