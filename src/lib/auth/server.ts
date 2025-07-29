import { db } from "@/db";
import { env } from "@/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { user } from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
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
