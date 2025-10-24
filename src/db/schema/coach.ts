import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  real,
  integer,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

import {
  coachingLevelListEnum,
  coachingTargetEnum,
  coachMarketPlaceTypeEnum,
  packModeEnum,
} from "./enums";
import { activityGroup, club, site } from "./club";
import { userCoach, userDocument } from "./user";

/* Coaching prices */

export const coachingLevel = pgTable(
  "CoachingLevel",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    offerId: text("offer_id").notNull(),
    level: coachingLevelListEnum("level").notNull(),
  },
  (table) => [index("coaching_level_offer_idx").on(table.offerId)],
);

export const coachingLevelRelations = relations(coachingLevel, ({ one }) => ({
  offer: one(coachingPrice, {
    fields: [coachingLevel.offerId],
    references: [coachingPrice.id],
  }),
}));

export const coachingPrice = pgTable(
  "CoachingPrice",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    target: coachingTargetEnum("target").default("INDIVIDUAL"),
    excludingTaxes: boolean("excluding_taxes").default(false),
    description: text("description").notNull(),
    startDate: timestamp("start_date").notNull(),
    physical: boolean("physical").default(false),
    inHouse: boolean("in_house").default(false),
    myPlace: boolean("my_place").default(false),
    publicPlace: boolean("public_place").default(false),
    perHourPhysical: real("per_hour_physical").default(0),
    perDayPhysical: real("per_day_physical").default(0),
    travelFee: real("travel_fee").default(0),
    travelLimit: integer("travel_limit").default(0),
    webcam: boolean("webcam").notNull(),
    perHourWebcam: real("per_hour_webcam").default(0),
    perDayWebcam: real("per_day_webcam").default(0),
    freeHours: integer("free_hours").default(0),
    coachId: text("coach_id").notNull(),
  },
  (table) => [index("coaching_price_coach_idx").on(table.coachId)],
);

export const coachingPriceRelations = relations(
  coachingPrice,
  ({ one, many }) => ({
    coach: one(userCoach, {
      fields: [coachingPrice.coachId],
      references: [userCoach.userId],
    }),
    coachingLevel: many(coachingLevel),
    packs: many(coachingPricePack),
  }),
);
export const coachingPricePack = pgTable(
  "CoachingPricePack",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    nbHours: integer("nb_hours").default(1),
    packPrice: real("pack_price").default(0),
    mode: packModeEnum("mode").default("PHYSICAL"),
    coachingPriceId: text("coaching_price_id").notNull(),
  },
  (table) => [
    index("coaching_price_pack_coaching_price_idx").on(table.coachingPriceId),
  ],
);

export const coachingPricePackRelations = relations(
  coachingPricePack,
  ({ one }) => ({
    coachingPrice: one(coachingPrice, {
      fields: [coachingPricePack.coachingPriceId],
      references: [coachingPrice.id],
    }),
  }),
);

/* Certifications */

export const certificationOrganism = pgTable("CertificationOrganism", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
});

export const certificationModule = pgTable(
  "CertificationModule",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    certificationOrganismId: text("certification_organism_id").notNull(),
  },
  (table) => [
    index("certification_module_certification_organism_idx").on(
      table.certificationOrganismId,
    ),
  ],
);

// Many-to-many: CertificationOrganism <-> CertificationModule
export const certificationOrganismModules = pgTable(
  "CertificationOrganismModules",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    certificationOrganismId: text("certification_organism_id")
      .notNull()
      .references(() => certificationOrganism.id),
    certificationModuleId: text("certification_module_id")
      .notNull()
      .references(() => certificationModule.id),
  },
  (table) => [
    index("cert_org_modules_org_idx").on(table.certificationOrganismId),
    index("cert_org_modules_mod_idx").on(table.certificationModuleId),
  ],
);

export const certificationOrganismModulesRelations = relations(
  certificationOrganismModules,
  ({ one }) => ({
    organism: one(certificationOrganism, {
      fields: [certificationOrganismModules.certificationOrganismId],
      references: [certificationOrganism.id],
    }),
    module: one(certificationModule, {
      fields: [certificationOrganismModules.certificationModuleId],
      references: [certificationModule.id],
    }),
  }),
);

// relations for certificationOrganism and certificationModule will be defined
// after dependent tables are declared to avoid temporal dead zone issues

export const coachCertification = pgTable(
  "CoachCertification",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    obtainedIn: timestamp("obtained_in").notNull(),
    documentId: text("document_id").unique(),
    coachId: text("coach_id").notNull(),
    manualModule: text("manual_module"),
  },
  (table) => [index("certification_coach_idx").on(table.coachId)],
);

export const certificationRelations = relations(
  coachCertification,
  ({ one, many }) => ({
    document: one(userDocument, {
      fields: [coachCertification.documentId],
      references: [userDocument.id],
    }),

    coach: one(userCoach, {
      fields: [coachCertification.coachId],
      references: [userCoach.userId],
    }),
    activityGroups: many(activityGroup),
    marketPlaceSearchs: many(coachMarketPlace),
    selectedModuleForCoach: many(selectedModuleForCoach),
  }),
);

export const selectedModuleForCoach = pgTable("SelectedModuleForCoach", {
  coachId: text("coach_id")
    .notNull()
    .references(() => userCoach.id),
  certificationId: text("certification_id")
    .notNull()
    .references(() => coachCertification.id),
  certificationModuleId: text("certification_module_id")
    .notNull()
    .references(() => certificationModule.id),
  certificationOrganismId: text("certification_organism_id")
    .notNull()
    .references(() => certificationOrganism.id),
});

export const selectedModuleForCoachRelations = relations(
  selectedModuleForCoach,
  ({ one }) => ({
    coach: one(userCoach, {
      fields: [selectedModuleForCoach.coachId],
      references: [userCoach.id],
    }),
    certification: one(coachCertification, {
      fields: [selectedModuleForCoach.certificationId],
      references: [coachCertification.id],
    }),
    module: one(certificationModule, {
      fields: [selectedModuleForCoach.certificationModuleId],
      references: [certificationModule.id],
    }),
    organism: one(certificationOrganism, {
      fields: [selectedModuleForCoach.certificationOrganismId],
      references: [certificationOrganism.id],
    }),
  }),
);

// Many-to-many: CertificationModule <-> ActivityGroup
export const certificationModuleActivityGroups = pgTable(
  "CertificationModuleActivityGroups",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    certificationModuleId: text("certification_module_id")
      .notNull()
      .references(() => certificationModule.id),
    activityGroupId: text("activity_group_id")
      .notNull()
      .references(() => activityGroup.id),
  },
  (table) => [
    index("cert_mod_act_groups_mod_idx").on(table.certificationModuleId),
    index("cert_mod_act_groups_grp_idx").on(table.activityGroupId),
  ],
);

export const certificationModuleActivityGroupsRelations = relations(
  certificationModuleActivityGroups,
  ({ one }) => ({
    module: one(certificationModule, {
      fields: [certificationModuleActivityGroups.certificationModuleId],
      references: [certificationModule.id],
    }),
    activityGroup: one(activityGroup, {
      fields: [certificationModuleActivityGroups.activityGroupId],
      references: [activityGroup.id],
    }),
  }),
);

// Many-to-many: Coach <-> CertificationOrganism
export const coachOrganisms = pgTable(
  "CoachOrganisms",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    coachUserId: text("coach_user_id")
      .notNull()
      .references(() => userCoach.userId),
    certificationOrganismId: text("certification_organism_id")
      .notNull()
      .references(() => certificationOrganism.id),
  },
  (table) => [
    index("coach_organisms_coach_idx").on(table.coachUserId),
    index("coach_organisms_org_idx").on(table.certificationOrganismId),
  ],
);

export const coachOrganismsRelations = relations(coachOrganisms, ({ one }) => ({
  coach: one(userCoach, {
    fields: [coachOrganisms.coachUserId],
    references: [userCoach.userId],
  }),
  organism: one(certificationOrganism, {
    fields: [coachOrganisms.certificationOrganismId],
    references: [certificationOrganism.id],
  }),
}));

// Now that all dependent tables are declared, define base relations
export const certificationOrganismRelations = relations(
  certificationOrganism,
  ({ many }) => ({
    modules: many(certificationOrganismModules),
    coaches: many(coachOrganisms),
    selectedModulesForCoach: many(selectedModuleForCoach),
  }),
);

export const certificationModuleRelations = relations(
  certificationModule,
  ({ many }) => ({
    organisms: many(certificationOrganismModules),
    activityGroups: many(certificationModuleActivityGroups),
    selectedModulesForCoach: many(selectedModuleForCoach),
  }),
);

/* Coach market place */

export const coachMarketPlace = pgTable(
  "CoachMarketPlace",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    type: coachMarketPlaceTypeEnum("type").notNull(),
    clubId: text("club_id"),
    coachId: text("coach_id"),
    publicationDate: timestamp("publication_date").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    views: integer("views").notNull(),
    displays: integer("displays").notNull(),
  },
  (table) => [
    index("coach_market_place_club_idx").on(table.clubId),
    index("coach_market_place_coach_idx").on(table.coachId),
  ],
);

export const coachMarketPlaceRelations = relations(
  coachMarketPlace,
  ({ one, many }) => ({
    club: one(club, {
      fields: [coachMarketPlace.clubId],
      references: [club.id],
    }),
    coach: one(userCoach, {
      fields: [coachMarketPlace.coachId],
      references: [userCoach.userId],
    }),
    sites: many(site),
    certifications: many(coachCertification),
    activities: many(activityGroup),
    coachMarketPlaceSites: many(coachMarketPlaceSites),
    coachMarketPlaceCertifications: many(coachMarketPlaceCertifications),
    coachMarketPlaceActivityGroups: many(coachMarketPlaceActivityGroups),
  }),
);

export const coachMarketPlaceSites = pgTable("CoachMarketPlaceSites", {
  coachMarketPlaceId: text("coach_market_place_id")
    .notNull()
    .references(() => coachMarketPlace.id),
  siteId: text("site_id")
    .notNull()
    .references(() => site.id),
});

export const coachMarketPlaceSitesRelations = relations(
  coachMarketPlaceSites,
  ({ one }) => ({
    coachMarketPlace: one(coachMarketPlace, {
      fields: [coachMarketPlaceSites.coachMarketPlaceId],
      references: [coachMarketPlace.id],
    }),
    site: one(site, {
      fields: [coachMarketPlaceSites.siteId],
      references: [site.id],
    }),
  }),
);

export const coachMarketPlaceCertifications = pgTable(
  "CoachMarketPlaceCertifications",
  {
    coachMarketPlaceId: text("coach_market_place_id")
      .notNull()
      .references(() => coachMarketPlace.id),
    certificationId: text("certification_id")
      .notNull()
      .references(() => coachCertification.id),
  },
);

export const coachMarketPlaceCertificationsRelations = relations(
  coachMarketPlaceCertifications,
  ({ one }) => ({
    coachMarketPlace: one(coachMarketPlace, {
      fields: [coachMarketPlaceCertifications.coachMarketPlaceId],
      references: [coachMarketPlace.id],
    }),
    certification: one(coachCertification, {
      fields: [coachMarketPlaceCertifications.certificationId],
      references: [coachCertification.id],
    }),
  }),
);

export const coachMarketPlaceActivityGroups = pgTable(
  "CoachMarketPlaceActivityGroups",
  {
    coachMarketPlaceId: text("coach_market_place_id")
      .notNull()
      .references(() => coachMarketPlace.id),
    activityGroupId: text("activity_group_id")
      .notNull()
      .references(() => activityGroup.id),
  },
);

export const coachMarketPlaceActivityGroupsRelations = relations(
  coachMarketPlaceActivityGroups,
  ({ one }) => ({
    coachMarketPlace: one(coachMarketPlace, {
      fields: [coachMarketPlaceActivityGroups.coachMarketPlaceId],
      references: [coachMarketPlace.id],
    }),
    activityGroup: one(activityGroup, {
      fields: [coachMarketPlaceActivityGroups.activityGroupId],
      references: [activityGroup.id],
    }),
  }),
);
