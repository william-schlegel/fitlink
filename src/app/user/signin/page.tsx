import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Separator } from "@/components/ui/shadcn/separator";
import { getSession } from "@/lib/auth/server";
import CreateAccount from "./createAccount";
import { auth } from "@/lib/auth/server";
import Title from "@/components/title";
import Providers from "./providers";
import FormEmail from "./formEmail";

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ email: string; password: string }>;
}) {
  const t = await getTranslations("auth");
  const session = await getSession();
  // Get the list of auth providers from better-auth
  const providers = (await auth.$context).socialProviders;

  const { email: signInEmail, password: signInCredentials } =
    await searchParams;
  if (signInEmail)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background mx-8">
        <Title title="Magic link" />

        <Card className="p-12 text-center max-w-md">
          <h1 className="text-2xl font-bold text-primary mb-4">
            {t("signin.continue-with-link")}
          </h1>
          <p className="text-lg font-semibold">
            {t("signin.check-your-mail", { email: signInEmail })}
          </p>
          <p className="text-[hsl(var(--foreground)/0.7)]">
            {t("signin.close-page")}
          </p>
        </Card>
      </div>
    );
  if (signInCredentials) {
    if (session?.user?.id) redirect("/fitlink");
  }

  return (
    <div
      title={t("signin.connect")}
      className="grid h-screen place-items-center"
    >
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">{t("signin.connect")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Providers
            providers={providers.map((p) => ({ id: p.id, name: p.name }))}
          />
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-sm text-primary font-medium">
              {t("signin.or")}
            </span>
            <Separator className="flex-1" />
          </div>
          <FormEmail />

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-sm text-primary font-medium">
              {t("signin.or")}
            </span>
            <Separator className="flex-1" />
          </div>
          <div className="flex justify-center">
            <CreateAccount />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
