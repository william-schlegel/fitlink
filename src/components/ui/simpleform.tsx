"use client";

import {
  type FormEventHandler,
  Fragment,
  type ReactNode,
  type HTMLInputTypeAttribute,
} from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/shadcn/input";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Label } from "@/components/ui/shadcn/label";
import { Textarea } from "@/components/ui/shadcn/textarea";
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
      className={cn(
        "grid grid-cols-[auto_1fr] gap-2 items-start",
        className,
      )}
      onSubmit={typeof onSubmit === "function" ? (e) => onSubmit(e) : undefined}
    >
      {isLoading ? (
        <Spinner />
      ) : (
        fields.map((field) => {
          const fn = field.name as string;
          const isTextArea = field.rows && !isNaN(field.rows) && field.rows > 1;
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
            <Fragment key={fn}>
              {field.type === "checkbox" ? (
                <div className="col-span-2 flex items-center space-x-3">
                  <Checkbox
                    id={fn}
                    {...register(fn as Path<T>)}
                    defaultChecked={false}
                  />
                  <Label
                    htmlFor={fn}
                    className={cn(
                      "cursor-pointer",
                      field.required && "after:content-['*'] after:text-error after:ml-0.5"
                    )}
                  >
                    {field.label}
                  </Label>
                </div>
              ) : (
                <>
                  {field.label !== undefined ? (
                    <Label
                      className={cn(
                        field.required && "after:content-['*'] after:text-error after:ml-0.5",
                        isTextArea && "self-start"
                      )}
                    >
                      {field.label}
                    </Label>
                  ) : null}
                  <div
                    className={field.label === undefined ? "col-span-2" : ""}
                  >
                    {field.component ? (
                      field.component
                    ) : field.unit !== undefined ? (
                      <div className="flex items-center gap-2">
                        <Input
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
                        <span className="text-sm text-base-content/70">{field.unit}</span>
                      </div>
                    ) : isTextArea ? (
                      <Textarea
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
                    <TextError
                      err={errors?.[fn]?.message as string | undefined}
                    />
                  </div>
                </>
              )}
            </Fragment>
          );
        })
      )}
      {children}
    </form>
  );
}

type TextErrorProps = { err: string | undefined };

export function TextError({ err }: TextErrorProps) {
  const t = useTranslations("common");
  if (!err) return null;
  const msg = err || t("navigation.required") || "Error";

  return <p className="text-sm text-error mt-1">{msg}</p>;
}
