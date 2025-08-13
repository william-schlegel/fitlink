import { createTRPCRouter } from "@/lib/trpc/server";
import { userRouter } from "./routers/users";
import { healthRouter } from "../../../health";
import { siteRouter } from "./routers/sites";
import { coachRouter } from "./routers/coachs";
import { pricingRouter } from "./routers/pricing";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  users: userRouter,
  health: healthRouter,
  sites: siteRouter,
  coach: coachRouter,
  pricing: pricingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
