import {
  pgTable,
  text,
  timestamp,
  boolean,
  pgEnum,
  real,
  integer,
  json,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("Role", [
  "MEMBER",
  "COACH",
  "MANAGER",
  "MANAGER_COACH",
  "ADMIN",
]);

export const userDocumentTypeEnum = pgEnum("UserDocumentType", [
  "DOCUMENT",
  "IMAGE",
  "PROFILE_IMAGE",
  "PAGE_IMAGE",
  "CERTIFICATION",
  "MEDICAL_CERTIFICAT",
]);

export const notificationTypeEnum = pgEnum("NotificationType", [
  "SEARCH_COACH",
  "SEARCH_CLUB",
  "COACH_ACCEPT",
  "COACH_REFUSE",
  "CLUB_ACCEPT",
  "CLUB_REFUSE",
  "NEW_MESSAGE",
  "NEW_SUBSCRIPTION",
  "NEW_REQUEST",
  "SUBSCRIPTION_VALIDATED",
  "SUBSCRIPTION_REJECTED",
  "REQUEST_VALIDATED",
  "REQUEST_REJECTED",
]);

export const roomReservationEnum = pgEnum("RoomReservation", [
  "NONE",
  "POSSIBLE",
  "MANDATORY",
]);

export const subscriptionModeEnum = pgEnum("SubscriptionMode", [
  "ALL_INCLUSIVE",
  "ACTIVITY_GROUP",
  "ACTIVITY",
  "DAY",
  "COURSE",
]);

export const subscriptionRestrictionEnum = pgEnum("SubscriptionRestriction", [
  "CLUB",
  "SITE",
  "ROOM",
]);

export const coachingLevelListEnum = pgEnum("CoachingLevelList", [
  "ALL",
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
  "COMPETITOR",
  "PROFESSIONAL",
]);

export const coachingTargetEnum = pgEnum("CoachingTarget", [
  "INDIVIDUAL",
  "COMPANY",
]);

export const packModeEnum = pgEnum("PackMode", ["PHYSICAL", "WEBCAM"]);

export const dayNameEnum = pgEnum("DayName", [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
]);

export const featureEnum = pgEnum("Feature", [
  "COACH_OFFER",
  "COACH_OFFER_COMPANY",
  "COACH_CERTIFICATION",
  "COACH_MEETING",
  "COACH_MARKET_PLACE",
  "MANAGER_MULTI_CLUB",
  "MANAGER_MULTI_SITE",
  "MANAGER_ROOM",
  "MANAGER_EVENT",
  "MANAGER_PLANNING",
  "MANAGER_COACH",
  "MANAGER_MARKET_PLACE",
  "MANAGER_SHOP",
  "MANAGER_EMPLOYEES",
]);

export const pageTargetEnum = pgEnum("PageTarget", [
  "HOME",
  "ACTIVITIES",
  "OFFERS",
  "TEAM",
  "PLANNING",
  "VIDEOS",
  "EVENTS",
]);

export const pageSectionModelEnum = pgEnum("PageSectionModel", [
  "HERO",
  "TITLE",
  "PLANNINGS",
  "ACTIVITY_GROUPS",
  "ACTIVITIES",
  "OFFERS",
  "VIDEO",
  "LOCATION",
  "SOCIAL",
  "TEAMMATES",
  "CONTACT",
  "FOOTER",
]);

export const pageSectionElementTypeEnum = pgEnum("PageSectionElementType", [
  "HERO_CONTENT",
  "CTA",
  "CARD",
  "OPENING_TIME",
  "MAP",
  "FEATURE",
  "BUTTON",
  "NEWSLETTER",
  "OPTION",
]);

export const coachMarketPlaceTypeEnum = pgEnum("CoachMarketPlaceType", [
  "SEARCH",
  "OFFER",
]);

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

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// New tables for the extended schema

export const userCoach = pgTable(
  "UserCoach",
  {
    id: text("id").primaryKey(),
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

export const userMember = pgTable("UserMember", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  inscriptionFeeOffered: boolean("inscription_fee_offered").default(false),
  cancelationFeeOffered: boolean("cancelation_fee_offered").default(false),
  subscriptionStart: timestamp("subscription_start"),
});

export const userManager = pgTable("UserManager", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
});

export const paiement = pgTable(
  "Paiement",
  {
    id: text("id").primaryKey(),
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

export const verificationToken = pgTable(
  "VerificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires").notNull(),
  },
  (table) => [unique().on(table.identifier, table.token)]
);

export const userDocument = pgTable(
  "UserDocument",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    documentType: userDocumentTypeEnum("document_type").default("DOCUMENT"),
    fileType: text("file_type").notNull(),
    fileName: text("file_name"),
  },
  (table) => [index("user_document_user_idx").on(table.userId)]
);

export const userNotification = pgTable(
  "UserNotification",
  {
    id: text("id").primaryKey(),
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

export const club = pgTable(
  "Club",
  {
    id: text("id").primaryKey(),
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

export const site = pgTable(
  "Site",
  {
    id: text("id").primaryKey(),
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

export const room = pgTable(
  "Room",
  {
    id: text("id").primaryKey(),
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

export const subscription = pgTable(
  "Subscription",
  {
    id: text("id").primaryKey(),
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

export const event = pgTable(
  "Event",
  {
    id: text("id").primaryKey(),
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

export const coachingLevel = pgTable(
  "CoachingLevel",
  {
    id: text("id").primaryKey(),
    offerId: text("offer_id").notNull(),
    level: coachingLevelListEnum("level").notNull(),
  },
  (table) => [index("coaching_level_offer_idx").on(table.offerId)]
);

export const coachingPrice = pgTable(
  "CoachingPrice",
  {
    id: text("id").primaryKey(),
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

export const coachingPricePack = pgTable(
  "CoachingPricePack",
  {
    id: text("id").primaryKey(),
    nbHours: integer("nb_hours").default(1),
    packPrice: real("pack_price").default(0),
    mode: packModeEnum("mode").default("PHYSICAL"),
    coachingPriceId: text("coaching_price_id").notNull(),
  },
  (table) => [
    index("coaching_price_pack_coaching_price_idx").on(table.coachingPriceId),
  ]
);

export const activityGroup = pgTable(
  "ActivityGroup",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    default: boolean("default").default(false),
    coachId: text("coach_id"),
  },
  (table) => [index("activity_group_coach_idx").on(table.coachId)]
);

export const activity = pgTable(
  "Activity",
  {
    id: text("id").primaryKey(),
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

export const coachingActivity = pgTable(
  "CoachingActivity",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    coachId: text("coach_id").notNull(),
  },
  (table) => [index("coaching_activity_coach_idx").on(table.coachId)]
);

export const openingCalendar = pgTable("OpeningCalendar", {
  id: text("id").primaryKey(),
  startDate: timestamp("start_date").notNull().defaultNow(),
});

export const dayOpeningTime = pgTable("DayOpeningTime", {
  id: text("id").primaryKey(),
  name: dayNameEnum("name").notNull(),
  wholeDay: boolean("whole_day").default(false),
  closed: boolean("closed").default(false),
});

export const openingTime = pgTable("OpeningTime", {
  id: text("id").primaryKey(),
  opening: text("opening").notNull(), // format HH:MM
  closing: text("closing").notNull(), // format HH:MM
});

export const pricing = pgTable("Pricing", {
  id: text("id").primaryKey(),
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

export const pricingOption = pgTable(
  "PricingOption",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    weight: integer("weight").notNull(), // for sorting
    pricingId: text("pricing_id").notNull(),
  },
  (table) => [index("pricing_option_pricing_idx").on(table.pricingId)]
);

export const pricingFeature = pgTable(
  "PricingFeature",
  {
    id: text("id").primaryKey(),
    feature: featureEnum("feature").notNull(),
    pricingId: text("pricing_id").notNull(),
  },
  (table) => [index("pricing_feature_pricing_idx").on(table.pricingId)]
);

export const certificationGroup = pgTable("CertificationGroup", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const certificationModule = pgTable(
  "CertificationModule",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    certificationGroupId: text("certification_group_id").notNull(),
  },
  (table) => [
    index("certification_module_certification_group_idx").on(
      table.certificationGroupId
    ),
  ]
);

export const certification = pgTable(
  "Certification",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    obtainedIn: timestamp("obtained_in").notNull(),
    documentId: text("document_id").unique(),
    coachId: text("coach_id").notNull(),
    manualModule: text("manual_module"),
  },
  (table) => [index("certification_coach_idx").on(table.coachId)]
);

export const pageSectionElement = pgTable(
  "PageSectionElement",
  {
    id: text("id").primaryKey(),
    title: text("title"),
    subTitle: text("sub_title"),
    elementType: pageSectionElementTypeEnum("element_type"),
    content: text("content"),
    link: text("link"),
    pageId: text("page_id"),
    pageSection: pageSectionModelEnum("page_section"),
    sectionId: text("section_id").notNull(),
    optionValue: text("option_value"),
  },
  (table) => [index("page_section_element_section_idx").on(table.sectionId)]
);

export const pageSection = pgTable(
  "PageSection",
  {
    id: text("id").primaryKey(),
    model: pageSectionModelEnum("model").notNull(),
    title: text("title"),
    subTitle: text("sub_title"),
    pageId: text("page_id").notNull(),
  },
  (table) => [index("page_section_page_idx").on(table.pageId)]
);

export const page = pgTable(
  "Page",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    target: pageTargetEnum("target").default("HOME"),
    clubId: text("club_id"),
    coachId: text("coach_id").unique(),
    published: boolean("published").default(false),
    eventId: text("event_id").unique(),
  },
  (table) => [
    index("page_club_idx").on(table.clubId),
    index("page_coach_idx").on(table.coachId),
    index("page_event_idx").on(table.eventId),
  ]
);

export const planning = pgTable(
  "Planning",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    clubId: text("club_id").notNull(),
    siteId: text("site_id"),
    roomId: text("room_id"),
    startDate: timestamp("start_date").notNull().defaultNow(),
    endDate: timestamp("end_date"),
    coachId: text("coach_id"),
  },
  (table) => [
    index("planning_club_idx").on(table.clubId),
    index("planning_site_idx").on(table.siteId),
    index("planning_room_idx").on(table.roomId),
    index("planning_coach_idx").on(table.coachId),
  ]
);

export const planningActivity = pgTable(
  "PlanningActivity",
  {
    id: text("id").primaryKey(),
    planningId: text("planning_id").notNull(),
    activityId: text("activity_id").notNull(),
    siteId: text("site_id").notNull(),
    roomId: text("room_id"),
    day: dayNameEnum("day").notNull(),
    startTime: text("start_time").notNull(),
    duration: integer("duration").notNull(),
    coachId: text("coach_id"),
  },
  (table) => [
    index("planning_activity_planning_idx").on(table.planningId),
    index("planning_activity_activity_idx").on(table.activityId),
    index("planning_activity_site_idx").on(table.siteId),
    index("planning_activity_room_idx").on(table.roomId),
    index("planning_activity_coach_idx").on(table.coachId),
  ]
);

export const reservation = pgTable(
  "Reservation",
  {
    id: text("id").primaryKey(),
    planningActivityId: text("planning_activity_id"),
    activityId: text("activity_id"),
    activitySlot: integer("activity_slot"),
    date: timestamp("date").notNull(),
    roomId: text("room_id"),
    userId: text("user_id").notNull(),
    reservationDate: timestamp("reservation_date").notNull().defaultNow(),
  },
  (table) => [
    index("reservation_room_idx").on(table.roomId),
    index("reservation_activity_idx").on(table.activityId),
    index("reservation_planning_activity_idx").on(table.planningActivityId),
    index("reservation_user_idx").on(table.userId),
  ]
);

export const coachMarketPlace = pgTable(
  "CoachMarketPlace",
  {
    id: text("id").primaryKey(),
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

// Join tables for many-to-many relationships
export const clubMembers = pgTable("club_members", {
  clubId: text("club_id").notNull(),
  memberUserId: text("member_user_id").notNull(),
});

export const clubCoachs = pgTable("club_coachs", {
  clubId: text("club_id").notNull(),
  coachUserId: text("coach_user_id").notNull(),
});

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

export const roomActivities = pgTable("room_activities", {
  roomId: text("room_id").notNull(),
  activityId: text("activity_id").notNull(),
});

export const openingCalendarRooms = pgTable("opening_calendar_rooms", {
  openingCalendarId: text("opening_calendar_id").notNull(),
  roomId: text("room_id").notNull(),
});

export const openingCalendarClubs = pgTable("opening_calendar_clubs", {
  openingCalendarId: text("opening_calendar_id").notNull(),
  clubId: text("club_id").notNull(),
});

export const openingCalendarSites = pgTable("opening_calendar_sites", {
  openingCalendarId: text("opening_calendar_id").notNull(),
  siteId: text("site_id").notNull(),
});

export const dayOpeningTimeCalendars = pgTable("day_opening_time_calendars", {
  dayOpeningTimeId: text("day_opening_time_id").notNull(),
  openingCalendarId: text("opening_calendar_id").notNull(),
});

export const openingTimeDays = pgTable("opening_time_days", {
  openingTimeId: text("opening_time_id").notNull(),
  dayOpeningTimeId: text("day_opening_time_id").notNull(),
});

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

// Relations
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

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

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
}));

export const userMemberRelations = relations(userMember, ({ one, many }) => ({
  user: one(user, {
    fields: [userMember.userId],
    references: [user.id],
  }),
  subscriptions: many(subscription),
}));

export const userManagerRelations = relations(userManager, ({ one, many }) => ({
  user: one(user, {
    fields: [userManager.userId],
    references: [user.id],
  }),
  managedClubs: many(club),
}));

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
}));

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
    users: many(userMember),
    sites: many(site),
    rooms: many(room),
  })
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

export const coachingLevelRelations = relations(coachingLevel, ({ one }) => ({
  offer: one(coachingPrice, {
    fields: [coachingLevel.offerId],
    references: [coachingPrice.id],
  }),
}));

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

export const coachingPricePackRelations = relations(
  coachingPricePack,
  ({ one }) => ({
    coachingPrice: one(coachingPrice, {
      fields: [coachingPricePack.coachingPriceId],
      references: [coachingPrice.id],
    }),
  })
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

export const coachingActivityRelations = relations(
  coachingActivity,
  ({ one }) => ({
    coach: one(userCoach, {
      fields: [coachingActivity.coachId],
      references: [userCoach.userId],
    }),
  })
);

export const pricingRelations = relations(pricing, ({ many }) => ({
  options: many(pricingOption),
  features: many(pricingFeature),
  users: many(user),
}));

export const pricingOptionRelations = relations(pricingOption, ({ one }) => ({
  pricing: one(pricing, {
    fields: [pricingOption.pricingId],
    references: [pricing.id],
  }),
}));

export const pricingFeatureRelations = relations(pricingFeature, ({ one }) => ({
  pricing: one(pricing, {
    fields: [pricingFeature.pricingId],
    references: [pricing.id],
  }),
}));

export const certificationGroupRelations = relations(
  certificationGroup,
  ({ many }) => ({
    modules: many(certificationModule),
  })
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

export const pageSectionElementRelations = relations(
  pageSectionElement,
  ({ one, many }) => ({
    images: many(userDocument),
    section: one(pageSection, {
      fields: [pageSectionElement.sectionId],
      references: [pageSection.id],
    }),
  })
);

export const pageSectionRelations = relations(pageSection, ({ one, many }) => ({
  elements: many(pageSectionElement),
  page: one(page, {
    fields: [pageSection.pageId],
    references: [page.id],
  }),
}));

export const pageRelations = relations(page, ({ one, many }) => ({
  sections: many(pageSection),
  club: one(club, {
    fields: [page.clubId],
    references: [club.id],
  }),
  coach: one(userCoach, {
    fields: [page.coachId],
    references: [userCoach.userId],
  }),
  event: one(event, {
    fields: [page.eventId],
    references: [event.id],
  }),
}));

export const planningRelations = relations(planning, ({ one, many }) => ({
  club: one(club, {
    fields: [planning.clubId],
    references: [club.id],
  }),
  site: one(site, {
    fields: [planning.siteId],
    references: [site.id],
  }),
  room: one(room, {
    fields: [planning.roomId],
    references: [room.id],
  }),
  coach: one(userCoach, {
    fields: [planning.coachId],
    references: [userCoach.userId],
  }),
  planningActivities: many(planningActivity),
}));

export const planningActivityRelations = relations(
  planningActivity,
  ({ one, many }) => ({
    planning: one(planning, {
      fields: [planningActivity.planningId],
      references: [planning.id],
    }),
    activity: one(activity, {
      fields: [planningActivity.activityId],
      references: [activity.id],
    }),
    site: one(site, {
      fields: [planningActivity.siteId],
      references: [site.id],
    }),
    room: one(room, {
      fields: [planningActivity.roomId],
      references: [room.id],
    }),
    coach: one(userCoach, {
      fields: [planningActivity.coachId],
      references: [userCoach.userId],
    }),
    reservations: many(reservation),
  })
);

export const reservationRelations = relations(reservation, ({ one }) => ({
  planningActivity: one(planningActivity, {
    fields: [reservation.planningActivityId],
    references: [planningActivity.id],
  }),
  activity: one(activity, {
    fields: [reservation.activityId],
    references: [activity.id],
  }),
  room: one(room, {
    fields: [reservation.roomId],
    references: [room.id],
  }),
  user: one(user, {
    fields: [reservation.userId],
    references: [user.id],
  }),
}));

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
