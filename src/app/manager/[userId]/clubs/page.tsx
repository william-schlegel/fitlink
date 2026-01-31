import { getTranslations } from "next-intl/server";

import { redirect, RedirectType } from "next/navigation";

import {
  LayoutPage,
  LayoutPageList,
  LayoutPageMain,
} from "@/components/layoutPage";
import CreateClub from "@/components/modals/manageClub";
import LockedButton from "@/components/ui/lockedButton";
import { ClubId, UserId } from "@/db/types";
import { getActualUser } from "@/lib/auth/server";
import createLink from "@/lib/createLink";
import { getHref } from "@/lib/getHref";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { ClubContent } from "./clubContent";

export default async function ManageClubs({
  params,
  searchParams,
}: {
  params: Promise<{ userId: UserId }>;
  searchParams: Promise<{ clubId: ClubId }>;
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
      <LayoutPageMain>
        <LayoutPageList
          list={listClubs}
          itemId={clubId}
          noItemsText={t("club.no-club")}
        />

        {clubId === "" ? null : <ClubContent userId={userId} clubId={clubId} />}
      </LayoutPageMain>
    </LayoutPage>
  );
}
