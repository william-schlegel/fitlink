import { createTRPCRouter } from "@/lib/trpc/server";
import { activityRouter } from "./routers/activities";
import { assistantRouter } from "./routers/assistant";
import { calendarRouter } from "./routers/calendar";
import { clubRouter } from "./routers/clubs";
import { coachRouter } from "./routers/coachs";
import { dashboardRouter } from "./routers/dashboard";
import { eventRouter } from "./routers/event";
import { pageRouter } from "./routers/page";
import { planningRouter } from "./routers/planning";
import { pricingRouter } from "./routers/pricing";
import { siteRouter } from "./routers/sites";
import { subscriptionRouter } from "./routers/subscription";
import { userRouter } from "./routers/users";

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
  clubs: clubRouter,
  calendars: calendarRouter,
  activities: activityRouter,
  plannings: planningRouter,
  pages: pageRouter,
  subscriptions: subscriptionRouter,
  assistant: assistantRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
