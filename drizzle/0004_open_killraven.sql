CREATE TYPE "public"."ChannelType" AS ENUM('PRIVATE', 'CLUB', 'COACH', 'GROUP');--> statement-breakpoint
CREATE TYPE "public"."MessageType" AS ENUM('TEXT', 'IMAGE');--> statement-breakpoint
CREATE TYPE "public"."ReactionType" AS ENUM('LIKE', 'LOVE', 'LOL', 'SAD', 'GRRR', 'WOAH', 'CHECK', 'STRENGTH', 'FIST');--> statement-breakpoint
CREATE TABLE "Channel" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "ChannelType" DEFAULT 'PRIVATE' NOT NULL,
	"image_urls" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by_user_id" text
);
--> statement-breakpoint
CREATE TABLE "ChannelUsers" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"is_admin" boolean DEFAULT false,
	"is_moderator" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "DirectConversation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_a_id" text NOT NULL,
	"user_b_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_a_last_read_at" timestamp,
	"user_b_last_read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "Message" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text,
	"direct_conversation_id" text,
	"user_id" text NOT NULL,
	"type" "MessageType" DEFAULT 'TEXT' NOT NULL,
	"content" text,
	"image_urls" text[] DEFAULT '{}',
	"reply_to_message_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "MessageReaction" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"user_id" text NOT NULL,
	"type" "ReactionType" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CertificationModuleActivityGroups" (
	"id" text PRIMARY KEY NOT NULL,
	"certification_module_id" text NOT NULL,
	"activity_group_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CertificationOrganism" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CertificationOrganismModules" (
	"id" text PRIMARY KEY NOT NULL,
	"certification_organism_id" text NOT NULL,
	"certification_module_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CoachCertification" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"obtained_in" timestamp NOT NULL,
	"document_url" text,
	"coach_id" text NOT NULL,
	"manual_module" text,
	CONSTRAINT "CoachCertification_document_url_unique" UNIQUE("document_url")
);
--> statement-breakpoint
CREATE TABLE "CoachMarketPlaceActivityGroups" (
	"coach_market_place_id" text NOT NULL,
	"activity_group_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CoachMarketPlaceCertifications" (
	"coach_market_place_id" text NOT NULL,
	"certification_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CoachMarketPlaceSites" (
	"coach_market_place_id" text NOT NULL,
	"site_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "CoachOrganisms" (
	"id" text PRIMARY KEY NOT NULL,
	"coach_user_id" text NOT NULL,
	"certification_organism_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SelectedModuleForCoach" (
	"coach_id" text NOT NULL,
	"certification_id" text NOT NULL,
	"certification_module_id" text NOT NULL,
	"certification_organism_id" text NOT NULL,
	CONSTRAINT "SelectedModuleForCoach_coach_id_certification_id_certification_module_id_certification_organism_id_pk" PRIMARY KEY("coach_id","certification_id","certification_module_id","certification_organism_id")
);
--> statement-breakpoint
CREATE TABLE "SubscriptionToActivity" (
	"subscription_id" text NOT NULL,
	"activity_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SubscriptionToActivityGroup" (
	"subscription_id" text NOT NULL,
	"activity_group_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SubscriptionToRoom" (
	"subscription_id" text NOT NULL,
	"room_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SubscriptionToSite" (
	"subscription_id" text NOT NULL,
	"site_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "UserMemberToSubscription" (
	"user_id" text NOT NULL,
	"subscription_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Certification" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "certification_activity_groups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "certification_certification_modules" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "CertificationGroup" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "certification_module_activity_groups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "coach_market_place_activity_groups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "coach_market_place_certifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "coach_market_place_sites" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "PageSectionElementDocuments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_to_activity" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_to_activity_group" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_to_room" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subscription_to_site" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "UserDocument" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_member_to_subscription" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "Certification" CASCADE;--> statement-breakpoint
DROP TABLE "certification_activity_groups" CASCADE;--> statement-breakpoint
DROP TABLE "certification_certification_modules" CASCADE;--> statement-breakpoint
DROP TABLE "CertificationGroup" CASCADE;--> statement-breakpoint
DROP TABLE "certification_module_activity_groups" CASCADE;--> statement-breakpoint
DROP TABLE "coach_market_place_activity_groups" CASCADE;--> statement-breakpoint
DROP TABLE "coach_market_place_certifications" CASCADE;--> statement-breakpoint
DROP TABLE "coach_market_place_sites" CASCADE;--> statement-breakpoint
DROP TABLE "PageSectionElementDocuments" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_to_activity" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_to_activity_group" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_to_room" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_to_site" CASCADE;--> statement-breakpoint
DROP TABLE "UserDocument" CASCADE;--> statement-breakpoint
DROP TABLE "user_member_to_subscription" CASCADE;--> statement-breakpoint
ALTER TABLE "Club" RENAME COLUMN "logo_id" TO "logo_url";--> statement-breakpoint
ALTER TABLE "Event" RENAME COLUMN "document_id" TO "image_urls";--> statement-breakpoint
ALTER TABLE "CertificationModule" RENAME COLUMN "certification_group_id" TO "certification_organism_id";--> statement-breakpoint
ALTER TABLE "Club" DROP CONSTRAINT "Club_logo_id_unique";--> statement-breakpoint
ALTER TABLE "Event" DROP CONSTRAINT "Event_document_id_unique";--> statement-breakpoint
DROP INDEX "club_logo_idx";--> statement-breakpoint
DROP INDEX "certification_module_certification_group_idx";--> statement-breakpoint
ALTER TABLE "Club" ADD COLUMN "chat_group_id" text;--> statement-breakpoint
ALTER TABLE "PageSectionElement" ADD COLUMN "image_urls" text[];--> statement-breakpoint
ALTER TABLE "CertificationModuleActivityGroups" ADD CONSTRAINT "CertificationModuleActivityGroups_certification_module_id_CertificationModule_id_fk" FOREIGN KEY ("certification_module_id") REFERENCES "public"."CertificationModule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CertificationModuleActivityGroups" ADD CONSTRAINT "CertificationModuleActivityGroups_activity_group_id_ActivityGroup_id_fk" FOREIGN KEY ("activity_group_id") REFERENCES "public"."ActivityGroup"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CertificationOrganismModules" ADD CONSTRAINT "CertificationOrganismModules_certification_organism_id_CertificationOrganism_id_fk" FOREIGN KEY ("certification_organism_id") REFERENCES "public"."CertificationOrganism"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CertificationOrganismModules" ADD CONSTRAINT "CertificationOrganismModules_certification_module_id_CertificationModule_id_fk" FOREIGN KEY ("certification_module_id") REFERENCES "public"."CertificationModule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoachMarketPlaceActivityGroups" ADD CONSTRAINT "CoachMarketPlaceActivityGroups_coach_market_place_id_CoachMarketPlace_id_fk" FOREIGN KEY ("coach_market_place_id") REFERENCES "public"."CoachMarketPlace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoachMarketPlaceActivityGroups" ADD CONSTRAINT "CoachMarketPlaceActivityGroups_activity_group_id_ActivityGroup_id_fk" FOREIGN KEY ("activity_group_id") REFERENCES "public"."ActivityGroup"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoachMarketPlaceCertifications" ADD CONSTRAINT "CoachMarketPlaceCertifications_coach_market_place_id_CoachMarketPlace_id_fk" FOREIGN KEY ("coach_market_place_id") REFERENCES "public"."CoachMarketPlace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoachMarketPlaceCertifications" ADD CONSTRAINT "CoachMarketPlaceCertifications_certification_id_CoachCertification_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."CoachCertification"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoachMarketPlaceSites" ADD CONSTRAINT "CoachMarketPlaceSites_coach_market_place_id_CoachMarketPlace_id_fk" FOREIGN KEY ("coach_market_place_id") REFERENCES "public"."CoachMarketPlace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoachMarketPlaceSites" ADD CONSTRAINT "CoachMarketPlaceSites_site_id_Site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."Site"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoachOrganisms" ADD CONSTRAINT "CoachOrganisms_coach_user_id_UserCoach_user_id_fk" FOREIGN KEY ("coach_user_id") REFERENCES "public"."UserCoach"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CoachOrganisms" ADD CONSTRAINT "CoachOrganisms_certification_organism_id_CertificationOrganism_id_fk" FOREIGN KEY ("certification_organism_id") REFERENCES "public"."CertificationOrganism"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SelectedModuleForCoach" ADD CONSTRAINT "SelectedModuleForCoach_coach_id_UserCoach_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."UserCoach"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SelectedModuleForCoach" ADD CONSTRAINT "SelectedModuleForCoach_certification_id_CoachCertification_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."CoachCertification"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SelectedModuleForCoach" ADD CONSTRAINT "SelectedModuleForCoach_certification_module_id_CertificationModule_id_fk" FOREIGN KEY ("certification_module_id") REFERENCES "public"."CertificationModule"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SelectedModuleForCoach" ADD CONSTRAINT "SelectedModuleForCoach_certification_organism_id_CertificationOrganism_id_fk" FOREIGN KEY ("certification_organism_id") REFERENCES "public"."CertificationOrganism"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubscriptionToActivity" ADD CONSTRAINT "SubscriptionToActivity_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubscriptionToActivity" ADD CONSTRAINT "SubscriptionToActivity_activity_id_Activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubscriptionToActivityGroup" ADD CONSTRAINT "SubscriptionToActivityGroup_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubscriptionToActivityGroup" ADD CONSTRAINT "SubscriptionToActivityGroup_activity_group_id_ActivityGroup_id_fk" FOREIGN KEY ("activity_group_id") REFERENCES "public"."ActivityGroup"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubscriptionToRoom" ADD CONSTRAINT "SubscriptionToRoom_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubscriptionToRoom" ADD CONSTRAINT "SubscriptionToRoom_room_id_Room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."Room"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubscriptionToSite" ADD CONSTRAINT "SubscriptionToSite_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SubscriptionToSite" ADD CONSTRAINT "SubscriptionToSite_site_id_Site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."Site"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserMemberToSubscription" ADD CONSTRAINT "UserMemberToSubscription_user_id_UserMember_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."UserMember"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "UserMemberToSubscription" ADD CONSTRAINT "UserMemberToSubscription_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "channel_name_idx" ON "Channel" USING btree ("name");--> statement-breakpoint
CREATE INDEX "channel_created_by_idx" ON "Channel" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "channel_users_channel_idx" ON "ChannelUsers" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "channel_users_user_idx" ON "ChannelUsers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "channel_users_admin_idx" ON "ChannelUsers" USING btree ("channel_id","is_admin");--> statement-breakpoint
CREATE INDEX "channel_users_moderator_idx" ON "ChannelUsers" USING btree ("channel_id","is_moderator");--> statement-breakpoint
CREATE INDEX "channel_users_read_idx" ON "ChannelUsers" USING btree ("channel_id","last_read_at");--> statement-breakpoint
CREATE INDEX "channel_users_unique" ON "ChannelUsers" USING btree ("channel_id","user_id");--> statement-breakpoint
CREATE INDEX "direct_conversation_user_a_idx" ON "DirectConversation" USING btree ("user_a_id");--> statement-breakpoint
CREATE INDEX "direct_conversation_user_b_idx" ON "DirectConversation" USING btree ("user_b_id");--> statement-breakpoint
CREATE INDEX "direct_conversation_unique_pair" ON "DirectConversation" USING btree ("user_a_id","user_b_id");--> statement-breakpoint
CREATE INDEX "direct_conversation_user_a_read_idx" ON "DirectConversation" USING btree ("user_a_id","user_a_last_read_at");--> statement-breakpoint
CREATE INDEX "direct_conversation_user_b_read_idx" ON "DirectConversation" USING btree ("user_b_id","user_b_last_read_at");--> statement-breakpoint
CREATE INDEX "message_channel_idx" ON "Message" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "message_direct_conversation_idx" ON "Message" USING btree ("direct_conversation_id");--> statement-breakpoint
CREATE INDEX "message_user_idx" ON "Message" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_reply_to_idx" ON "Message" USING btree ("reply_to_message_id");--> statement-breakpoint
CREATE INDEX "message_channel_created_idx" ON "Message" USING btree ("channel_id","created_at");--> statement-breakpoint
CREATE INDEX "message_direct_created_idx" ON "Message" USING btree ("direct_conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "message_reaction_message_idx" ON "MessageReaction" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "message_reaction_user_idx" ON "MessageReaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_reaction_unique" ON "MessageReaction" USING btree ("message_id","user_id","type");--> statement-breakpoint
CREATE INDEX "cert_mod_act_groups_mod_idx" ON "CertificationModuleActivityGroups" USING btree ("certification_module_id");--> statement-breakpoint
CREATE INDEX "cert_mod_act_groups_grp_idx" ON "CertificationModuleActivityGroups" USING btree ("activity_group_id");--> statement-breakpoint
CREATE INDEX "cert_org_modules_org_idx" ON "CertificationOrganismModules" USING btree ("certification_organism_id");--> statement-breakpoint
CREATE INDEX "cert_org_modules_mod_idx" ON "CertificationOrganismModules" USING btree ("certification_module_id");--> statement-breakpoint
CREATE INDEX "certification_coach_idx" ON "CoachCertification" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "coach_organisms_coach_idx" ON "CoachOrganisms" USING btree ("coach_user_id");--> statement-breakpoint
CREATE INDEX "coach_organisms_org_idx" ON "CoachOrganisms" USING btree ("certification_organism_id");--> statement-breakpoint
CREATE INDEX "subscription_to_activity_idx" ON "SubscriptionToActivity" USING btree ("subscription_id","activity_id");--> statement-breakpoint
CREATE INDEX "subscription_to_activity_group_idx" ON "SubscriptionToActivityGroup" USING btree ("subscription_id","activity_group_id");--> statement-breakpoint
CREATE INDEX "subscription_to_room_idx" ON "SubscriptionToRoom" USING btree ("subscription_id","room_id");--> statement-breakpoint
CREATE INDEX "subscription_to_site_idx" ON "SubscriptionToSite" USING btree ("subscription_id","site_id");--> statement-breakpoint
CREATE INDEX "user_member_to_subscription_idx" ON "UserMemberToSubscription" USING btree ("user_id","subscription_id");--> statement-breakpoint
CREATE INDEX "certification_module_certification_organism_idx" ON "CertificationModule" USING btree ("certification_organism_id");--> statement-breakpoint
ALTER TABLE "Club" ADD CONSTRAINT "Club_logo_url_unique" UNIQUE("logo_url");