import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { signInAction, signInMagicLinkAction } from "@/actions/auth";
import { Field, FieldLabel } from "@/components/ui/shadcn";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import {
  PasswordInput,
  PasswordInputStrengthChecker,
} from "@/components/ui/shadcn/password-input";
import { Separator } from "@/components/ui/shadcn/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";

export default async function FormEmail({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const t = await getTranslations("auth");
  const error = searchParams ? (await searchParams)?.error : undefined;

  return (
    <>
      {error && (
        <div className="rounded-md bg-error/10 border border-error p-3 text-error text-sm">
          {error}
        </div>
      )}
      <form action={signInAction} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="email2">
            {t("signin.my-email")}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-[hsl(var(--foreground)/0.5)]" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("signin.credentials")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FieldLabel>

          <Input
            id="email2"
            type="email"
            required
            name="email"
            className="bg-background text-foreground"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">{t("signin.password")}</FieldLabel>
          <PasswordInput
            id="password"
            required
            name="password"
            className="bg-background text-foreground"
          >
            <PasswordInputStrengthChecker
              rules={{
                minLength: {
                  value: 8,
                  label: t("signin.password-min-length", { min: 8 }),
                },

                // uppercase: {
                //   value: true,
                //   label: t("signin.password-uppercase"),
                // },
                lowercase: {
                  value: true,
                  label: t("signin.password-lowercase"),
                },
              }}
            />
          </PasswordInput>
        </Field>
        <Button type="submit" className="w-full">
          {t("signin.connect-with-account")} {t("signin.local")}
        </Button>
      </form>
      <Separator>{t("signin.or")}</Separator>
      <form action={signInMagicLinkAction} className="space-y-4">
        <Field>
          <FieldLabel htmlFor="email">
            {t("signin.my-email")}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-[hsl(var(--foreground)/0.5)]" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("signin.magic-link")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FieldLabel>
          <Input
            id="email"
            type="email"
            required
            name="email"
            className="bg-background text-foreground"
          />
        </Field>
        <Button type="submit" className="w-full">
          {t("signin.connect-with-magic-link")}
        </Button>
      </form>
    </>
  );
}
