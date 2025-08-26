"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function FormEmail() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      <form
        onSubmit={() =>
          authClient.signIn.magicLink(
            { email, callbackURL: "/videoach" },
            {
              onError: (ctx) => setError(ctx.error.message),
            }
          )
        }
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-bordered input w-full"
        />
        <button type="submit" className="btn-outline btn w-full">
          {t("signin.connect-with-magic-link")}
        </button>
      </form>
      <div className="divider divider-primary">{t("signin.or")}</div>
      <form
        onSubmit={() =>
          authClient.signIn.email(
            { email, password, callbackURL: "/videoach" },
            {
              onError: (ctx) => setError(ctx.error.message),
            }
          )
        }
        className="grid grid-cols-[auto,1fr] gap-2"
      >
        <div className="flex gap-4 items-center">
          <label htmlFor="password" className="required">
            {t("signin.password")}
          </label>
          <div className="tooltip" data-tip={t("signin.credentials")}>
            <i className="bx bx-info-circle bx-sm" />
          </div>
        </div>
        <input
          id="password"
          type="password"
          required
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-bordered input w-full"
        />
        <button type="submit" className="btn btn-outline w-full">
          {t("signin.connect-with-account")} {t("signin.local")}
        </button>
      </form>
    </>
  );
}
