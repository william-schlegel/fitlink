"use client";

import {
  type FormEventHandler,
  Fragment,
  type ReactNode,
  type HTMLInputTypeAttribute,
} from "react";
import { useTranslations } from "next-intl";

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSet,
} from "@/components/ui/shadcn/field";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Input } from "@/components/ui/shadcn/input";
import { cn } from "@/lib/utils";

import Spinner from "./spinner";

import type {
  UseFormRegister,
  FieldErrors,
  Path,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";

type SimpleFormField<T> = {
  label?: string;
  name: Path<T>;
  required?: boolean | string;
  component?: ReactNode;
  type?: HTMLInputTypeAttribute;
  disabled?: boolean;
  unit?: string;
  rows?: number;
};

type SimpleFormProps<T extends FieldValues> = {
  fields: SimpleFormField<T>[];
  errors?: FieldErrors<T>;
  register: UseFormRegister<T>;
  onSubmit?: FormEventHandler<HTMLFormElement> | undefined;
  children?: ReactNode;
  className?: string;
  isLoading?: boolean;
  intialData?: T;
};

export default function SimpleForm<T extends FieldValues>({
  fields,
  errors,
  register,
  onSubmit,
  children,
  className = "",
  isLoading = false,
}: SimpleFormProps<T>): ReactNode {
  return (
    <form
      className={cn(className)}
      onSubmit={typeof onSubmit === "function" ? (e) => onSubmit(e) : undefined}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <FieldSet className="space-y-6">
          <FieldGroup>
            {fields.map((field) => {
              const fn = field.name as string;
              const isTextArea =
                field.rows && !isNaN(field.rows) && field.rows > 1;
              const requiredOption =
                field.required === true
                  ? true
                  : typeof field.required === "string"
                    ? field.required
                    : undefined;

              const inputRegisterOptions = {
                ...(requiredOption !== undefined
                  ? { required: requiredOption }
                  : {}),
                ...(field.type === "date" ? { valueAsDate: true } : {}),
                ...(field.type === "number" ? { valueAsNumber: true } : {}),
              } as const;

              const textareaRegisterOptions = {
                ...(requiredOption !== undefined
                  ? { required: requiredOption }
                  : {}),
              } as const;

              return (
                <Field
                  key={fn}
                  orientation={
                    field.type === "checkbox" ? "horizontal" : "vertical"
                  }
                >
                  {field.type === "checkbox" ? (
                    <>
                      <Checkbox
                        id={fn}
                        {...register(fn as Path<T>)}
                        defaultChecked={false}
                      />
                      <FieldLabel
                        htmlFor={fn}
                        className={cn(
                          "cursor-pointer font-normal",
                          field.required &&
                            "after:content-['*'] after:text-error after:ml-0.5",
                        )}
                      >
                        {field.label}
                      </FieldLabel>
                    </>
                  ) : field.component ? (
                    <div className="col-span-2">{field.component}</div>
                  ) : (
                    <>
                      {field.label !== undefined ? (
                        <FieldLabel
                          htmlFor={fn}
                          className={cn(
                            field.required &&
                              "after:content-['*'] after:text-error after:ml-0.5",
                          )}
                        >
                          {field.label}
                        </FieldLabel>
                      ) : null}
                      {field.unit !== undefined ? (
                        <div className="flex items-center gap-2">
                          <Input
                            id={fn}
                            {...register(
                              fn as Path<T>,
                              inputRegisterOptions as unknown as RegisterOptions<
                                T,
                                Path<T>
                              >,
                            )}
                            type={field.type || "text"}
                            disabled={field.disabled}
                            className="w-auto flex-1"
                          />
                          <span className="text-sm text-base-content/70">
                            {field.unit}
                          </span>
                        </div>
                      ) : isTextArea ? (
                        <Textarea
                          id={fn}
                          {...register(
                            fn as Path<T>,
                            textareaRegisterOptions as unknown as RegisterOptions<
                              T,
                              Path<T>
                            >,
                          )}
                          disabled={field.disabled}
                          rows={field.rows}
                        />
                      ) : (
                        <Input
                          id={fn}
                          {...register(
                            fn as Path<T>,
                            inputRegisterOptions as unknown as RegisterOptions<
                              T,
                              Path<T>
                            >,
                          )}
                          type={field.type || "text"}
                          disabled={field.disabled}
                        />
                      )}
                      {errors?.[fn]?.message ? (
                        <FieldError>{errors[fn]?.message as string}</FieldError>
                      ) : null}
                    </>
                  )}
                </Field>
              );
            })}
          </FieldGroup>
        </FieldSet>
      )}
      {children}
    </form>
  );
}

// TextError is no longer needed as FieldError is used instead
