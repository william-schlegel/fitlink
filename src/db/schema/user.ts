import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  real,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { notificationTypeEnum, userDocumentTypeEnum } from "./enums";
import {
  activityGroup,
  club,
  clubCoachs,
  clubMembers,
  coachingActivity,
  event,
} from "./club";
import { certification, coachingPrice, coachMarketPlace } from "./coach";
import { page, pageSectionElement } from "./page";
import { planning, planningActivity } from "./planning";
import { subscription } from "./subscription";
import { createId } from "@paralleldrive/cuid2";

export const userCoach = pgTable(
  "UserCoach",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id").notNull().unique(),
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
    pageStyle: text("page_style").default("light"),
  },
  (table) => [index("user_coach_user_idx").on(table.userId)]
);

export const userCoachRelations = relations(userCoach, ({ one, many }) => ({
  user: one(user, {
    fields: [userCoach.userId],
    references: [user.id],
  }),
  activityGroups: many(activityGroup),
  coachingPrices: many(coachingPrice),
  coachingActivities: many(coachingActivity),
  certifications: many(certification),
  page: one(page),
  planningActivities: many(planningActivity),
  plannings: many(planning),
  marketPlaceOffers: many(coachMarketPlace),
  clubs: many(clubCoachs),
}));

export const userMember = pgTable("UserMember", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id").notNull().unique(),
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
  "user_member_to_subscription",
  {
    userId: text("user_id")
      .notNull()
      .references(() => userMember.id),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscription.id),
  },
  (table) => [
    index("user_member_to_subscription_idx").on(
      table.userId,
      table.subscriptionId
    ),
  ]
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
  })
);

export const userManager = pgTable("UserManager", {
  id: text("id").primaryKey().$defaultFn(createId),
  userId: text("user_id").notNull().unique(),
});

export const userManagerRelations = relations(userManager, ({ one, many }) => ({
  user: one(user, {
    fields: [userManager.userId],
    references: [user.id],
  }),
  managedClubs: many(club),
}));

export const userDocument = pgTable(
  "UserDocument",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id").notNull(),
    documentType: userDocumentTypeEnum("document_type").default("DOCUMENT"),
    fileType: text("file_type").notNull(),
    fileName: text("file_name"),
  },
  (table) => [index("user_document_user_idx").on(table.userId)]
);

export const userDocumentRelations = relations(
  userDocument,
  ({ one, many }) => ({
    user: one(user, {
      fields: [userDocument.userId],
      references: [user.id],
    }),
    certification: one(certification),
    pageSectionElements: many(pageSectionElement),
    club: one(club),
    event: one(event),
  })
);

export const userNotification = pgTable(
  "UserNotification",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    type: notificationTypeEnum("type").notNull(),
    userToId: text("user_to_id").notNull(),
    userFromId: text("user_from_id").notNull(),
    message: text("message").notNull(),
    viewDate: timestamp("view_date"),
    date: timestamp("date").notNull().defaultNow(),
    data: json("data"),
    answered: timestamp("answered"),
    answer: text("answer"),
    linkedNotification: text("linked_notification"),
  },
  (table) => [
    index("user_notification_user_to_idx").on(table.userToId),
    index("user_notification_user_from_idx").on(table.userFromId),
  ]
);

export const userNotificationRelations = relations(
  userNotification,
  ({ one }) => ({
    userTo: one(user, {
      fields: [userNotification.userToId],
      references: [user.id],
      relationName: "user-to",
    }),
    userFrom: one(user, {
      fields: [userNotification.userFromId],
      references: [user.id],
      relationName: "user-from",
    }),
  })
);
