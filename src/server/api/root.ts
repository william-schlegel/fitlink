import { createTRPCRouter } from "@/lib/trpc/server";
import { userRouter } from "./routers/user";
import { healthRouter } from "./routers/health";
import { siteRouter } from "./routers/sites";
import { coachRouter } from "./routers/coachs";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  health: healthRouter,
  sites: siteRouter,
  coach: coachRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
