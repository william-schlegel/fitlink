import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "./lib/locale";

// Can be imported from a shared config
export const locales = ["fr", "en"] as const;
export const defaultLocale = "fr" as const;

export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
  let locale = await getUserLocale();
  if (!locales.includes(locale as Locale)) locale = defaultLocale;

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
