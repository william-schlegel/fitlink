import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import {
  ActivityId,
  CalendarId,
  ClubId,
  CourseId,
  PlanningId,
  PlanningItemId,
  ReservationId,
  RoomId,
  SiteId,
  UserId,
} from "../types";
import { user } from "./auth";
import { activity, club, room, site } from "./club";
import { dayNameEnum } from "./enums";

export type OpeningData = {
  day: (typeof dayNameEnum.enumValues)[number];
  wholeDay: boolean;
  closed: boolean;
  workingHours: Array<{
    opening: string;
    closing: string;
  }>;
};

export const openingCalendar = pgTable("OpeningCalendar", {
  id: text("id").primaryKey().$defaultFn(createId).$type<CalendarId>(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  clubId: text("club_id").notNull().$type<ClubId>(),
  siteId: text("site_id").$type<SiteId | null>(),
  roomId: text("room_id").$type<RoomId | null>(),
  openingTimes: json("opening_time").$type<OpeningData[]>(),
});

export const openingCalendarRelations = relations(
  openingCalendar,
  ({ one }) => ({
    club: one(club, {
      fields: [openingCalendar.clubId],
      references: [club.id],
    }),
    site: one(site, {
      fields: [openingCalendar.siteId],
      references: [site.id],
    }),
    room: one(room, {
      fields: [openingCalendar.roomId],
      references: [room.id],
    }),
  }),
);

export const planning = pgTable(
  "Planning",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<PlanningId>(),
    name: text("name"),
    clubId: text("club_id").notNull().$type<ClubId>(),
    siteId: text("site_id").$type<SiteId>(),
    roomId: text("room_id").$type<RoomId>(),
    startDate: timestamp("start_date").notNull().defaultNow(),
    endDate: timestamp("end_date"),
  },
  (table) => [
    index("planning_club_idx").on(table.clubId),
    index("planning_site_idx").on(table.siteId),
    index("planning_room_idx").on(table.roomId),
  ],
);

export const planningItem = pgTable(
  "PlanningItem",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<PlanningItemId>(),
    planningId: text("planning_id").notNull().$type<PlanningId>(),
    clubId: text("club_id").notNull().$type<ClubId>(),
    activityId: text("activity_id").notNull().$type<ActivityId>(),
    day: dayNameEnum("day").notNull(),
    startTime: text("start_time").notNull(),
    duration: integer("duration").notNull(),
    coachUserId: text("coach_user_id").$type<UserId | null>(),
    roomId: text("room_id").$type<RoomId | null>(),
    siteId: text("site_id").$type<SiteId | null>(),
    deleted: boolean("deleted").notNull().default(false),
    noCalendar: boolean("no_calendar").notNull().default(false),
  },
  (table) => [
    index("planning_item_planning_idx").on(table.planningId),
    index("planning_item_club_idx").on(table.clubId),
    index("planning_item_activity_idx").on(table.activityId),
    index("planning_item_site_idx").on(table.siteId),
    index("planning_item_room_idx").on(table.roomId),
    index("planning_item_coach_idx").on(table.coachUserId),
  ],
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
  planningItems: many(planningItem),
}));

export const planningItemRelations = relations(planningItem, ({ one }) => ({
  planning: one(planning, {
    fields: [planningItem.planningId],
    references: [planning.id],
  }),
  club: one(club, {
    fields: [planningItem.clubId],
    references: [club.id],
  }),
  site: one(site, {
    fields: [planningItem.siteId],
    references: [site.id],
  }),
  room: one(room, {
    fields: [planningItem.roomId],
    references: [room.id],
  }),
  activity: one(activity, {
    fields: [planningItem.activityId],
    references: [activity.id],
  }),
  coach: one(user, {
    fields: [planningItem.coachUserId],
    references: [user.id],
  }),
}));

export const reservation = pgTable(
  "Reservation",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<ReservationId>(),
    planningId: text("planning_id").$type<PlanningId>(),
    planningItemId: text("planning_item_id").$type<PlanningItemId>(),
    slotNumber: integer("slot_number"), // slot number for activity without calendar
    date: timestamp("date").notNull(),
    userId: text("user_id").notNull().$type<UserId>(),
    reservationDate: timestamp("reservation_date").notNull().defaultNow(),
  },
  (table) => [
    index("reservation_planning_idx").on(table.planningId),
    index("reservation_planning_item_idx").on(table.planningItemId),
    index("reservation_user_idx").on(table.userId),
  ],
);
export const reservationRelations = relations(reservation, ({ one }) => ({
  planning: one(planning, {
    fields: [reservation.planningId],
    references: [planning.id],
  }),
  planningItem: one(planningItem, {
    fields: [reservation.planningItemId],
    references: [planningItem.id],
  }),
  user: one(user, {
    fields: [reservation.userId],
    references: [user.id],
  }),
}));

export const course = pgTable(
  "Course",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<CourseId>(),
    name: text("name").notNull(),
    date: timestamp("date").notNull(),
    planningId: text("planning_id").notNull().$type<PlanningId>(),
    planningItemId: text("planning_item_id").notNull().$type<PlanningItemId>(),
    slotNumber: integer("slot_number").notNull(),
    activityId: text("activity_id").notNull().$type<ActivityId>(),
    siteId: text("site_id").$type<SiteId | null>(),
    roomId: text("room_id").$type<RoomId | null>(),
    coachUserId: text("coach_user_id").$type<UserId | null>(),
    cancelled: boolean("cancelled").default(false),
    message: text("message"),
    capacity: integer("capacity").notNull(),
    reservations: text("reservations").array().$type<ReservationId[]>(),
  },
  (table) => [
    index("course_date_idx").on(table.date),
    index("course_planning_item_idx").on(table.planningItemId),
    uniqueIndex("course_planning_item_date_idx").on(
      table.planningItemId,
      table.date,
    ),
  ],
);

export const courseRelations = relations(course, ({ one }) => ({
  planning: one(planning, {
    fields: [course.planningId],
    references: [planning.id],
  }),
  planningItem: one(planningItem, {
    fields: [course.planningItemId],
    references: [planningItem.id],
  }),
}));
