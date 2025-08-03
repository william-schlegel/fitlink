"use client";

import { authClient } from "@/lib/auth/client";
import { OAuthProvider } from "better-auth";
import { useTranslations } from "next-intl";

export default function Providers({
  providers,
}: {
  providers: OAuthProvider<Record<string, unknown>>[];
}) {
  const t = useTranslations("auth");
  return providers
    ? Object.values(providers)
        .filter((p) => p.id !== "email" && p.id !== "credentials")
        .map((provider) => (
          <button
            className="btn-outline btn w-full"
            key={provider.name}
            onClick={() =>
              authClient.signIn.social({
                provider: provider.id,
                callbackURL: "/videoach",
              })
            }
          >
            {t("signin.connect-with-account")} {provider.name}
          </button>
        ))
    : null;
}
