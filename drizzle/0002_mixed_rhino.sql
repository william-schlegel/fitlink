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
DROP TABLE "subscription_activities" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_activity_groups" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_rooms" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_sites" CASCADE;--> statement-breakpoint
DROP TABLE "subscription_users" CASCADE;--> statement-breakpoint
ALTER TABLE "subscription_to_activity" ADD CONSTRAINT "subscription_to_activity_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_activity" ADD CONSTRAINT "subscription_to_activity_activity_id_Activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_activity_group" ADD CONSTRAINT "subscription_to_activity_group_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_activity_group" ADD CONSTRAINT "subscription_to_activity_group_activity_group_id_ActivityGroup_id_fk" FOREIGN KEY ("activity_group_id") REFERENCES "public"."ActivityGroup"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_room" ADD CONSTRAINT "subscription_to_room_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_room" ADD CONSTRAINT "subscription_to_room_room_id_Room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."Room"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_site" ADD CONSTRAINT "subscription_to_site_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_to_site" ADD CONSTRAINT "subscription_to_site_site_id_Site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."Site"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_to_activity_idx" ON "subscription_to_activity" USING btree ("subscription_id","activity_id");--> statement-breakpoint
CREATE INDEX "subscription_to_activity_group_idx" ON "subscription_to_activity_group" USING btree ("subscription_id","activity_group_id");--> statement-breakpoint
CREATE INDEX "subscription_to_room_idx" ON "subscription_to_room" USING btree ("subscription_id","room_id");--> statement-breakpoint
CREATE INDEX "subscription_to_site_idx" ON "subscription_to_site" USING btree ("subscription_id","site_id");