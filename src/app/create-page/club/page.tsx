import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";

import { CreatePage } from "@/components/modals/managePage";
import { getPagesForClub } from "@/server/api/routers/page";
import createLink, { createHref } from "@/lib/createLink";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import SelectClub from "@/components/selectClub";
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
  const headerList = await headers();
  const href = headerList.get("x-current-href");

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

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("club.manage-page")} />
      <h1 className="flex items-center">
        {t("club.manage-page")}
        <SelectClub clubId={clubId} clubs={queryClubs} />
      </h1>
      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="min-w-fit space-y-2">
          <h4>{t("club.pages")}</h4>
          <CreatePage clubId={clubId} />
          <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
            {queryPages?.map((page) => (
              <li key={page.id}>
                <div
                  className={pageId === page.id ? "badge badge-primary" : ""}
                >
                  <Link
                    href={createHref(href, ["create-page", "club"], {
                      clubId,
                      pageId: page.id,
                    })}
                    className="flex flex-1 items-center justify-between gap-2"
                  >
                    <span>{page.name}</span>
                    <div className="flex items-center gap-2">
                      <TargetName target={page.target ?? "HOME"} />
                      <i
                        className={`bx bx-xs aspect-square rounded-full bg-base-100 ${
                          page.published
                            ? "bx-check text-success"
                            : "bx-x text-error"
                        }`}
                      />
                    </div>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        {pageId ? <PageContent clubId={clubId} pageId={pageId} /> : null}
      </div>
    </div>
  );
}
