import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import {
  ActivityId,
  CoachId,
  ManagerId,
  MemberId,
  PageId,
  SubscriptionId,
  UserId,
} from "../types";
import { user } from "./auth";
import { activityGroup, club, clubCoachs, clubMembers } from "./club";
import {
  coachCertification,
  coachingPrice,
  coachMarketPlace,
  coachOrganisms,
} from "./coach";
import { page } from "./page";
import { planning } from "./planning";
import { subscription } from "./subscription";

export const userCoach = pgTable(
  "UserCoach",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<CoachId>(),
    userId: text("user_id").notNull().unique().$type<UserId>(),
    publicName: text("public_name"),
    description: text("description"),
    aboutMe: text("about_me"),
    searchAddress: text("search_address"),
    latitude: real("latitude").default(48.8583701),
    longitude: real("longitude").default(2.2944813),
    range: real("range").default(10),
    facebookLink: text("facebook_link"),
    twitterLink: text("twitter_link"),
    youtubeLink: text("youtube_link"),
    instagramLink: text("instagram_link"),
    rating: real("rating").default(0),
    pageId: text("page_id").$type<PageId>(),
    pageStyle: text("page_style").default("light"),
    convexRoomId: text("convex_room_id"),
    coachingActivities: text("coaching_activities")
      .array()
      .default([])
      .$type<ActivityId[]>(),
  },
  (table) => [index("user_coach_user_idx").on(table.userId)],
);

export const userCoachRelations = relations(userCoach, ({ one, many }) => ({
  user: one(user, {
    fields: [userCoach.userId],
    references: [user.id],
  }),
  activityGroups: many(activityGroup),
  coachingPrices: many(coachingPrice),
  certifications: many(coachCertification),
  organisms: many(coachOrganisms),
  page: one(page, {
    fields: [userCoach.pageId],
    references: [page.id],
  }),
  plannings: many(planning),
  marketPlaceOffers: many(coachMarketPlace),
  clubs: many(clubCoachs),
}));

export const userMember = pgTable("UserMember", {
  id: text("id").primaryKey().$defaultFn(createId).$type<MemberId>(),
  userId: text("user_id").notNull().unique().$type<UserId>(),
  inscriptionFeeOffered: boolean("inscription_fee_offered").default(false),
  cancelationFeeOffered: boolean("cancelation_fee_offered").default(false),
  subscriptionStart: timestamp("subscription_start"),
});

export const userMemberRelations = relations(userMember, ({ one, many }) => ({
  user: one(user, {
    fields: [userMember.userId],
    references: [user.id],
  }),
  subscriptions: many(userMemberToSubscription),
  clubs: many(clubMembers),
}));

export const userMemberToSubscription = pgTable(
  "UserMemberToSubscription",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => userMember.id)
      .$type<UserId>(),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscription.id)
      .$type<SubscriptionId>(),
  },
  (table) => [
    index("user_member_to_subscription_idx").on(table.userId),
    index("user_member_to_subscription_subscription_idx").on(
      table.subscriptionId,
    ),
  ],
);

export const userMemberToSubscriptionRelations = relations(
  userMemberToSubscription,
  ({ one }) => ({
    subscription: one(subscription, {
      fields: [userMemberToSubscription.subscriptionId],
      references: [subscription.id],
    }),
    user: one(userMember, {
      fields: [userMemberToSubscription.userId],
      references: [userMember.id],
    }),
  }),
);

export const userManager = pgTable("UserManager", {
  id: text("id").primaryKey().$defaultFn(createId).$type<ManagerId>(),
  userId: text("user_id").notNull().unique().$type<UserId>(),
});

export const userManagerRelations = relations(userManager, ({ one, many }) => ({
  user: one(user, {
    fields: [userManager.userId],
    references: [user.id],
  }),
  managedClubs: many(club),
}));
