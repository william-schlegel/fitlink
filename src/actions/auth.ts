"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth/server";

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  await auth.api.signInEmail({ body: { email, password } });
  redirect("/");
}

export async function signInMagicLinkAction(formData: FormData) {
  const email = formData.get("email") as string;
  await auth.api.signInMagicLink({ body: { email }, headers: await headers() });
  redirect("/");
}

export async function signInSocialAction(formData: FormData) {
  const provider = formData.get("provider") as string;
  await auth.api.signInSocial({
    body: { provider, callbackURL: "/", newUserCallbackURL: "/profile" },
    headers: await headers(),
  });

  redirect("/");
}
