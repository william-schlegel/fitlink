import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, magicLink } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { UserId } from "@/db/types";
import { env } from "@/env";
import { sendEmail } from "../email";

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
    where: eq(user.id, id as UserId),
  });

  return actualUser;
}

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}
