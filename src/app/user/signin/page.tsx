import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { signInAction } from "@/actions/auth";
import Title from "@/components/title";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { Separator } from "@/components/ui/shadcn/separator";
import { auth, getSession } from "@/lib/auth/server";
import CreateAccount from "./createAccount";
import FormEmail from "./formEmail";
import Providers from "./providers";

const quickLoginUsers = [
  {
    label: "Admin",
    email: "william.schlegel+admin@gmail.com",
    password: "videoach",
  },
  {
    label: "Manager",
    email: "william.schlegel+manager@gmail.com",
    password: "videoach",
  },
  {
    label: "Coach",
    email: "william.schlegel+coach@gmail.com",
    password: "videoach",
  },
  {
    label: "Manager + coach",
    email: "william.schlegel+coach-manager@gmail.com",
    password: "videoach",
  },
  {
    label: "Member",
    email: "william.schlegel+membre@gmail.com",
    password: "videoach",
  },
];

export default async function SignIn({
  searchParams,
}: {
  searchParams: Promise<{ email: string; password: string }>;
}) {
  const t = await getTranslations("auth");
  const session = await getSession();
  // Get the list of auth providers from better-auth
  const providers = (await auth.$context).socialProviders;
  const isQuickLoginEnabled = process.env.QUICK_LOGIN === "true";

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
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle className="text-2xl">{t("signin.connect")}</CardTitle>
          {isQuickLoginEnabled ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Quick login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Quick login</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {quickLoginUsers.map((user) => (
                  <DropdownMenuItem key={user.email} className="p-0">
                    <form action={signInAction} className="w-full">
                      <input type="hidden" name="email" value={user.email} />
                      <input
                        type="hidden"
                        name="password"
                        value={user.password}
                      />
                      <button
                        type="submit"
                        className="flex w-full items-center px-1.5 py-1 text-left"
                      >
                        <span className="text-sm font-medium">
                          {user.label}
                        </span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <FormEmail />
          <Separator>{t("signin.or")}</Separator>
          <Providers
            providers={providers.map((p) => ({ id: p.id, name: p.name }))}
          />
          <Separator>{t("signin.or")}</Separator>
          <div className="flex justify-center">
            <CreateAccount />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
