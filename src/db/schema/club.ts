import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import {
  ActivityGroupId,
  ActivityId,
  ClubId,
  RoomId,
  SiteId,
  UserId,
} from "../types";
import {
  certificationModule,
  certificationModuleActivityGroups,
  coachCertification,
  coachMarketPlace,
  coachMarketPlaceActivityGroups,
} from "./coach";
import { roomReservationEnum } from "./enums";
import { page } from "./page";
import { openingCalendar, planning, reservation } from "./planning";
import { subscription } from "./subscription";
import { userCoach, userManager, userMember } from "./user";

export const club = pgTable(
  "Club",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<ClubId>(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    managerId: text("manager_id").notNull().$type<UserId>(),
    pageStyle: text("page_style").default("light"),
    logoUrl: text("logo_url").unique(),
    convexRoomId: text("convex_room_id"),
  },
  (table) => [index("club_manager_idx").on(table.managerId)],
);

export const clubRelations = relations(club, ({ one, many }) => ({
  manager: one(userManager, {
    fields: [club.managerId],
    references: [userManager.userId],
  }),
  sites: many(site),
  activities: many(activity),
  pages: many(page),
  plannings: many(planning),
  subscriptions: many(subscription),
  events: many(event),
  marketPlaceSearchs: many(coachMarketPlace),
  openingCalendars: many(openingCalendar),
  members: many(clubMembers),
  coaches: many(clubCoachs),
}));

export const site = pgTable(
  "Site",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<SiteId>(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    searchAddress: text("search_address"),
    latitude: real("latitude").default(48.8583701),
    longitude: real("longitude").default(2.2944813),
    clubId: text("club_id").notNull().$type<ClubId>(),
    openWithClub: boolean("open_with_club").default(true),
  },
  (table) => [index("site_club_idx").on(table.clubId)],
);

export const siteRelations = relations(site, ({ one, many }) => ({
  club: one(club, {
    fields: [site.clubId],
    references: [club.id],
  }),
  rooms: many(room),
  marketPlaceSearchs: many(coachMarketPlace),
  plannings: many(planning),
  openingCalendars: many(openingCalendar),
}));

export const room = pgTable(
  "Room",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<RoomId>(),
    name: text("name").notNull(),
    reservation: roomReservationEnum("reservation").default("NONE"),
    capacity: integer("capacity").notNull(),
    unavailable: boolean("unavailable").default(false),
    openWithClub: boolean("open_with_club").default(true),
    openWithSite: boolean("open_with_site").default(true),
    siteId: text("site_id").notNull().$type<SiteId>(),
  },
  (table) => [index("room_site_idx").on(table.siteId)],
);

export const roomRelations = relations(room, ({ one, many }) => ({
  site: one(site, {
    fields: [room.siteId],
    references: [site.id],
  }),
  reservations: many(reservation),
  activities: many(roomActivities),
  plannings: many(planning),
  openingCalendars: many(openingCalendar),
}));

export const event = pgTable(
  "Event",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    clubId: text("club_id").notNull().$type<ClubId>(),
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
    imageUrls: text("image_urls").array().default([]),
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
  ],
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
}));

export const activityGroup = pgTable(
  "ActivityGroup",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<ActivityGroupId>(),
    name: text("name").notNull(),
    default: boolean("default").default(false),
    coachUserId: text("coach_user_id").$type<UserId>(),
  },
  (table) => [index("activity_group_coach_idx").on(table.coachUserId)],
);

export const activityGroupRelations = relations(
  activityGroup,
  ({ one, many }) => ({
    activities: many(activity),
    coach: one(userCoach, {
      fields: [activityGroup.coachUserId],
      references: [userCoach.id],
    }),
    coachCertification: many(coachCertification),
    certificationModules: many(certificationModule),
    certificationModuleActivityGroups: many(certificationModuleActivityGroups),
    marketPlaceSearchs: many(coachMarketPlace),
    coachMarketPlaceActivityGroups: many(coachMarketPlaceActivityGroups),
  }),
);

export const activity = pgTable(
  "Activity",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<ActivityId>(),
    name: text("name").notNull(),
    groupId: text("group_id").notNull().$type<ActivityGroupId>(),
    clubId: text("club_id").notNull().$type<ClubId>(),
    noCalendar: boolean("no_calendar").default(false),
    reservationDuration: integer("reservation_duration").default(60),
  },
  (table) => [
    index("activity_group_idx").on(table.groupId),
    index("activity_club_idx").on(table.clubId),
  ],
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
  reservations: many(reservation),
  rooms: many(roomActivities),
}));

export const clubMembers = pgTable(
  "ClubMembers",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    clubId: text("club_id")
      .notNull()
      .$type<ClubId>()
      .references(() => club.id),
    memberUserId: text("member_user_id")
      .notNull()
      .$type<UserId>()
      .references(() => userMember.userId),
  },
  (table) => [
    index("club_members_club_idx").on(table.clubId),
    index("club_members_member_idx").on(table.memberUserId),
  ],
);

export const clubCoachs = pgTable(
  "ClubCoachs",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    clubId: text("club_id")
      .notNull()
      .$type<ClubId>()
      .references(() => club.id),
    coachUserId: text("coach_user_id")
      .notNull()
      .$type<UserId>()
      .references(() => userCoach.userId),
  },
  (table) => [
    index("club_coachs_club_idx").on(table.clubId),
    index("club_coachs_coach_idx").on(table.coachUserId),
  ],
);

export const roomActivities = pgTable(
  "RoomActivities",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    roomId: text("room_id")
      .notNull()
      .$type<RoomId>()
      .references(() => room.id),
    activityId: text("activity_id")
      .notNull()
      .$type<ActivityId>()
      .references(() => activity.id),
  },
  (table) => [
    index("room_activities_room_idx").on(table.roomId),
    index("room_activities_activity_idx").on(table.activityId),
  ],
);

// Relations for many-to-many intermediate tables
export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  club: one(club, {
    fields: [clubMembers.clubId],
    references: [club.id],
  }),
  member: one(userMember, {
    fields: [clubMembers.memberUserId],
    references: [userMember.userId],
  }),
}));

export const clubCoachsRelations = relations(clubCoachs, ({ one }) => ({
  club: one(club, {
    fields: [clubCoachs.clubId],
    references: [club.id],
  }),
  coach: one(userCoach, {
    fields: [clubCoachs.coachUserId],
    references: [userCoach.userId],
  }),
}));

export const roomActivitiesRelations = relations(roomActivities, ({ one }) => ({
  room: one(room, {
    fields: [roomActivities.roomId],
    references: [room.id],
  }),
  activity: one(activity, {
    fields: [roomActivities.activityId],
    references: [activity.id],
  }),
}));
