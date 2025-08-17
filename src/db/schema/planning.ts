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
  openingCalendars: many(openingCalendarPlannings),
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

// Many-to-many intermediate tables for openingCalendar relationships
export const openingCalendarClubs = pgTable(
  "OpeningCalendarClubs",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    openingCalendarId: text("opening_calendar_id")
      .notNull()
      .references(() => openingCalendar.id),
    clubId: text("club_id")
      .notNull()
      .references(() => club.id),
  },
  (table) => [
    index("opening_calendar_clubs_calendar_idx").on(table.openingCalendarId),
    index("opening_calendar_clubs_club_idx").on(table.clubId),
  ]
);

export const openingCalendarSites = pgTable(
  "OpeningCalendarSites",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    openingCalendarId: text("opening_calendar_id")
      .notNull()
      .references(() => openingCalendar.id),
    siteId: text("site_id")
      .notNull()
      .references(() => site.id),
  },
  (table) => [
    index("opening_calendar_sites_calendar_idx").on(table.openingCalendarId),
    index("opening_calendar_sites_site_idx").on(table.siteId),
  ]
);

export const openingCalendarRooms = pgTable(
  "OpeningCalendarRooms",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    openingCalendarId: text("opening_calendar_id")
      .notNull()
      .references(() => openingCalendar.id),
    roomId: text("room_id")
      .notNull()
      .references(() => room.id),
  },
  (table) => [
    index("opening_calendar_rooms_calendar_idx").on(table.openingCalendarId),
    index("opening_calendar_rooms_room_idx").on(table.roomId),
  ]
);

export const openingCalendarPlannings = pgTable(
  "OpeningCalendarPlannings",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    openingCalendarId: text("opening_calendar_id")
      .notNull()
      .references(() => openingCalendar.id),
    planningId: text("planning_id")
      .notNull()
      .references(() => planning.id),
  },
  (table) => [
    index("opening_calendar_plannings_calendar_idx").on(
      table.openingCalendarId
    ),
    index("opening_calendar_plannings_planning_idx").on(table.planningId),
  ]
);

export const dayOpeningTimeCalendars = pgTable(
  "DayOpeningTimeCalendars",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    dayOpeningTimeId: text("day_opening_time_id")
      .notNull()
      .references(() => dayOpeningTime.id),
    openingCalendarId: text("opening_calendar_id")
      .notNull()
      .references(() => openingCalendar.id),
  },
  (table) => [
    index("day_opening_time_calendars_day_idx").on(table.dayOpeningTimeId),
    index("day_opening_time_calendars_calendar_idx").on(
      table.openingCalendarId
    ),
  ]
);

export const openingTimeDays = pgTable(
  "OpeningTimeDays",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    openingTimeId: text("opening_time_id")
      .notNull()
      .references(() => openingTime.id),
    dayOpeningTimeId: text("day_opening_time_id")
      .notNull()
      .references(() => dayOpeningTime.id),
  },
  (table) => [
    index("opening_time_days_time_idx").on(table.openingTimeId),
    index("opening_time_days_day_idx").on(table.dayOpeningTimeId),
  ]
);

// Relations for openingCalendar
export const openingCalendarRelations = relations(
  openingCalendar,
  ({ many }) => ({
    clubs: many(openingCalendarClubs),
    sites: many(openingCalendarSites),
    rooms: many(openingCalendarRooms),
    plannings: many(openingCalendarPlannings),
    dayOpeningTimes: many(dayOpeningTimeCalendars),
  })
);

// Relations for intermediate tables
export const openingCalendarClubsRelations = relations(
  openingCalendarClubs,
  ({ one }) => ({
    openingCalendar: one(openingCalendar, {
      fields: [openingCalendarClubs.openingCalendarId],
      references: [openingCalendar.id],
    }),
    club: one(club, {
      fields: [openingCalendarClubs.clubId],
      references: [club.id],
    }),
  })
);

export const openingCalendarSitesRelations = relations(
  openingCalendarSites,
  ({ one }) => ({
    openingCalendar: one(openingCalendar, {
      fields: [openingCalendarSites.openingCalendarId],
      references: [openingCalendar.id],
    }),
    site: one(site, {
      fields: [openingCalendarSites.siteId],
      references: [site.id],
    }),
  })
);

export const openingCalendarRoomsRelations = relations(
  openingCalendarRooms,
  ({ one }) => ({
    openingCalendar: one(openingCalendar, {
      fields: [openingCalendarRooms.openingCalendarId],
      references: [openingCalendar.id],
    }),
    room: one(room, {
      fields: [openingCalendarRooms.roomId],
      references: [room.id],
    }),
  })
);

export const openingCalendarPlanningsRelations = relations(
  openingCalendarPlannings,
  ({ one }) => ({
    openingCalendar: one(openingCalendar, {
      fields: [openingCalendarPlannings.openingCalendarId],
      references: [openingCalendar.id],
    }),
    planning: one(planning, {
      fields: [openingCalendarPlannings.planningId],
      references: [planning.id],
    }),
  })
);

// Relations for dayOpeningTime and openingTime
export const dayOpeningTimeRelations = relations(
  dayOpeningTime,
  ({ many }) => ({
    openingTimes: many(openingTimeDays),
    calendars: many(dayOpeningTimeCalendars),
  })
);

export const dayOpeningTimeCalendarsRelations = relations(
  dayOpeningTimeCalendars,
  ({ one }) => ({
    dayOpeningTime: one(dayOpeningTime, {
      fields: [dayOpeningTimeCalendars.dayOpeningTimeId],
      references: [dayOpeningTime.id],
    }),
    openingCalendar: one(openingCalendar, {
      fields: [dayOpeningTimeCalendars.openingCalendarId],
      references: [openingCalendar.id],
    }),
  })
);

export const openingTimeRelations = relations(openingTime, ({ many }) => ({
  days: many(openingTimeDays),
}));

export const openingTimeDaysRelations = relations(
  openingTimeDays,
  ({ one }) => ({
    openingTime: one(openingTime, {
      fields: [openingTimeDays.openingTimeId],
      references: [openingTime.id],
    }),
    dayOpeningTime: one(dayOpeningTime, {
      fields: [openingTimeDays.dayOpeningTimeId],
      references: [dayOpeningTime.id],
    }),
  })
);
