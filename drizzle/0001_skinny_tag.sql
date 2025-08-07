CREATE TABLE "user_member_to_subscription" (
	"user_id" text NOT NULL,
	"subscription_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_member_to_subscription" ADD CONSTRAINT "user_member_to_subscription_user_id_UserMember_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."UserMember"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_member_to_subscription" ADD CONSTRAINT "user_member_to_subscription_subscription_id_Subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."Subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_member_to_subscription_idx" ON "user_member_to_subscription" USING btree ("user_id","subscription_id");