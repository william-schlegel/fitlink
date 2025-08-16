"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function FormEmail() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <form
        onSubmit={() =>
          authClient.signIn.magicLink({ email, callbackURL: "/videoach" })
        }
        className="grid grid-cols-[auto,1fr] gap-2"
      >
        <label htmlFor="email" className="required">
          {t("signin.my-email")}
        </label>
        <input
          id="email"
          type="email"
          required
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-bordered input w-full"
        />
        <div className="col-span-full flex flex-col gap-4">
          <p>{t("signin.magic-link")}</p>
          <button type="submit" className="btn-outline btn w-full">
            {t("signin.connect-with-account")} {"Email"}
          </button>
        </div>
      </form>
      <div className="divider">{t("signin.or")}</div>
      <form
        onSubmit={() =>
          authClient.signIn.email({ email, password, callbackURL: "/videoach" })
        }
        className="grid grid-cols-[auto,1fr] gap-2"
      >
        <label htmlFor="password" className="required">
          {t("signin.password")}
        </label>
        <input
          id="password"
          type="password"
          required
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-bordered input w-full"
        />
        <div className="col-span-full flex flex-col gap-4">
          <p>{t("signin.credentials")}</p>
          <button type="submit" className="btn btn-outline w-full">
            {t("signin.connect-with-account")} {t("signin.local")}
          </button>
        </div>
      </form>
    </>
  );
}
