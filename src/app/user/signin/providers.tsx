"use client";

import { useTranslations } from "next-intl";

import { authClient } from "@/lib/auth/client";

export default function Providers({
  providers,
}: {
  providers: { id: string; name: string }[];
}) {
  const t = useTranslations("auth");
  return (
    <>
      {providers.map((provider) => (
        <button
          className="btn-outline btn w-full"
          key={provider.name}
          onClick={() =>
            authClient.signIn.social({
              provider: provider.id,
              callbackURL: "/",
            })
          }
        >
          {t("signin.connect-with-account")} {provider.name}
        </button>
      ))}
    </>
  );
}
