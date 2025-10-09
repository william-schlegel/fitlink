import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Head from "next/head";

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
      <div className="flex min-h-screen items-center justify-center bg-base-200 mx-8">
        <Title title="Magic link" />

        <div className="rounded border border-primary bg-base-100 p-12 text-center">
          <h1>{t("signin.continue-with-link")}</h1>
          <p className="text-lg font-semibold">
            {t("signin.check-your-mail", { email: signInEmail })}
          </p>
          <p>{t("signin.close-page")}</p>
        </div>
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
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">{t("signin.connect")}</h2>
          {/* {signInCredentials ? (
            <div className="alert alert-error">
              {t("signin.wrong-credentials")}
            </div>
          ) : null} */}
          <Providers
            providers={providers.map((p) => ({ id: p.id, name: p.name }))}
          />
          <div className="divider  divider-primary">{t("signin.or")}</div>
          <FormEmail />

          <div className="divider  divider-primary">{t("signin.or")}</div>
          <div className="flex justify-center">
            <CreateAccount />
          </div>
        </div>
      </div>
    </div>
  );
}
