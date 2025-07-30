import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as auth from "./schema/auth";
import * as club from "./schema/club";
import * as coach from "./schema/coach";
import * as enums from "./schema/enums";
import * as page from "./schema/page";
import * as planning from "./schema/planning";
import * as subscription from "./schema/subscription";
import * as user from "./schema/user";
import { env } from "@/env";

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, {
  schema: {
    ...auth,
    ...club,
    ...coach,
    ...enums,
    ...page,
    ...planning,
    ...subscription,
    ...user,
  },
});
