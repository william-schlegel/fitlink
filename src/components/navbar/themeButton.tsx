"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect } from "react";

import useTheme, { ThemeMode } from "@/hooks/useTheme";
import { useTranslations } from "next-intl";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/shadcn";

export default function ThemeButton() {
  const t = useTranslations("common");
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    const html = document.querySelector("html");
    if (theme === "dark") {
      html?.classList.add("dark");
    } else {
      html?.classList.remove("dark");
    }
  }, [theme]);

  const onChangeTheme = (theme: ThemeMode) => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => onChangeTheme(theme)}
            className="cursor-pointer size-6"
            variant="ghost"
            aria-label={t("theme")}
          >
            {theme === "dark" ? (
              <SunIcon className="size-6 text-foreground" />
            ) : (
              <MoonIcon className="size-6 text-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {theme === "dark" ? t("theme-light") : t("theme-dark")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
