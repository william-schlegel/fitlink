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
import {
  coachingLevelListEnum,
  coachingTargetEnum,
  coachMarketPlaceTypeEnum,
  packModeEnum,
} from "./enums";
import { userCoach, userDocument } from "./user";
import { activityGroup, club, site } from "./club";
import { createId } from "@paralleldrive/cuid2";

export const coachingLevel = pgTable(
  "CoachingLevel",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    offerId: text("offer_id").notNull(),
    level: coachingLevelListEnum("level").notNull(),
  },
  (table) => [index("coaching_level_offer_idx").on(table.offerId)]
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
  (table) => [index("coaching_price_coach_idx").on(table.coachId)]
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
  })
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
  ]
);

export const coachingPricePackRelations = relations(
  coachingPricePack,
  ({ one }) => ({
    coachingPrice: one(coachingPrice, {
      fields: [coachingPricePack.coachingPriceId],
      references: [coachingPrice.id],
    }),
  })
);

export const certificationGroup = pgTable("CertificationGroup", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
});

export const certificationGroupRelations = relations(
  certificationGroup,
  ({ many }) => ({
    modules: many(certificationModule),
  })
);

export const certificationModule = pgTable(
  "CertificationModule",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    certificationGroupId: text("certification_group_id").notNull(),
  },
  (table) => [
    index("certification_module_certification_group_idx").on(
      table.certificationGroupId
    ),
  ]
);
export const certificationModuleRelations = relations(
  certificationModule,
  ({ one, many }) => ({
    certificationGroup: one(certificationGroup, {
      fields: [certificationModule.certificationGroupId],
      references: [certificationGroup.id],
    }),
    activityGroups: many(activityGroup),
    certifications: many(certification),
  })
);

export const certification = pgTable(
  "Certification",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    obtainedIn: timestamp("obtained_in").notNull(),
    documentId: text("document_id").unique(),
    coachId: text("coach_id").notNull(),
    manualModule: text("manual_module"),
  },
  (table) => [index("certification_coach_idx").on(table.coachId)]
);
export const certificationRelations = relations(
  certification,
  ({ one, many }) => ({
    document: one(userDocument, {
      fields: [certification.documentId],
      references: [userDocument.id],
    }),
    coach: one(userCoach, {
      fields: [certification.coachId],
      references: [userCoach.id],
    }),
    modules: many(certificationModule),
    activityGroups: many(activityGroup),
    marketPlaceSearchs: many(coachMarketPlace),
  })
);

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
  ]
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
    certifications: many(certification),
    activities: many(activityGroup),
  })
);

export const certificationModuleActivityGroups = pgTable(
  "certification_module_activity_groups",
  {
    certificationModuleId: text("certification_module_id").notNull(),
    activityGroupId: text("activity_group_id").notNull(),
  }
);

export const certificationCertificationModules = pgTable(
  "certification_certification_modules",
  {
    certificationId: text("certification_id").notNull(),
    certificationModuleId: text("certification_module_id").notNull(),
  }
);

export const certificationActivityGroups = pgTable(
  "certification_activity_groups",
  {
    certificationId: text("certification_id").notNull(),
    activityGroupId: text("activity_group_id").notNull(),
  }
);

export const coachMarketPlaceSites = pgTable("coach_market_place_sites", {
  coachMarketPlaceId: text("coach_market_place_id").notNull(),
  siteId: text("site_id").notNull(),
});

export const coachMarketPlaceCertifications = pgTable(
  "coach_market_place_certifications",
  {
    coachMarketPlaceId: text("coach_market_place_id").notNull(),
    certificationId: text("certification_id").notNull(),
  }
);

export const coachMarketPlaceActivityGroups = pgTable(
  "coach_market_place_activity_groups",
  {
    coachMarketPlaceId: text("coach_market_place_id").notNull(),
    activityGroupId: text("activity_group_id").notNull(),
  }
);
