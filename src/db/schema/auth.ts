import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { roleEnum } from "./enums";
import { relations } from "drizzle-orm";
import { paiement, pricing } from "./subscription";
import {
  userCoach,
  userDocument,
  userManager,
  userMember,
  userNotification,
} from "./user";
import { reservation } from "./planning";

export const user = pgTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull(),
    image: text("image"),
    profileImageId: text("profile_image_id"),
    role: roleEnum("role").default("MEMBER"),
    pricingId: text("pricing_id"),
    monthlyPayment: boolean("monthly_payment").default(false),
    trialUntil: timestamp("trial_until"),
    dueDate: timestamp("due_date"),
    cancelationDate: timestamp("cancelation_date"),
    phone: text("phone"),
    address: text("address"),
    chatToken: text("chat_token"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [index("user_pricing_idx").on(table.pricingId)]
);

export const userRelations = relations(user, ({ one, many }) => ({
  pricing: one(pricing, {
    fields: [user.pricingId],
    references: [pricing.id],
  }),
  memberData: one(userMember, {
    fields: [user.id],
    references: [userMember.userId],
  }),
  coachData: one(userCoach, {
    fields: [user.id],
    references: [userCoach.userId],
  }),
  managerData: one(userManager, {
    fields: [user.id],
    references: [userManager.userId],
  }),
  sessions: many(session),
  accounts: many(account),
  paiements: many(paiement),
  documents: many(userDocument),
  reservations: many(reservation),
  notificationsTo: many(userNotification, { relationName: "user-to" }),
  notificationsFrom: many(userNotification, { relationName: "user-from" }),
}));

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const verificationToken = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires").notNull(),
  },
  (table) => [unique().on(table.identifier, table.token)]
);
