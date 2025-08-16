CREATE TYPE "public"."CoachMarketPlaceType" AS ENUM('SEARCH', 'OFFER');--> statement-breakpoint
CREATE TYPE "public"."CoachingLevelList" AS ENUM('ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'COMPETITOR', 'PROFESSIONAL');--> statement-breakpoint
CREATE TYPE "public"."CoachingTarget" AS ENUM('INDIVIDUAL', 'COMPANY');--> statement-breakpoint
CREATE TYPE "public"."DayName" AS ENUM('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');--> statement-breakpoint
CREATE TYPE "public"."Feature" AS ENUM('COACH_OFFER', 'COACH_OFFER_COMPANY', 'COACH_CERTIFICATION', 'COACH_MEETING', 'COACH_MARKET_PLACE', 'MANAGER_MULTI_CLUB', 'MANAGER_MULTI_SITE', 'MANAGER_ROOM', 'MANAGER_EVENT', 'MANAGER_PLANNING', 'MANAGER_COACH', 'MANAGER_MARKET_PLACE', 'MANAGER_SHOP', 'MANAGER_EMPLOYEES');--> statement-breakpoint
CREATE TYPE "public"."NotificationType" AS ENUM('SEARCH_COACH', 'SEARCH_CLUB', 'COACH_ACCEPT', 'COACH_REFUSE', 'CLUB_ACCEPT', 'CLUB_REFUSE', 'NEW_MESSAGE', 'NEW_SUBSCRIPTION', 'NEW_REQUEST', 'SUBSCRIPTION_VALIDATED', 'SUBSCRIPTION_REJECTED', 'REQUEST_VALIDATED', 'REQUEST_REJECTED');--> statement-breakpoint
CREATE TYPE "public"."PackMode" AS ENUM('PHYSICAL', 'WEBCAM');--> statement-breakpoint
CREATE TYPE "public"."PageSectionElementType" AS ENUM('HERO_CONTENT', 'CTA', 'CARD', 'OPENING_TIME', 'MAP', 'FEATURE', 'BUTTON', 'NEWSLETTER', 'OPTION');--> statement-breakpoint
CREATE TYPE "public"."PageSectionModel" AS ENUM('HERO', 'TITLE', 'PLANNINGS', 'ACTIVITY_GROUPS', 'ACTIVITIES', 'OFFERS', 'VIDEO', 'LOCATION', 'SOCIAL', 'TEAMMATES', 'CONTACT', 'FOOTER');--> statement-breakpoint
CREATE TYPE "public"."PageTarget" AS ENUM('HOME', 'ACTIVITIES', 'OFFERS', 'TEAM', 'PLANNING', 'VIDEOS', 'EVENTS');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('MEMBER', 'COACH', 'MANAGER', 'MANAGER_COACH', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."RoomReservation" AS ENUM('NONE', 'POSSIBLE', 'MANDATORY');--> statement-breakpoint
CREATE TYPE "public"."SubscriptionMode" AS ENUM('ALL_INCLUSIVE', 'ACTIVITY_GROUP', 'ACTIVITY', 'DAY', 'COURSE');--> statement-breakpoint
CREATE TYPE "public"."SubscriptionRestriction" AS ENUM('CLUB', 'SITE', 'ROOM');--> statement-breakpoint
CREATE TYPE "public"."UserDocumentType" AS ENUM('DOCUMENT', 'IMAGE', 'PROFILE_IMAGE', 'PAGE_IMAGE', 'CERTIFICATION', 'MEDICAL_CERTIFICAT');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"profile_image_id" text,
	"internal_role" "Role" DEFAULT 'MEMBER',
	"pricing_id" text,
	"monthly_payment" boolean DEFAULT false,
	"trial_until" timestamp,
	"due_date" timestamp,
	"cancelation_date" timestamp,
	"phone" text,
	"address" text,
	"chat_token" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"role" text DEFAULT 'regular',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "VerificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "VerificationToken_token_unique" UNIQUE("token"),
	CONSTRAINT "VerificationToken_identifier_token_unique" UNIQUE("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "Activity" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"group_id" text NOT NULL,
	"club_id" text NOT NULL,
	"no_calendar" boolean DEFAULT false,
	"reservation_duration" integer DEFAULT 60
);
--> statement-breakpoint
CREATE TABLE "ActivityGroup" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"default" boolean DEFAULT false,
	"coach_id" text
);
--> statement-breakpoint
CREATE TABLE "Club" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"manager_id" text NOT NULL,
	"page_style" text DEFAULT 'light',
	"logo_id" text,
	CONSTRAINT "Club_logo_id_unique" UNIQUE("logo_id")
);
--> statement-breakpoint
CREATE TABLE "club_coachs" (
	"club_id" text NOT NULL,
	"coach_user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_members" (
	"club_id" text NOT NULL,
	"member_user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CoachingActivity" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"coach_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Event" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"name" text NOT NULL,
	"brief" text NOT NULL,
	"description" text NOT NULL,
	"page_id" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"start_display" timestamp DEFAULT now() NOT NULL,
	"end_display" timestamp NOT NULL,
	"banner_text" text NOT NULL,
	"cancelled" boolean NOT NULL,
	"document_id" text,
	"price" real NOT NULL,
	"free" boolean NOT NULL,
	"address" text NOT NULL,
	"search_address" text,
	"latitude" real DEFAULT 48.8583701,
	"longitude" real DEFAULT 2.2944813,
	CONSTRAINT "Event_document_id_unique" UNIQUE("document_id")
);
--> statement-breakpoint
CREATE TABLE "Room" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"reservation" "RoomReservation" DEFAULT 'NONE',
	"capacity" integer NOT NULL,
	"unavailable" boolean DEFAULT false,
	"open_with_club" boolean DEFAULT true,
	"open_with_site" boolean DEFAULT true,
	"site_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_activities" (
	"room_id" text NOT NULL,
	"activity_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Site" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"search_address" text,
	"latitude" real DEFAULT 48.8583701,
	"longitude" real DEFAULT 2.2944813,
	"club_id" text NOT NULL,
	"open_with_club" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "Certification" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"obtained_in" timestamp NOT NULL,
	"document_id" text,
	"coach_id" text NOT NULL,
	"manual_module" text,
	CONSTRAINT "Certification_document_id_unique" UNIQUE("document_id")
);
--> statement-breakpoint
CREATE TABLE "certification_activity_groups" (
	"certification_id" text NOT NULL,
	"activity_group_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certification_certification_modules" (
	"certification_id" text NOT NULL,
	"certification_module_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CertificationGroup" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CertificationModule" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"certification_group_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certification_module_activity_groups" (
	"certification_module_id" text NOT NULL,
	"activity_group_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CoachMarketPlace" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "CoachMarketPlaceType" NOT NULL,
	"club_id" text,
	"coach_id" text,
	"publication_date" timestamp NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"views" integer NOT NULL,
	"displays" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_market_place_activity_groups" (
	"coach_market_place_id" text NOT NULL,
	"activity_group_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_market_place_certifications" (
	"coach_market_place_id" text NOT NULL,
	"certification_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_market_place_sites" (
	"coach_market_place_id" text NOT NULL,
	"site_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CoachingLevel" (
	"id" text PRIMARY KEY NOT NULL,
	"offer_id" text NOT NULL,
	"level" "CoachingLevelList" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CoachingPrice" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"target" "CoachingTarget" DEFAULT 'INDIVIDUAL',
	"excluding_taxes" boolean DEFAULT false,
	"description" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"physical" boolean DEFAULT false,
	"in_house" boolean DEFAULT false,
	"my_place" boolean DEFAULT false,
	"public_place" boolean DEFAULT false,
	"per_hour_physical" real DEFAULT 0,
	"per_day_physical" real DEFAULT 0,
	"travel_fee" real DEFAULT 0,
	"travel_limit" integer DEFAULT 0,
	"webcam" boolean NOT NULL,
	"per_hour_webcam" real DEFAULT 0,
	"per_day_webcam" real DEFAULT 0,
	"free_hours" integer DEFAULT 0,
	"coach_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CoachingPricePack" (
	"id" text PRIMARY KEY NOT NULL,
	"nb_hours" integer DEFAULT 1,
	"pack_price" real DEFAULT 0,
	"mode" "PackMode" DEFAULT 'PHYSICAL',
	"coaching_price_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Page" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"target" "PageTarget" DEFAULT 'HOME',
	"club_id" text,
	"coach_id" text,
	"published" boolean DEFAULT false,
	"event_id" text,
	CONSTRAINT "Page_coach_id_unique" UNIQUE("coach_id"),
	CONSTRAINT "Page_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "PageSection" (
	"id" text PRIMARY KEY NOT NULL,
	"model" "PageSectionModel" NOT NULL,
	"title" text,
	"sub_title" text,
	"page_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PageSectionElement" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"sub_title" text,
	"element_type" "PageSectionElementType",
	"content" text,
	"link" text,
	"page_id" text,
	"page_section" "PageSectionModel",
	"section_id" text NOT NULL,
	"option_value" text
);
--> statement-breakpoint
CREATE TABLE "DayOpeningTime" (
	"id" text PRIMARY KEY NOT NULL,
	"name" "DayName" NOT NULL,
	"whole_day" boolean DEFAULT false,
	"closed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "day_opening_time_calendars" (
	"day_opening_time_id" text NOT NULL,
	"opening_calendar_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OpeningCalendar" (
	"id" text PRIMARY KEY NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opening_calendar_clubs" (
	"opening_calendar_id" text NOT NULL,
	"club_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opening_calendar_rooms" (
	"opening_calendar_id" text NOT NULL,
	"room_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opening_calendar_sites" (
	"opening_calendar_id" text NOT NULL,
	"site_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OpeningTime" (
	"id" text PRIMARY KEY NOT NULL,
	"opening" text NOT NULL,
	"closing" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opening_time_days" (
	"opening_time_id" text NOT NULL,
	"day_opening_time_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Planning" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"club_id" text NOT NULL,
	"site_id" text,
	"room_id" text,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"coach_id" text
);
--> statement-breakpoint
CREATE TABLE "PlanningActivity" (
	"id" text PRIMARY KEY NOT NULL,
	"planning_id" text NOT NULL,
	"activity_id" text NOT NULL,
	"site_id" text NOT NULL,
	"room_id" text,
	"day" "DayName" NOT NULL,
	"start_time" text NOT NULL,
	"duration" integer NOT NULL,
	"coach_id" text
);
--> statement-breakpoint
CREATE TABLE "Reservation" (
	"id" text PRIMARY KEY NOT NULL,
	"planning_activity_id" text,
	"activity_id" text,
	"activity_slot" integer,
	"date" timestamp NOT NULL,
	"room_id" text,
	"user_id" text NOT NULL,
	"reservation_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Paiement" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"amount" real NOT NULL,
	"paiement_date" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"role_target" "Role" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"free" boolean DEFAULT false,
	"highlighted" boolean DEFAULT false,
	"monthly" real DEFAULT 0,
	"yearly" real DEFAULT 0,
	"deleted" boolean DEFAULT false,
	"deletion_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "PricingFeature" (
	"id" text PRIMARY KEY NOT NULL,
	"feature" "Feature" NOT NULL,
	"pricing_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "PricingOption" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"weight" integer NOT NULL,
	"pricing_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"mode" "SubscriptionMode" DEFAULT 'ALL_INCLUSIVE',
	"restriction" "SubscriptionRestriction" DEFAULT 'CLUB',
	"highlight" text NOT NULL,
	"description" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"deletion_date" timestamp,
	"monthly" real DEFAULT 0,
	"yearly" real DEFAULT 0,
	"cancelation_fee" real DEFAULT 0,
	"inscription_fee" real DEFAULT 0,
	"day" "DayName",
	"club_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_to_activity" (
	"subscription_id" text NOT NULL,
	"activity_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_to_activity_group" (
	"subscription_id" text NOT NULL,
	"activity_group_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_to_room" (
	"subscription_id" text NOT NULL,
	"room_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_to_site" (
	"subscription_id" text NOT NULL,
	"site_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserCoach" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"public_name" text,
	"description" text,
	"about_me" text,
	"search_address" text,
	"latitude" real DEFAULT 48.8583701,
	"longitude" real DEFAULT 2.2944813,
	"range" real DEFAULT 10,
	"facebook_link" text,
	"twitter_link" text,
	"youtube_link" text,
	"instagram_link" text,
	"rating" real DEFAULT 0,
	"page_style" text DEFAULT 'light',
	CONSTRAINT "UserCoach_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "UserDocument" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"document_type" "UserDocumentType" DEFAULT 'DOCUMENT',
	"file_type" text NOT NULL,
	"file_name" text
);
--> statement-breakpoint
CREATE TABLE "UserManager" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "UserManager_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "UserMember" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"inscription_fee_offered" boolean DEFAULT false,
	"cancelation_fee_offered" boolean DEFAULT false,
	"subscription_start" timestamp,
	CONSTRAINT "UserMember_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_member_to_subscription" (
	"user_id" text NOT NULL,
	"subscription_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserNotification" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "NotificationType" NOT NULL,
	"user_to_id" text NOT NULL,
	"user_from_id" text NOT NULL,
	"message" text NOT NULL,
	"view_date" timestamp,
	"date" timestamp DEFAULT now() NOT NULL,
	"data" json,
	"answered" timestamp,
	"answer" text,
	"linked_notification" text
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_activity" ADD CONSTRAINT "subscription_to_activity_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_activity" ADD CONSTRAINT "subscription_to_activity_activity_id_Activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_activity_group" ADD CONSTRAINT "subscription_to_activity_group_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_activity_group" ADD CONSTRAINT "subscription_to_activity_group_activity_group_id_ActivityGroup_id_fk" FOREIGN KEY ("activity_group_id") REFERENCES "public"."ActivityGroup"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_room" ADD CONSTRAINT "subscription_to_room_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_room" ADD CONSTRAINT "subscription_to_room_room_id_Room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."Room"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_site" ADD CONSTRAINT "subscription_to_site_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_site" ADD CONSTRAINT "subscription_to_site_site_id_Site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."Site"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_member_to_subscription" ADD CONSTRAINT "user_member_to_subscription_user_id_UserMember_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."UserMember"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_member_to_subscription" ADD CONSTRAINT "user_member_to_subscription_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_pricing_idx" ON "user" USING btree ("pricing_id");--> statement-breakpoint
CREATE INDEX "activity_group_idx" ON "Activity" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "activity_club_idx" ON "Activity" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "activity_group_coach_idx" ON "ActivityGroup" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "club_manager_idx" ON "Club" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "club_logo_idx" ON "Club" USING btree ("logo_id");--> statement-breakpoint
CREATE INDEX "coaching_activity_coach_idx" ON "CoachingActivity" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "event_page_idx" ON "Event" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "event_club_idx" ON "Event" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "room_site_idx" ON "Room" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "site_club_idx" ON "Site" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "certification_coach_idx" ON "Certification" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "certification_module_certification_group_idx" ON "CertificationModule" USING btree ("certification_group_id");--> statement-breakpoint
CREATE INDEX "coach_market_place_club_idx" ON "CoachMarketPlace" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "coach_market_place_coach_idx" ON "CoachMarketPlace" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coaching_level_offer_idx" ON "CoachingLevel" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "coaching_price_coach_idx" ON "CoachingPrice" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coaching_price_pack_coaching_price_idx" ON "CoachingPricePack" USING btree ("coaching_price_id");--> statement-breakpoint
CREATE INDEX "page_club_idx" ON "Page" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "page_coach_idx" ON "Page" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "page_event_idx" ON "Page" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "page_section_page_idx" ON "PageSection" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "page_section_element_section_idx" ON "PageSectionElement" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "planning_club_idx" ON "Planning" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "planning_site_idx" ON "Planning" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "planning_room_idx" ON "Planning" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "planning_coach_idx" ON "Planning" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "planning_activity_planning_idx" ON "PlanningActivity" USING btree ("planning_id");--> statement-breakpoint
CREATE INDEX "planning_activity_activity_idx" ON "PlanningActivity" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "planning_activity_site_idx" ON "PlanningActivity" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "planning_activity_room_idx" ON "PlanningActivity" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "planning_activity_coach_idx" ON "PlanningActivity" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "reservation_room_idx" ON "Reservation" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "reservation_activity_idx" ON "Reservation" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "reservation_planning_activity_idx" ON "Reservation" USING btree ("planning_activity_id");--> statement-breakpoint
CREATE INDEX "reservation_user_idx" ON "Reservation" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "paiement_user_idx" ON "Paiement" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "paiement_subscription_idx" ON "Paiement" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "pricing_feature_pricing_idx" ON "PricingFeature" USING btree ("pricing_id");--> statement-breakpoint
CREATE INDEX "pricing_option_pricing_idx" ON "PricingOption" USING btree ("pricing_id");--> statement-breakpoint
CREATE INDEX "subscription_club_idx" ON "Subscription" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "subscription_to_activity_idx" ON "subscription_to_activity" USING btree ("subscription_id","activity_id");--> statement-breakpoint
CREATE INDEX "subscription_to_activity_group_idx" ON "subscription_to_activity_group" USING btree ("subscription_id","activity_group_id");--> statement-breakpoint
CREATE INDEX "subscription_to_room_idx" ON "subscription_to_room" USING btree ("subscription_id","room_id");--> statement-breakpoint
CREATE INDEX "subscription_to_site_idx" ON "subscription_to_site" USING btree ("subscription_id","site_id");--> statement-breakpoint
CREATE INDEX "user_coach_user_idx" ON "UserCoach" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_document_user_idx" ON "UserDocument" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_member_to_subscription_idx" ON "user_member_to_subscription" USING btree ("user_id","subscription_id");--> statement-breakpoint
CREATE INDEX "user_notification_user_to_idx" ON "UserNotification" USING btree ("user_to_id");--> statement-breakpoint
CREATE INDEX "user_notification_user_from_idx" ON "UserNotification" USING btree ("user_from_id");