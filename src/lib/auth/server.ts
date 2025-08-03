import { db } from "@/db";
import { env } from "@/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { user } from "@/db/schema/auth";
import { magicLink } from "better-auth/plugins";
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
      sendMagicLink: async ({ email, token, url }, request) => {
        // send email to user
        sendEmail({
          to: email,
          subject: "Magic link",
          html: `clickez <a href="${url}">ici</a> pour valider votre connexion<br/>ou copiez le lien suivant: ${url}<br/>token: ${token}`,
        });
      },
    }),
  ],
});

export async function getActualUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return null;
  const { id } = session.user;
  if (!id) return null;
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
