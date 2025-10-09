import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import ws from "ws";

import * as subscription from "./schema/subscription";
import * as planning from "./schema/planning";
import * as enums from "./schema/enums";
import * as coach from "./schema/coach";
import * as user from "./schema/user";
import * as page from "./schema/page";
import * as club from "./schema/club";
import * as auth from "./schema/auth";
import { env } from "@/env";

// Configure WebSocket support
neonConfig.webSocketConstructor = ws;

// Create a connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
export const db = drizzle(pool, {
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
