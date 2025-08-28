import { createTRPCRouter } from "@/lib/trpc/server";
import { userRouter } from "./routers/users";
import { siteRouter } from "./routers/sites";
import { coachRouter } from "./routers/coachs";
import { pricingRouter } from "./routers/pricing";
import { eventRouter } from "./routers/event";
import { dashboardRouter } from "./routers/dashboard";
import { fileRouter } from "./routers/files";
import { clubRouter } from "./routers/clubs";
import { calendarRouter } from "./routers/calendar";
import { activityRouter } from "./routers/activities";
import { planningRouter } from "./routers/planning";

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
  clubs: clubRouter,
  calendars: calendarRouter,
  activities: activityRouter,
  plannings: planningRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
