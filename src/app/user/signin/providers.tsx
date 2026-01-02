"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/shadcn/button";
import { authClient } from "@/lib/auth/client";

export default function Providers({
  providers,
}: {
  providers: { id: string; name: string }[];
}) {
  const t = useTranslations("auth");
  return (
    <div className="space-y-2">
      {providers.map((provider) => (
        <Button
          variant="outline"
          className="w-full"
          key={provider.name}
          onClick={() =>
            authClient.signIn.social({
              provider: provider.id,
              callbackURL: "/",
            })
          }
        >
          {t("signin.connect-with-account")} {provider.name}
        </Button>
      ))}
    </div>
  );
}
