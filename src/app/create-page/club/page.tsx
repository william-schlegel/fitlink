import { getTranslations } from "next-intl/server";
import { redirect, RedirectType } from "next/navigation";

import { Check, X } from "lucide-react";

import {
  LayoutPage,
  LayoutPageList,
  LayoutPageMain,
} from "@/components/layoutPage";
import { CreatePage } from "@/components/modals/managePage";
import SelectClub from "@/components/selectClub";
import { getActualUser } from "@/lib/auth/server";
import createLink, { createHref } from "@/lib/createLink";
import { getHref } from "@/lib/getHref";
import { getDefaultSection, PageSectionModel } from "@/lib/sections/data";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getPagesForClub } from "@/server/api/routers/page";
import PageContent from "./pageContent";
import TargetName from "./targetName";
export default async function ClubPage({
  searchParams,
}: {
  searchParams: Promise<{
    userId: string;
    clubId: string;
    pageId: string;
    section?: PageSectionModel;
  }>;
}) {
  const t = await getTranslations("pages");

  const user = await getActualUser();
  if (
    !user ||
    (user.internalRole !== "MANAGER" &&
      user.internalRole !== "MANAGER_COACH" &&
      user.internalRole !== "ADMIN")
  )
    redirect("/", RedirectType.replace);

  const { userId, clubId, pageId, section } = await searchParams;
  const href = await getHref();
  const caller = await createTrpcCaller();
  if (!caller) return null;
  const queryClubs = await caller.clubs.getClubsForManager(userId ?? user.id);

  if (queryClubs.length && !clubId)
    redirect(
      createLink({ clubId: queryClubs[0]?.id, pageId: pageId ?? "" }, href),
      RedirectType.replace,
    );

  const queryPages = await getPagesForClub(clubId);

  if (queryPages.length && !pageId)
    redirect(createLink({ clubId, pageId: queryPages[0]?.id }, href));

  const target = queryPages.find((p) => p.id === pageId)?.target ?? "HOME";

  const listPages = queryPages.map((page) => ({
    id: page.id,
    name: page.name,
    link: createHref(href, ["create-page", "club"], {
      clubId,
      pageId: page.id,
    }),
    badgeText: (
      <div className="flex items-center gap-2">
        <TargetName target={page.target ?? "HOME"} />
        {page.published ? (
          <Check className="text-green-500 size-4" />
        ) : (
          <X className="text-red-500 size-4" />
        )}
      </div>
    ),
  }));

  return (
    <LayoutPage
      title={t("club.manage-page")}
      titleComponents={<SelectClub clubId={clubId} clubs={queryClubs} />}
    >
      <LayoutPageMain>
        <LayoutPageList
          list={listPages}
          itemId={pageId}
          noItemsText={t("club.no-page")}
        >
          <CreatePage clubId={clubId} className="mb-4" />
        </LayoutPageList>

        {pageId ? (
          <PageContent
            clubId={clubId}
            pageId={pageId}
            section={section ?? getDefaultSection(target)}
          />
        ) : null}
      </LayoutPageMain>
    </LayoutPage>
  );
}
