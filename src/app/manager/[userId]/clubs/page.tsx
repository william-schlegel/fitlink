import { getTranslations } from "next-intl/server";

import { redirect, RedirectType } from "next/navigation";

import CreateClub from "@/components/modals/manageClub";
import LockedButton from "@/components/ui/lockedButton";
import { LayoutPage } from "@/components/layoutPage";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import { ClubContent } from "./clubContent";
import createLink from "@/lib/createLink";
import { getHref } from "@/lib/getHref";

export default async function ManageClubs({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ clubId: string }>;
}) {
  const user = await getActualUser();
  const t = await getTranslations("club");

  if (
    user?.internalRole !== "MANAGER" &&
    user?.internalRole !== "MANAGER_COACH" &&
    user?.internalRole !== "ADMIN"
  )
    return <div>{t("manager-only")}</div>;

  const userId = (await params).userId;
  const clubId = (await searchParams)?.clubId ?? "";

  const caller = await createTrpcCaller();
  if (!caller) return null;
  const clubQuery = await caller.clubs.getClubsForManager(userId);
  const { features } = await caller.users.getUserById({
    id: userId,
    options: {
      withFeatures: true,
    },
  });
  const href = await getHref();

  if (!clubId && clubQuery?.length)
    redirect(
      createLink({ clubId: clubQuery[0]?.id }, href),
      RedirectType.replace,
    );

  const listClubs = clubQuery?.map((club) => ({
    id: club.id,
    name: club.name,
    link: createLink({ clubId: club.id }, href),
  }));

  return (
    <LayoutPage
      title={t("club.manage-my-club", { count: clubQuery?.length ?? 0 })}
      titleComponents={
        features.includes("MANAGER_MULTI_CLUB") || !clubQuery?.length ? (
          <CreateClub />
        ) : (
          <LockedButton label={t("club.create-new")} limited />
        )
      }
    >
      <LayoutPage.Main>
        <LayoutPage.List
          list={listClubs}
          itemId={clubId}
          noItemsText={t("club.no-club")}
        />

        {clubId === "" ? null : <ClubContent userId={userId} clubId={clubId} />}
      </LayoutPage.Main>
    </LayoutPage>
  );
}
