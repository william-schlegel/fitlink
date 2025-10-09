"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";

import {
  DeletePage,
  PageSectionModel,
  UpdatePage,
  usePageSection,
} from "@/components/modals/managePage";
import { ActivityGroupCreation } from "@/components/sections/activities";
import { PlanningCreation } from "@/components/sections/planning";
import { ActivityCreation } from "@/components/sections/activity";
import { OfferCreation } from "@/components/sections/offers";
import { TitleCreation } from "@/components/sections/title";
import { HeroCreation } from "@/components/sections/hero";
import Spinner from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import { toast } from "@/lib/toast";

type PageContentProps = {
  pageId: string;
  clubId: string;
};

export default function PageContent({ pageId, clubId }: PageContentProps) {
  const queryPage = trpc.pages.getPageById.useQuery(pageId, {
    enabled: isCUID(pageId),
    refetchOnWindowFocus: false,
  });
  const { getSectionName, getSections, defaultSection } = usePageSection();

  useEffect(() => {
    if (!queryPage.data) return;
    console.log("queryPage.data", queryPage.data);
    if (queryPage.data?.target) {
      setSections(getSections(queryPage.data.target));
      setSection(defaultSection(queryPage.data.target));
    }
  }, [queryPage.data, getSections, defaultSection]);

  const [sections, setSections] = useState<PageSectionModel[]>([]);
  const [section, setSection] = useState<PageSectionModel>("HERO");
  const t = useTranslations("pages");
  const utils = trpc.useUtils();

  const publishPage = trpc.pages.updatePagePublication.useMutation({
    onSuccess(data) {
      utils.pages.getPageById.invalidate(pageId);
      utils.pages.getPagesForClub.invalidate(clubId);
      toast.success(
        t(data[0].published ? "page-published" : "page-unpublished"),
      );
    },
  });

  console.log("section", section);

  if (queryPage.isLoading) return <Spinner />;
  return (
    <article className="flex flex-grow flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between">
        <h2> {queryPage.data?.name}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="pill">
            <div className="form-control">
              <label className="label cursor-pointer gap-4">
                <span className="label-text">{t("publish-page")}</span>
                <input
                  type="checkbox"
                  className="checkbox-primary checkbox"
                  checked={queryPage.data?.published ?? false}
                  onChange={(e) =>
                    publishPage.mutate({
                      pageId,
                      published: e.target.checked,
                    })
                  }
                />
              </label>
            </div>
          </div>
          <Link
            href={`/presentation-page/club/${clubId}/${pageId}`}
            target="_blank"
            referrerPolicy="no-referrer"
            className="btn btn-primary flex gap-2"
          >
            {t("page-preview")}
            <i className="bx bx-link-external bx-xs" />
          </Link>

          <UpdatePage clubId={clubId} pageId={pageId} size="md" />
          <DeletePage clubId={clubId} pageId={pageId} size="md" />
        </div>
      </div>
      <div className="btn-group flex-wrap">
        {sections.map((sec) => (
          <button
            key={sec}
            className={`btn btn-primary flex-1 ${
              sec === section ? "" : "btn-outline"
            }`}
            onClick={() => setSection(sec)}
          >
            {getSectionName(sec)}
          </button>
        ))}
      </div>
      <div className="w-full">
        {section === "HERO" && <HeroCreation clubId={clubId} pageId={pageId} />}
        {section === "TITLE" && (
          <TitleCreation clubId={clubId} pageId={pageId} />
        )}
        {section === "PLANNINGS" && (
          <PlanningCreation clubId={clubId} pageId={pageId} />
        )}
        {section === "ACTIVITY_GROUPS" && (
          <ActivityGroupCreation clubId={clubId} pageId={pageId} />
        )}
        {section === "ACTIVITIES" && (
          <ActivityCreation clubId={clubId} pageId={pageId} />
        )}
        {section === "OFFERS" && (
          <OfferCreation clubId={clubId} pageId={pageId} />
        )}
      </div>
    </article>
  );
}
