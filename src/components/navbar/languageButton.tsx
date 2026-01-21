"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { Locale } from "@/i18n";
import "flag-icons/css/flag-icons.min.css";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/shadcn";

const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export default function LanguageButton() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");

  const handleToggle = (nextLocale: Locale) => {
    if (nextLocale === locale) return;

    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}`;
    startTransition(() => router.refresh());
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            asChild
            onClick={() => handleToggle(locale === "en" ? "fr" : "en")}
            className="cursor-pointer size-6"
            variant="ghost"
            aria-label={t("language")}
          >
            {locale === "en" ? (
              <span className="fi fi-fr size-6"></span>
            ) : (
              <span className="fi fi-gb size-6"></span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {locale === "en" ? t("language-french") : t("language-english")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
