import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import ws from "ws";

import { env } from "@/env";
import * as auth from "./schema/auth";
import * as club from "./schema/club";
import * as coach from "./schema/coach";
import * as enums from "./schema/enums";
import * as page from "./schema/page";
import * as planning from "./schema/planning";
import * as subscription from "./schema/subscription";
import * as user from "./schema/user";

// Configure WebSocket support
neonConfig.webSocketConstructor = ws;

// Create a connection pool
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const schema = {
  ...auth,
  ...club,
  ...coach,
  ...enums,
  ...page,
  ...planning,
  ...subscription,
  ...user,
};

export const db = drizzle(pool, {
  schema,
});

// Type for db or transaction client
export type DbClient = typeof db;
export type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0];
