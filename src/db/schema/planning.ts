import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  json,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import {
  ActivityId,
  CalendarId,
  ClubId,
  PlanningId,
  ReservationId,
  RoomId,
  SiteId,
  UserId,
} from "../types";
import { user } from "./auth";
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
  ({ many }) => ({
    club: many(openingCalendar),
    site: many(openingCalendar),
    room: many(openingCalendar),
  }),
);

export type PlanningData = {
  slotId: string; // slot id is the id of the slot in the planning data json
  activityId: ActivityId;
  day: (typeof dayNameEnum.enumValues)[number];
  startTime: string;
  duration: number;
  coachId: UserId | null;
  roomId: RoomId | null;
  siteId: SiteId | null;
  deleted: boolean;
};

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
    planningItems: json("planning_data").$type<PlanningData[]>(),
  },
  (table) => [
    index("planning_club_idx").on(table.clubId),
    index("planning_site_idx").on(table.siteId),
    index("planning_room_idx").on(table.roomId),
  ],
);

export const planningRelations = relations(planning, ({ many }) => ({
  club: many(planning),
  site: many(planning),
  room: many(planning),
}));

export const reservation = pgTable(
  "Reservation",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<ReservationId>(),
    planningId: text("planning_id").$type<PlanningId>(),
    slotId: text("slot_id"), // slot id is the id of the slot in the planning data items
    slotNumber: integer("slot_number"), // slot number for activity without calendar
    date: timestamp("date").notNull(),
    userId: text("user_id").notNull().$type<UserId>(),
    reservationDate: timestamp("reservation_date").notNull().defaultNow(),
  },
  (table) => [
    index("reservation_planning_idx").on(table.planningId),
    index("reservation_user_idx").on(table.userId),
  ],
);
export const reservationRelations = relations(reservation, ({ one }) => ({
  planning: one(planning, {
    fields: [reservation.planningId],
    references: [planning.id],
  }),
  user: one(user, {
    fields: [reservation.userId],
    references: [user.id],
  }),
}));
