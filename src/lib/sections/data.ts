import { pageSectionModelEnum, pageTargetEnum } from "@/db/schema/enums";

export type PageTarget = (typeof pageTargetEnum.enumValues)[number];
export type PageSectionModel = (typeof pageSectionModelEnum.enumValues)[number];

export const PAGE_TARGET_LIST: {
  value: PageTarget;
  label: string;
}[] = [
  { value: "HOME", label: "target.home" },
  { value: "ACTIVITIES", label: "target.activities" },
  { value: "OFFERS", label: "target.offers" },
  { value: "TEAM", label: "target.team" },
  { value: "PLANNING", label: "target.planning" },
  { value: "VIDEOS", label: "target.videos" },
  { value: "EVENTS", label: "target.events" },
] as const;

export const PAGE_SECTION_LIST: {
  value: PageSectionModel;
  label: string;
}[] = [
  { value: "HERO", label: "section.hero" },
  { value: "TITLE", label: "section.title" },
  { value: "PLANNINGS", label: "section.plannings" },
  { value: "ACTIVITY_GROUPS", label: "section.activity-groups" },
  { value: "ACTIVITIES", label: "section.activity-details" },
  { value: "OFFERS", label: "section.offers" },
  { value: "VIDEO", label: "section.video" },
  { value: "LOCATION", label: "section.location" },
  { value: "CONTACT", label: "section.contact" },
  { value: "SOCIAL", label: "section.social" },
  { value: "TEAMMATES", label: "section.teammates" },
  { value: "FOOTER", label: "section.footer" },
] as const;

export const TARGET_SECTIONS: {
  target: PageTarget;
  sections: PageSectionModel[];
}[] = [
  {
    target: "HOME",
    sections: ["HERO", "ACTIVITY_GROUPS", "ACTIVITIES", "CONTACT", "LOCATION"],
  },
  {
    target: "OFFERS",
    sections: ["TITLE", "OFFERS"],
  },
  {
    target: "ACTIVITIES",
    sections: ["TITLE", "ACTIVITY_GROUPS", "ACTIVITIES"],
  },
  { target: "PLANNING", sections: ["TITLE", "PLANNINGS"] },
  { target: "TEAM", sections: ["TITLE", "TEAMMATES"] },
];

export function getDefaultSection(
  target: PageTarget | undefined,
): PageSectionModel {
  if (!target) return "HERO";
  const ts = TARGET_SECTIONS.find((ts) => ts.target === target);
  return ts?.sections?.[0] ?? "HERO";
}
