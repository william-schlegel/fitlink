import { getTranslations } from "next-intl/server";
import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { signInAction, signInMagicLinkAction } from "@/actions/auth";
import { Separator } from "@/components/ui/shadcn/separator";
import { Button } from "@/components/ui/shadcn/button";
import { Label } from "@/components/ui/shadcn/label";
import { Input } from "@/components/ui/shadcn/input";

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
      <form action={signInMagicLinkAction} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="email"
              className="after:content-['*'] after:text-error after:ml-0.5"
            >
              {t("signin.my-email")}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-base-content/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("signin.magic-link")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input id="email" type="email" required name="email" />
        </div>
        <Button type="submit" variant="outline" className="w-full">
          {t("signin.connect-with-magic-link")}
        </Button>
      </form>
      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-sm text-primary font-medium">
          {t("signin.or")}
        </span>
        <Separator className="flex-1" />
      </div>
      <form action={signInAction} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="email2"
              className="after:content-['*'] after:text-error after:ml-0.5"
            >
              {t("signin.my-email")}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-base-content/50" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("signin.credentials")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input id="email2" type="email" required name="email" />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="after:content-['*'] after:text-error after:ml-0.5"
          >
            {t("signin.password")}
          </Label>
          <Input id="password" type="password" required name="password" />
        </div>
        <Button type="submit" variant="outline" className="w-full">
          {t("signin.connect-with-account")} {t("signin.local")}
        </Button>
      </form>
    </>
  );
}
