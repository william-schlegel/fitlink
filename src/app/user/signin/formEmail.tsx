import { getTranslations } from "next-intl/server";

import { signInAction, signInMagicLinkAction } from "@/actions/auth";

export default async function FormEmail({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const t = await getTranslations("auth");
  const error = searchParams ? (await searchParams)?.error : undefined;

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      <form
        action={signInMagicLinkAction}
        className="grid grid-cols-[auto,1fr] gap-2"
      >
        <div className="flex gap-4 items-center">
          <label htmlFor="email" className="required">
            {t("signin.my-email")}
          </label>
          <div className="tooltip" data-tip={t("signin.magic-link")}>
            <i className="bx bx-info-circle bx-sm" />
          </div>
        </div>
        <input
          id="email"
          type="email"
          required
          name="email"
          className="input-bordered input w-full"
        />
        <button type="submit" className="btn-outline btn w-full">
          {t("signin.connect-with-magic-link")}
        </button>
      </form>
      <div className="divider divider-primary">{t("signin.or")}</div>
      <form action={signInAction} className="grid grid-cols-[auto,1fr] gap-2">
        <div className="flex gap-4 items-center">
          <label htmlFor="password" className="required">
            {t("signin.password")}
          </label>
          <div className="tooltip" data-tip={t("signin.credentials")}>
            <i className="bx bx-info-circle bx-sm" />
          </div>
        </div>
        <input
          id="email"
          type="email"
          required
          name="email"
          className="input-bordered input w-full"
        />
        <input
          id="password"
          type="password"
          required
          name="password"
          className="input-bordered input w-full"
        />
        <button type="submit" className="btn btn-outline w-full">
          {t("signin.connect-with-account")} {t("signin.local")}
        </button>
      </form>
    </>
  );
}
