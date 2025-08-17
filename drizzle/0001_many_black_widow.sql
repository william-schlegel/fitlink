CREATE TABLE "ClubCoachs" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"coach_user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ClubMembers" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" text NOT NULL,
	"member_user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "RoomActivities" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"activity_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DayOpeningTimeCalendars" (
	"id" text PRIMARY KEY NOT NULL,
	"day_opening_time_id" text NOT NULL,
	"opening_calendar_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OpeningCalendarClubs" (
	"id" text PRIMARY KEY NOT NULL,
	"opening_calendar_id" text NOT NULL,
	"club_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OpeningCalendarPlannings" (
	"id" text PRIMARY KEY NOT NULL,
	"opening_calendar_id" text NOT NULL,
	"planning_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OpeningCalendarRooms" (
	"id" text PRIMARY KEY NOT NULL,
	"opening_calendar_id" text NOT NULL,
	"room_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OpeningCalendarSites" (
	"id" text PRIMARY KEY NOT NULL,
	"opening_calendar_id" text NOT NULL,
	"site_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "OpeningTimeDays" (
	"id" text PRIMARY KEY NOT NULL,
	"opening_time_id" text NOT NULL,
	"day_opening_time_id" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "club_coachs" CASCADE;--> statement-breakpoint
DROP TABLE "club_members" CASCADE;--> statement-breakpoint
DROP TABLE "room_activities" CASCADE;--> statement-breakpoint
DROP TABLE "day_opening_time_calendars" CASCADE;--> statement-breakpoint
DROP TABLE "opening_calendar_clubs" CASCADE;--> statement-breakpoint
DROP TABLE "opening_calendar_rooms" CASCADE;--> statement-breakpoint
DROP TABLE "opening_calendar_sites" CASCADE;--> statement-breakpoint
DROP TABLE "opening_time_days" CASCADE;--> statement-breakpoint
ALTER TABLE "ClubCoachs" ADD CONSTRAINT "ClubCoachs_club_id_Club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."Club"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ClubCoachs" ADD CONSTRAINT "ClubCoachs_coach_user_id_UserCoach_user_id_fk" FOREIGN KEY ("coach_user_id") REFERENCES "public"."UserCoach"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ClubMembers" ADD CONSTRAINT "ClubMembers_club_id_Club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."Club"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ClubMembers" ADD CONSTRAINT "ClubMembers_member_user_id_UserMember_user_id_fk" FOREIGN KEY ("member_user_id") REFERENCES "public"."UserMember"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RoomActivities" ADD CONSTRAINT "RoomActivities_room_id_Room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."Room"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "RoomActivities" ADD CONSTRAINT "RoomActivities_activity_id_Activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."Activity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DayOpeningTimeCalendars" ADD CONSTRAINT "DayOpeningTimeCalendars_day_opening_time_id_DayOpeningTime_id_fk" FOREIGN KEY ("day_opening_time_id") REFERENCES "public"."DayOpeningTime"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DayOpeningTimeCalendars" ADD CONSTRAINT "DayOpeningTimeCalendars_opening_calendar_id_OpeningCalendar_id_fk" FOREIGN KEY ("opening_calendar_id") REFERENCES "public"."OpeningCalendar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OpeningCalendarClubs" ADD CONSTRAINT "OpeningCalendarClubs_opening_calendar_id_OpeningCalendar_id_fk" FOREIGN KEY ("opening_calendar_id") REFERENCES "public"."OpeningCalendar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OpeningCalendarClubs" ADD CONSTRAINT "OpeningCalendarClubs_club_id_Club_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."Club"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OpeningCalendarPlannings" ADD CONSTRAINT "OpeningCalendarPlannings_opening_calendar_id_OpeningCalendar_id_fk" FOREIGN KEY ("opening_calendar_id") REFERENCES "public"."OpeningCalendar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OpeningCalendarPlannings" ADD CONSTRAINT "OpeningCalendarPlannings_planning_id_Planning_id_fk" FOREIGN KEY ("planning_id") REFERENCES "public"."Planning"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OpeningCalendarRooms" ADD CONSTRAINT "OpeningCalendarRooms_opening_calendar_id_OpeningCalendar_id_fk" FOREIGN KEY ("opening_calendar_id") REFERENCES "public"."OpeningCalendar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OpeningCalendarRooms" ADD CONSTRAINT "OpeningCalendarRooms_room_id_Room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."Room"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OpeningCalendarSites" ADD CONSTRAINT "OpeningCalendarSites_opening_calendar_id_OpeningCalendar_id_fk" FOREIGN KEY ("opening_calendar_id") REFERENCES "public"."OpeningCalendar"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OpeningCalendarSites" ADD CONSTRAINT "OpeningCalendarSites_site_id_Site_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."Site"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OpeningTimeDays" ADD CONSTRAINT "OpeningTimeDays_opening_time_id_OpeningTime_id_fk" FOREIGN KEY ("opening_time_id") REFERENCES "public"."OpeningTime"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OpeningTimeDays" ADD CONSTRAINT "OpeningTimeDays_day_opening_time_id_DayOpeningTime_id_fk" FOREIGN KEY ("day_opening_time_id") REFERENCES "public"."DayOpeningTime"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "club_coachs_club_idx" ON "ClubCoachs" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "club_coachs_coach_idx" ON "ClubCoachs" USING btree ("coach_user_id");--> statement-breakpoint
CREATE INDEX "club_members_club_idx" ON "ClubMembers" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "club_members_member_idx" ON "ClubMembers" USING btree ("member_user_id");--> statement-breakpoint
CREATE INDEX "room_activities_room_idx" ON "RoomActivities" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "room_activities_activity_idx" ON "RoomActivities" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "day_opening_time_calendars_day_idx" ON "DayOpeningTimeCalendars" USING btree ("day_opening_time_id");--> statement-breakpoint
CREATE INDEX "day_opening_time_calendars_calendar_idx" ON "DayOpeningTimeCalendars" USING btree ("opening_calendar_id");--> statement-breakpoint
CREATE INDEX "opening_calendar_clubs_calendar_idx" ON "OpeningCalendarClubs" USING btree ("opening_calendar_id");--> statement-breakpoint
CREATE INDEX "opening_calendar_clubs_club_idx" ON "OpeningCalendarClubs" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "opening_calendar_plannings_calendar_idx" ON "OpeningCalendarPlannings" USING btree ("opening_calendar_id");--> statement-breakpoint
CREATE INDEX "opening_calendar_plannings_planning_idx" ON "OpeningCalendarPlannings" USING btree ("planning_id");--> statement-breakpoint
CREATE INDEX "opening_calendar_rooms_calendar_idx" ON "OpeningCalendarRooms" USING btree ("opening_calendar_id");--> statement-breakpoint
CREATE INDEX "opening_calendar_rooms_room_idx" ON "OpeningCalendarRooms" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "opening_calendar_sites_calendar_idx" ON "OpeningCalendarSites" USING btree ("opening_calendar_id");--> statement-breakpoint
CREATE INDEX "opening_calendar_sites_site_idx" ON "OpeningCalendarSites" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "opening_time_days_time_idx" ON "OpeningTimeDays" USING btree ("opening_time_id");--> statement-breakpoint
CREATE INDEX "opening_time_days_day_idx" ON "OpeningTimeDays" USING btree ("day_opening_time_id");