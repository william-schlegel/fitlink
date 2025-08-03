import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  real,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { userCoach, userDocument, userManager } from "./user";
import {
  openingCalendar,
  planning,
  planningActivity,
  reservation,
} from "./planning";
import { page } from "./page";
import { subscription } from "./subscription";
import { certification, certificationModule, coachMarketPlace } from "./coach";
import { roomReservationEnum } from "./enums";
import { createId } from "@paralleldrive/cuid2";

export const club = pgTable(
  "Club",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    address: text("address").notNull(),
    managerId: text("manager_id").notNull(),
    pageStyle: text("page_style").default("light"),
    logoId: text("logo_id").unique(),
  },
  (table) => [
    index("club_manager_idx").on(table.managerId),
    index("club_logo_idx").on(table.logoId),
  ]
);

export const clubRelations = relations(club, ({ one, many }) => ({
  manager: one(userManager, {
    fields: [club.managerId],
    references: [userManager.userId],
  }),
  logo: one(userDocument, {
    fields: [club.logoId],
    references: [userDocument.id],
  }),
  sites: many(site),
  activities: many(activity),
  calendars: many(openingCalendar),
  pages: many(page),
  plannings: many(planning),
  subscriptions: many(subscription),
  events: many(event),
  marketPlaceSearchs: many(coachMarketPlace),
  coachs: many(userCoach),
}));

export const site = pgTable(
  "Site",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    address: text("address").notNull(),
    searchAddress: text("search_address"),
    latitude: real("latitude").default(48.8583701),
    longitude: real("longitude").default(2.2944813),
    clubId: text("club_id").notNull(),
    openWithClub: boolean("open_with_club").default(true),
  },
  (table) => [index("site_club_idx").on(table.clubId)]
);

export const siteRelations = relations(site, ({ one, many }) => ({
  club: one(club, {
    fields: [site.clubId],
    references: [club.id],
  }),
  rooms: many(room),
  calendars: many(openingCalendar),
  plannings: many(planning),
  planningActivities: many(planningActivity),
  subscriptions: many(subscription),
  marketPlaceSearchs: many(coachMarketPlace),
}));

export const room = pgTable(
  "Room",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    reservation: roomReservationEnum("reservation").default("NONE"),
    capacity: integer("capacity").notNull(),
    unavailable: boolean("unavailable").default(false),
    openWithClub: boolean("open_with_club").default(true),
    openWithSite: boolean("open_with_site").default(true),
    siteId: text("site_id").notNull(),
  },
  (table) => [index("room_site_idx").on(table.siteId)]
);

export const roomRelations = relations(room, ({ one, many }) => ({
  site: one(site, {
    fields: [room.siteId],
    references: [site.id],
  }),
  calendars: many(openingCalendar),
  plannings: many(planning),
  planningActivities: many(planningActivity),
  subscriptions: many(subscription),
  reservations: many(reservation),
  activities: many(activity),
}));

export const event = pgTable(
  "Event",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    clubId: text("club_id").notNull(),
    name: text("name").notNull(),
    brief: text("brief").notNull(),
    description: text("description").notNull(),
    pageId: text("page_id"),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    startDisplay: timestamp("start_display").notNull().defaultNow(),
    endDisplay: timestamp("end_display").notNull(),
    bannerText: text("banner_text").notNull(),
    cancelled: boolean("cancelled").notNull(),
    documentId: text("document_id").unique(),
    price: real("price").notNull(),
    free: boolean("free").notNull(),
    address: text("address").notNull(),
    searchAddress: text("search_address"),
    latitude: real("latitude").default(48.8583701),
    longitude: real("longitude").default(2.2944813),
  },
  (table) => [
    index("event_page_idx").on(table.pageId),
    index("event_club_idx").on(table.clubId),
  ]
);

export const eventRelations = relations(event, ({ one }) => ({
  club: one(club, {
    fields: [event.clubId],
    references: [club.id],
  }),
  page: one(page, {
    fields: [event.pageId],
    references: [page.id],
  }),
  document: one(userDocument, {
    fields: [event.documentId],
    references: [userDocument.id],
  }),
}));

export const activityGroup = pgTable(
  "ActivityGroup",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    default: boolean("default").default(false),
    coachId: text("coach_id"),
  },
  (table) => [index("activity_group_coach_idx").on(table.coachId)]
);

export const activityGroupRelations = relations(
  activityGroup,
  ({ one, many }) => ({
    activities: many(activity),
    coach: one(userCoach, {
      fields: [activityGroup.coachId],
      references: [userCoach.id],
    }),
    certifications: many(certification),
    certificationModules: many(certificationModule),
    subscriptions: many(subscription),
    marketPlaceSearchs: many(coachMarketPlace),
  })
);

export const activity = pgTable(
  "Activity",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    groupId: text("group_id").notNull(),
    clubId: text("club_id").notNull(),
    noCalendar: boolean("no_calendar").default(false),
    reservationDuration: integer("reservation_duration").default(60),
  },
  (table) => [
    index("activity_group_idx").on(table.groupId),
    index("activity_club_idx").on(table.clubId),
  ]
);

export const activityRelations = relations(activity, ({ one, many }) => ({
  group: one(activityGroup, {
    fields: [activity.groupId],
    references: [activityGroup.id],
  }),
  club: one(club, {
    fields: [activity.clubId],
    references: [club.id],
  }),
  rooms: many(room),
  planningActivities: many(planningActivity),
  subscriptions: many(subscription),
  reservations: many(reservation),
}));
export const coachingActivity = pgTable(
  "CoachingActivity",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    coachId: text("coach_id").notNull(),
  },
  (table) => [index("coaching_activity_coach_idx").on(table.coachId)]
);

export const coachingActivityRelations = relations(
  coachingActivity,
  ({ one }) => ({
    coach: one(userCoach, {
      fields: [coachingActivity.coachId],
      references: [userCoach.userId],
    }),
  })
);

export const clubMembers = pgTable("club_members", {
  clubId: text("club_id").notNull(),
  memberUserId: text("member_user_id").notNull(),
});

export const clubCoachs = pgTable("club_coachs", {
  clubId: text("club_id").notNull(),
  coachUserId: text("coach_user_id").notNull(),
});

export const roomActivities = pgTable("room_activities", {
  roomId: text("room_id").notNull(),
  activityId: text("activity_id").notNull(),
});
