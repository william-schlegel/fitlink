"use client";

import { useLocale, useTranslations } from "next-intl";
import { startTransition } from "react";

import { setUserLocale } from "@/lib/locale";
import { Locale, locales } from "@/i18n";

export default function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();

  const handleLanguageChange = (newLocale: Locale) => {
    startTransition(() => setUserLocale(newLocale));
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{t("language")}:</span>
      <div className="flex bg-gray-100 rounded-md p-1">
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLanguageChange(loc)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              locale === loc
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {loc === "fr" ? "Français" : "English"}
          </button>
        ))}
      </div>
    </div>
  );
}
