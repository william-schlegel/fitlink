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
import { user } from "./auth";
import {
  dayNameEnum,
  featureEnum,
  roleEnum,
  subscriptionModeEnum,
  subscriptionRestrictionEnum,
} from "./enums";
import { activity, activityGroup, club, room, site } from "./club";
import { userMember, userMemberToSubscription } from "./user";
import { createId } from "@paralleldrive/cuid2";

export const paiement = pgTable(
  "Paiement",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id").notNull(),
    subscriptionId: text("subscription_id").notNull(),
    amount: real("amount").notNull(),
    paiementDate: timestamp("paiement_date").notNull(),
  },
  (table) => [
    index("paiement_user_idx").on(table.userId),
    index("paiement_subscription_idx").on(table.subscriptionId),
  ]
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
    id: text("id").primaryKey().$defaultFn(createId),
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
    clubId: text("club_id").notNull(),
  },
  (table) => [index("subscription_club_idx").on(table.clubId)]
);

export const subscriptionRelations = relations(
  subscription,
  ({ one, many }) => ({
    club: one(club, {
      fields: [subscription.clubId],
      references: [club.id],
    }),
    paiements: many(paiement),
    activitieGroups: many(activityGroup),
    activities: many(activity),
    users: many(userMemberToSubscription),
    sites: many(site),
    rooms: many(room),
  })
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
  (table) => [index("pricing_option_pricing_idx").on(table.pricingId)]
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
  (table) => [index("pricing_feature_pricing_idx").on(table.pricingId)]
);

export const pricingFeatureRelations = relations(pricingFeature, ({ one }) => ({
  pricing: one(pricing, {
    fields: [pricingFeature.pricingId],
    references: [pricing.id],
  }),
}));

export const subscriptionActivityGroups = pgTable(
  "subscription_activity_groups",
  {
    subscriptionId: text("subscription_id").notNull(),
    activityGroupId: text("activity_group_id").notNull(),
  }
);

export const subscriptionActivities = pgTable("subscription_activities", {
  subscriptionId: text("subscription_id").notNull(),
  activityId: text("activity_id").notNull(),
});

export const subscriptionUsers = pgTable("subscription_users", {
  subscriptionId: text("subscription_id").notNull(),
  userMemberId: text("user_member_id").notNull(),
});

export const subscriptionSites = pgTable("subscription_sites", {
  subscriptionId: text("subscription_id").notNull(),
  siteId: text("site_id").notNull(),
});

export const subscriptionRooms = pgTable("subscription_rooms", {
  subscriptionId: text("subscription_id").notNull(),
  roomId: text("room_id").notNull(),
});
