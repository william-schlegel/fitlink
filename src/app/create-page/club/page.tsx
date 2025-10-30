import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { CreatePage } from "@/components/modals/managePage";
import { getPagesForClub } from "@/server/api/routers/page";
import createLink, { createHref } from "@/lib/createLink";
import { LayoutPage } from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import SelectClub from "@/components/selectClub";
import { getHref } from "@/lib/getHref";
import PageContent from "./pageContent";
import Title from "@/components/title";
import TargetName from "./targetName";

export default async function ClubPage({
  searchParams,
}: {
  searchParams: Promise<{
    userId: string;
    clubId: string;
    pageId: string;
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

  const { userId, clubId, pageId } = await searchParams;
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
        <i
          className={`bx bx-xs aspect-square rounded-full bg-base-100 ${
            page.published ? "bx-check text-success" : "bx-x text-error"
          }`}
        />
      </div>
    ),
  }));

  return (
    <LayoutPage
      title={t("club.manage-page")}
      titleComponents={<SelectClub clubId={clubId} clubs={queryClubs} />}
    >
      <LayoutPage.Main>
        <LayoutPage.List
          list={listPages}
          itemId={pageId}
          noItemsText={t("club.no-page")}
        >
          <CreatePage clubId={clubId} />
        </LayoutPage.List>

        {pageId ? <PageContent clubId={clubId} pageId={pageId} /> : null}
      </LayoutPage.Main>
    </LayoutPage>
  );
}
