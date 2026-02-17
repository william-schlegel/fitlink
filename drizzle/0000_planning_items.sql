-- Planning items extraction from Planning.planning_data
CREATE TABLE "PlanningItem" (
  "id" text PRIMARY KEY,
  "planning_id" text NOT NULL,
  "club_id" text NOT NULL,
  "activity_id" text NOT NULL,
  "day" "DayName" NOT NULL,
  "start_time" text NOT NULL,
  "duration" integer NOT NULL,
  "coach_user_id" text,
  "room_id" text,
  "site_id" text,
  "deleted" boolean NOT NULL DEFAULT false,
  "no_calendar" boolean NOT NULL DEFAULT false
);

CREATE INDEX "planning_item_planning_idx" ON "PlanningItem" ("planning_id");
CREATE INDEX "planning_item_club_idx" ON "PlanningItem" ("club_id");
CREATE INDEX "planning_item_activity_idx" ON "PlanningItem" ("activity_id");
CREATE INDEX "planning_item_site_idx" ON "PlanningItem" ("site_id");
CREATE INDEX "planning_item_room_idx" ON "PlanningItem" ("room_id");
CREATE INDEX "planning_item_coach_idx" ON "PlanningItem" ("coach_user_id");

ALTER TABLE "Reservation" ADD COLUMN "planning_item_id" text;
CREATE INDEX "reservation_planning_item_idx" ON "Reservation" ("planning_item_id");

ALTER TABLE "Course" ADD COLUMN "planning_item_id" text;
CREATE INDEX "course_planning_item_idx" ON "Course" ("planning_item_id");
CREATE UNIQUE INDEX "course_planning_item_date_idx"
  ON "Course" ("planning_item_id", "date");

INSERT INTO "PlanningItem" (
  "id",
  "planning_id",
  "club_id",
  "activity_id",
  "day",
  "start_time",
  "duration",
  "coach_user_id",
  "room_id",
  "site_id",
  "deleted",
  "no_calendar"
)
SELECT
  item->>'slotId' AS "id",
  p."id" AS "planning_id",
  p."club_id" AS "club_id",
  item->>'activityId' AS "activity_id",
  (item->>'day')::"DayName" AS "day",
  item->>'startTime' AS "start_time",
  (item->>'duration')::integer AS "duration",
  NULLIF(item->>'coachUserId', '') AS "coach_user_id",
  NULLIF(item->>'roomId', '') AS "room_id",
  NULLIF(item->>'siteId', '') AS "site_id",
  COALESCE((item->>'deleted')::boolean, false) AS "deleted",
  COALESCE((item->>'noCalendar')::boolean, false) AS "no_calendar"
FROM "Planning" p
CROSS JOIN LATERAL json_array_elements(
  COALESCE(p."planning_data", '[]'::json)
) AS item;

UPDATE "Reservation"
SET "planning_item_id" = "slot_id"
WHERE "slot_id" IS NOT NULL;

UPDATE "Course"
SET "planning_item_id" = "slot_id"
WHERE "slot_id" IS NOT NULL;

ALTER TABLE "Course" ALTER COLUMN "planning_item_id" SET NOT NULL;

ALTER TABLE "Reservation" DROP COLUMN "slot_id";
ALTER TABLE "Course" DROP COLUMN "slot_id";
ALTER TABLE "Planning" DROP COLUMN "planning_data";
