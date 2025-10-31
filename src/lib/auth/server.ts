import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { admin } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { user } from "@/db/schema/auth";
import { sendEmail } from "../email";
import { env } from "@/env";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, token, url }) => {
        // send email to user
        console.log("sendMagicLink", email, token, url);
        sendEmail({
          to: email,
          subject: "Magic link",
          html: `clickez <a href="${url}">ici</a> pour valider votre connexion<br/>ou copiez le lien suivant: ${url}<br/>token: ${token}`,
        });
      },
    }),
    admin({
      defaultRole: "regular",
    }),
    nextCookies(),
  ],
});

export async function getActualUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return undefined;
  const { id } = session.user;
  if (!id) return undefined;
  const actualUser = db.query.user.findFirst({
    where: eq(user.id, id),
  });

  return actualUser;
}

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}
