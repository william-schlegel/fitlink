import { subscriptionRouter } from "./routers/subscription";
import { notificationRouter } from "./routers/notification";
import { activityRouter } from "./routers/activities";
import { dashboardRouter } from "./routers/dashboard";
import { createTRPCRouter } from "@/lib/trpc/server";
import { planningRouter } from "./routers/planning";
import { calendarRouter } from "./routers/calendar";
import { pricingRouter } from "./routers/pricing";
import { coachRouter } from "./routers/coachs";
import { eventRouter } from "./routers/event";
import { userRouter } from "./routers/users";
import { siteRouter } from "./routers/sites";
// import { fileRouter } from "./routers/files";
import { clubRouter } from "./routers/clubs";
import { pageRouter } from "./routers/page";
import { chatRouter } from "./routers/chat";

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
  // files: fileRouter,
  clubs: clubRouter,
  chat: chatRouter,
  calendars: calendarRouter,
  activities: activityRouter,
  plannings: planningRouter,
  pages: pageRouter,
  subscriptions: subscriptionRouter,
  notifications: notificationRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
