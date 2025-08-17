import { createTRPCRouter } from "@/lib/trpc/server";
import { userRouter } from "./routers/users";
import { siteRouter } from "./routers/sites";
import { coachRouter } from "./routers/coachs";
import { pricingRouter } from "./routers/pricing";
import { eventRouter } from "./routers/event";
import { dashboardRouter } from "./routers/dashboard";
import { fileRouter } from "./routers/files";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  users: userRouter,
  sites: siteRouter,
  coachs: coachRouter,
  pricings: pricingRouter,
  events: eventRouter,
  dashboards: dashboardRouter,
  files: fileRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
