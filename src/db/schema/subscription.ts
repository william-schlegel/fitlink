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
  SubscriptionId,
  UserId,
} from "../types";
import { user } from "./auth";
import { club } from "./club";
import {
  dayNameEnum,
  featureEnum,
  roleEnum,
  subscriptionModeEnum,
  subscriptionRestrictionEnum,
} from "./enums";

export const paiement = pgTable(
  "Paiement",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id").notNull().$type<UserId>(),
    subscriptionId: text("subscription_id").notNull().$type<SubscriptionId>(),
    amount: real("amount").notNull(),
    paiementDate: timestamp("paiement_date").notNull(),
  },
  (table) => [
    index("paiement_user_idx").on(table.userId),
    index("paiement_subscription_idx").on(table.subscriptionId),
  ],
);

export const paiementRelations = relations(paiement, ({ one }) => ({
  user: one(user, {
    fields: [paiement.userId],
    references: [user.id],
  }),
  subscription: one(subscription, {
    fields: [paiement.subscriptionId],
    references: [subscription.id],
  }),
}));

export const subscription = pgTable(
  "Subscription",
  {
    id: text("id").primaryKey().$defaultFn(createId).$type<SubscriptionId>(),
    name: text("name").notNull(),
    mode: subscriptionModeEnum("mode").default("ALL_INCLUSIVE"),
    restriction: subscriptionRestrictionEnum("restriction").default("CLUB"),
    highlight: text("highlight").notNull(),
    description: text("description").notNull(),
    startDate: timestamp("start_date").notNull(),
    deletionDate: timestamp("deletion_date"),
    monthly: real("monthly").default(0),
    yearly: real("yearly").default(0),
    cancelationFee: real("cancelation_fee").default(0),
    inscriptionFee: real("inscription_fee").default(0),
    day: dayNameEnum("day"),
    clubId: text("club_id").notNull().$type<ClubId>(),
    activityGroups: text("activitie_groups")
      .array()
      .$type<ActivityGroupId[]>()
      .notNull()
      .default([]),
    activities: text("activities")
      .array()
      .$type<ActivityId[]>()
      .notNull()
      .default([]),
    sites: text("sites").array().$type<SiteId[]>().notNull().default([]),
    rooms: text("rooms").array().$type<RoomId[]>().notNull().default([]),
  },
  (table) => [index("subscription_club_idx").on(table.clubId)],
);

export const subscriptionRelations = relations(
  subscription,
  ({ one, many }) => ({
    club: one(club, {
      fields: [subscription.clubId],
      references: [club.id],
    }),
    paiements: many(paiement),
    users: many(userToMemberSubscription),
  }),
);

export const pricing = pgTable("Pricing", {
  id: text("id").primaryKey().$defaultFn(createId),
  roleTarget: roleEnum("role_target").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  free: boolean("free").default(false),
  highlighted: boolean("highlighted").default(false),
  monthly: real("monthly").default(0),
  yearly: real("yearly").default(0),
  deleted: boolean("deleted").default(false),
  deletionDate: timestamp("deletion_date"),
});

export const pricingRelations = relations(pricing, ({ many }) => ({
  options: many(pricingOption),
  features: many(pricingFeature),
  users: many(user),
}));

export const pricingOption = pgTable(
  "PricingOption",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    weight: integer("weight").notNull(), // for sorting
    pricingId: text("pricing_id").notNull(),
  },
  (table) => [index("pricing_option_pricing_idx").on(table.pricingId)],
);
export const pricingOptionRelations = relations(pricingOption, ({ one }) => ({
  pricing: one(pricing, {
    fields: [pricingOption.pricingId],
    references: [pricing.id],
  }),
}));
export const pricingFeature = pgTable(
  "PricingFeature",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    feature: featureEnum("feature").notNull(),
    pricingId: text("pricing_id").notNull(),
  },
  (table) => [index("pricing_feature_pricing_idx").on(table.pricingId)],
);

export const pricingFeatureRelations = relations(pricingFeature, ({ one }) => ({
  pricing: one(pricing, {
    fields: [pricingFeature.pricingId],
    references: [pricing.id],
  }),
}));

export const userToMemberSubscription = pgTable(
  "UserToMemberSubscription",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id").notNull().$type<UserId>(),
    subscriptionId: text("subscription_id").notNull().$type<SubscriptionId>(),
  },
  (table) => [index("user_to_member_subscription_idx").on(table.userId)],
);

export const userToMemberSubscriptionRelations = relations(
  userToMemberSubscription,
  ({ one }) => ({
    user: one(user, {
      fields: [userToMemberSubscription.userId],
      references: [user.id],
    }),
    subscription: one(subscription, {
      fields: [userToMemberSubscription.subscriptionId],
      references: [subscription.id],
    }),
  }),
);
