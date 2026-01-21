"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  createContext,
  useContext,
  useDeferredValue,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
} from "react";

import { Input } from "./input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./input-group";

const PasswordInputContext = createContext<{ password: string } | null>(null);

export function PasswordInput({
  children,
  onChange,
  value,
  defaultValue,
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type"> & {
  children?: ReactNode;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(defaultValue ?? "");

  const Icon = showPassword ? EyeOffIcon : EyeIcon;
  const currentValue = value ?? password;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    onChange?.(e);
  };

  return (
    <PasswordInputContext value={{ password: currentValue.toString() }}>
      <div className="space-y-3">
        <InputGroup className={className}>
          <InputGroupInput
            {...props}
            value={value}
            defaultValue={defaultValue}
            type={showPassword ? "text" : "password"}
            onChange={handleChange}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              onClick={() => setShowPassword((p) => !p)}
            >
              <Icon className="size-4.5" />
              <span className="sr-only">
                {showPassword
                  ? "afficher le mot de passe"
                  : "masquer le mot de passe"}
              </span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {children}
      </div>
    </PasswordInputContext>
  );
}

type PasswordInputStrengthCheckerProps = {
  rules?: Partial<{
    minLength: { value: number; label: string };
    maxLength: { value: number; label: string };
    uppercase: { value: boolean; label: string };
    lowercase: { value: boolean; label: string };
    numbers: { value: boolean; label: string };
    symbols: { value: boolean; label: string };
  }>;
};

export function PasswordInputStrengthChecker({
  rules,
}: PasswordInputStrengthCheckerProps) {
  const { password } = usePasswordInput();
  const deferredPassword = useDeferredValue(password);
  if (deferredPassword.length === 0) return null;
  const strengthResult = {
    minLength:
      deferredPassword.length < (rules?.minLength?.value ?? 0) ? false : true,
    maxLength:
      deferredPassword.length > (rules?.maxLength?.value ?? Number.MAX_VALUE)
        ? false
        : true,
    uppercase: rules?.uppercase?.value
      ? /([A-Z])/.test(deferredPassword)
      : true,
    lowercase: rules?.lowercase?.value
      ? /([a-z])/.test(deferredPassword)
      : true,
    numbers: rules?.numbers?.value ? /([0-9])/.test(deferredPassword) : true,
    symbols: rules?.symbols?.value
      ? /([!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(deferredPassword)
      : true,
  };

  const passwordOk = Object.values(strengthResult).every(
    (value) => value === true,
  );

  if (passwordOk) return null;

  return (
    <div className="text-sm text-destructive flex flex-col gap-1">
      {rules?.minLength?.label && !strengthResult.minLength && (
        <p>{rules.minLength.label}</p>
      )}
      {rules?.maxLength?.label && !strengthResult.maxLength && (
        <p>{rules.maxLength.label}</p>
      )}
      {rules?.uppercase?.label && !strengthResult.uppercase && (
        <p>{rules.uppercase.label}</p>
      )}
      {rules?.lowercase?.label && !strengthResult.lowercase && (
        <p>{rules.lowercase.label}</p>
      )}
      {rules?.numbers?.label && !strengthResult.numbers && (
        <p>{rules.numbers.label}</p>
      )}
      {rules?.symbols?.label && !strengthResult.symbols && (
        <p>{rules.symbols.label}</p>
      )}
    </div>
  );
}

const usePasswordInput = () => {
  const context = useContext(PasswordInputContext);
  if (context == null) {
    throw new Error(
      "usePasswordInput must be used within a PasswordInputContext",
    );
  }
  return context;
};
