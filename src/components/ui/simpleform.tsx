"use client";

import type {
  UseFormRegister,
  FieldErrors,
  Path,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";
import {
  type FormEventHandler,
  Fragment,
  type ReactNode,
  type HTMLInputTypeAttribute,
} from "react";
import Spinner from "./spinner";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

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
      className={twMerge(
        "grid grid-cols-[auto_1fr] gap-2 items-start",
        className
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
                <div className="form-control col-span-2">
                  <label
                    className={twMerge(
                      "label cursor-pointer justify-start gap-4",
                      field.required && "required"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="checkbox-primary checkbox"
                      {...register(fn as Path<T>)}
                      defaultChecked={false}
                    />
                    <span className="label-text">{field.label}</span>
                  </label>
                </div>
              ) : (
                <>
                  {field.label !== undefined ? (
                    <label
                      className={twMerge(
                        field.required && "required",
                        isTextArea && "self-start"
                      )}
                    >
                      {field.label}
                    </label>
                  ) : null}
                  <div
                    className={field.label === undefined ? "col-span-2" : ""}
                  >
                    {field.component ? (
                      field.component
                    ) : field.unit !== undefined ? (
                      <div className="input-group items-center">
                        <input
                          {...register(
                            fn as Path<T>,
                            inputRegisterOptions as unknown as RegisterOptions<
                              T,
                              Path<T>
                            >
                          )}
                          type={field.type || "text"}
                          disabled={field.disabled}
                          className="input-bordered input"
                        />
                        <span>{field.unit}</span>
                      </div>
                    ) : isTextArea ? (
                      <textarea
                        {...register(
                          fn as Path<T>,
                          textareaRegisterOptions as unknown as RegisterOptions<
                            T,
                            Path<T>
                          >
                        )}
                        disabled={field.disabled}
                        rows={field.rows}
                      />
                    ) : (
                      <input
                        {...register(
                          fn as Path<T>,
                          inputRegisterOptions as unknown as RegisterOptions<
                            T,
                            Path<T>
                          >
                        )}
                        type={field.type || "text"}
                        disabled={field.disabled}
                        className="input-bordered input w-full"
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

  return <p className="text-sm text-error">{msg}</p>;
}
