import { boolean, index, pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  pageSectionElementTypeEnum,
  pageSectionModelEnum,
  pageTargetEnum,
} from "./enums";
import { userCoach, userDocument } from "./user";
import { club, event } from "./club";
import { createId } from "@paralleldrive/cuid2";

export const pageSectionElement = pgTable(
  "PageSectionElement",
  {
    id: text("id").primaryKey().$defaultFn(createId),
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

export const pageSection = pgTable(
  "PageSection",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    model: pageSectionModelEnum("model").notNull(),
    title: text("title"),
    subTitle: text("sub_title"),
    pageId: text("page_id").notNull(),
  },
  (table) => [index("page_section_page_idx").on(table.pageId)]
);
export const pageSectionRelations = relations(pageSection, ({ one, many }) => ({
  elements: many(pageSectionElement),
  page: one(page, {
    fields: [pageSection.pageId],
    references: [page.id],
  }),
}));

export const page = pgTable(
  "Page",
  {
    id: text("id").primaryKey().$defaultFn(createId),
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
