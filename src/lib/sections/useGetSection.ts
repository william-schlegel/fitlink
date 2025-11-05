import { useTranslations } from "next-intl";
import { useCallback } from "react";

import {
  getDefaultSection,
  PAGE_SECTION_LIST,
  PAGE_TARGET_LIST,
  PageSectionModel,
  PageTarget,
  TARGET_SECTIONS,
} from "./data";
import { pageTargetEnum } from "@/db/schema/enums";

export function usePageSection() {
  const t = useTranslations("pages");
  const getTargetName = useCallback(
    (target: (typeof pageTargetEnum.enumValues)[number] | undefined) => {
      if (!target) return "?";
      const tg = PAGE_TARGET_LIST.find((t) => t.value === target);
      if (tg) return t(tg.label);
      return "?";
    },
    [t],
  );

  const getSectionName = useCallback(
    (section: PageSectionModel | undefined) => {
      if (!section) return "?";
      const sc = PAGE_SECTION_LIST.find((s) => s.value === section);
      if (sc) return t(sc.label);
      return "?";
    },
    [t],
  );

  const defaultSection = useCallback(
    (target: PageTarget | undefined): PageSectionModel =>
      getDefaultSection(target),
    [],
  );

  const getSections = useCallback((target: PageTarget): PageSectionModel[] => {
    const ts = TARGET_SECTIONS.find((ts) => ts.target === target);
    return ts?.sections ?? [];
  }, []);

  return { getTargetName, getSectionName, defaultSection, getSections };
}
