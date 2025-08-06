import Head from "next/head";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import Providers from "./providers";
import FormEmail from "./formEmail";
import CreateAccount from "./createAccount";

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
      <div className="flex min-h-screen items-center justify-center bg-base-200">
        <Head>
          <title>Videoach - Magic link</title>
        </Head>
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
    if (session?.user?.id) redirect("/videoach");
  }

  return (
    <div
      title={t("signin.connect")}
      className="grid h-screen place-items-center"
    >
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">{t("signin.connect")}</h2>
          {signInCredentials ? (
            <div className="alert alert-error">
              {t("signin.wrong-credentials")}
            </div>
          ) : null}
          <Providers
            providers={providers.map((p) => ({ id: p.id, name: p.name }))}
          />
          <div className="divider">{t("signin.or")}</div>
          <FormEmail />

          <div className="divider"></div>
          <CreateAccount />
        </div>
      </div>
    </div>
  );
}
