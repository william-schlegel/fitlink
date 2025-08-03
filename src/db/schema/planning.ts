import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { dayNameEnum } from "./enums";
import { activity, club, room, site } from "./club";
import { userCoach } from "./user";
import { createId } from "@paralleldrive/cuid2";

export const openingCalendar = pgTable("OpeningCalendar", {
  id: text("id").primaryKey().$defaultFn(createId),
  startDate: timestamp("start_date").notNull().defaultNow(),
});

export const dayOpeningTime = pgTable("DayOpeningTime", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: dayNameEnum("name").notNull(),
  wholeDay: boolean("whole_day").default(false),
  closed: boolean("closed").default(false),
});

export const openingTime = pgTable("OpeningTime", {
  id: text("id").primaryKey().$defaultFn(createId),
  opening: text("opening").notNull(), // format HH:MM
  closing: text("closing").notNull(), // format HH:MM
});

export const planning = pgTable(
  "Planning",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name"),
    clubId: text("club_id").notNull(),
    siteId: text("site_id"),
    roomId: text("room_id"),
    startDate: timestamp("start_date").notNull().defaultNow(),
    endDate: timestamp("end_date"),
    coachId: text("coach_id"),
  },
  (table) => [
    index("planning_club_idx").on(table.clubId),
    index("planning_site_idx").on(table.siteId),
    index("planning_room_idx").on(table.roomId),
    index("planning_coach_idx").on(table.coachId),
  ]
);

export const planningRelations = relations(planning, ({ one, many }) => ({
  club: one(club, {
    fields: [planning.clubId],
    references: [club.id],
  }),
  site: one(site, {
    fields: [planning.siteId],
    references: [site.id],
  }),
  room: one(room, {
    fields: [planning.roomId],
    references: [room.id],
  }),
  coach: one(userCoach, {
    fields: [planning.coachId],
    references: [userCoach.userId],
  }),
  planningActivities: many(planningActivity),
}));

export const planningActivity = pgTable(
  "PlanningActivity",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    planningId: text("planning_id").notNull(),
    activityId: text("activity_id").notNull(),
    siteId: text("site_id").notNull(),
    roomId: text("room_id"),
    day: dayNameEnum("day").notNull(),
    startTime: text("start_time").notNull(),
    duration: integer("duration").notNull(),
    coachId: text("coach_id"),
  },
  (table) => [
    index("planning_activity_planning_idx").on(table.planningId),
    index("planning_activity_activity_idx").on(table.activityId),
    index("planning_activity_site_idx").on(table.siteId),
    index("planning_activity_room_idx").on(table.roomId),
    index("planning_activity_coach_idx").on(table.coachId),
  ]
);
export const planningActivityRelations = relations(
  planningActivity,
  ({ one, many }) => ({
    planning: one(planning, {
      fields: [planningActivity.planningId],
      references: [planning.id],
    }),
    activity: one(activity, {
      fields: [planningActivity.activityId],
      references: [activity.id],
    }),
    site: one(site, {
      fields: [planningActivity.siteId],
      references: [site.id],
    }),
    room: one(room, {
      fields: [planningActivity.roomId],
      references: [room.id],
    }),
    coach: one(userCoach, {
      fields: [planningActivity.coachId],
      references: [userCoach.userId],
    }),
    reservations: many(reservation),
  })
);

export const reservation = pgTable(
  "Reservation",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    planningActivityId: text("planning_activity_id"),
    activityId: text("activity_id"),
    activitySlot: integer("activity_slot"),
    date: timestamp("date").notNull(),
    roomId: text("room_id"),
    userId: text("user_id").notNull(),
    reservationDate: timestamp("reservation_date").notNull().defaultNow(),
  },
  (table) => [
    index("reservation_room_idx").on(table.roomId),
    index("reservation_activity_idx").on(table.activityId),
    index("reservation_planning_activity_idx").on(table.planningActivityId),
    index("reservation_user_idx").on(table.userId),
  ]
);
export const reservationRelations = relations(reservation, ({ one }) => ({
  planningActivity: one(planningActivity, {
    fields: [reservation.planningActivityId],
    references: [planningActivity.id],
  }),
  activity: one(activity, {
    fields: [reservation.activityId],
    references: [activity.id],
  }),
  room: one(room, {
    fields: [reservation.roomId],
    references: [room.id],
  }),
  user: one(user, {
    fields: [reservation.userId],
    references: [user.id],
  }),
}));

export const openingCalendarRooms = pgTable("opening_calendar_rooms", {
  openingCalendarId: text("opening_calendar_id").notNull(),
  roomId: text("room_id").notNull(),
});

export const openingCalendarClubs = pgTable("opening_calendar_clubs", {
  openingCalendarId: text("opening_calendar_id").notNull(),
  clubId: text("club_id").notNull(),
});

export const openingCalendarSites = pgTable("opening_calendar_sites", {
  openingCalendarId: text("opening_calendar_id").notNull(),
  siteId: text("site_id").notNull(),
});

export const dayOpeningTimeCalendars = pgTable("day_opening_time_calendars", {
  dayOpeningTimeId: text("day_opening_time_id").notNull(),
  openingCalendarId: text("opening_calendar_id").notNull(),
});

export const openingTimeDays = pgTable("opening_time_days", {
  openingTimeId: text("opening_time_id").notNull(),
  dayOpeningTimeId: text("day_opening_time_id").notNull(),
});
