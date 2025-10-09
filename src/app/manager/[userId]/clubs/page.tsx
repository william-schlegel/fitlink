import { getTranslations } from "next-intl/server";
import { twMerge } from "tailwind-merge";
import { headers } from "next/headers";
import Link from "next/link";

import { getUserById } from "@/server/api/routers/users";
import CreateClub from "@/components/modals/manageClub";
import LockedButton from "@/components/ui/lockedButton";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import { ClubContent } from "./clubContent";
import createLink from "@/lib/createLink";
import Title from "@/components/title";

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
  const { features } = await getUserById(userId, { withFeatures: true });
  const headerList = await headers();
  const href = headerList.get("x-current-href");

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title
        title={t("club.manage-my-club", { count: clubQuery?.length ?? 0 })}
      />
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("club.manage-my-club", { count: clubQuery?.length ?? 0 })}</h1>
        {features.includes("MANAGER_MULTI_CLUB") || !clubQuery?.length ? (
          <CreateClub />
        ) : (
          <LockedButton label={t("club.create-new")} limited />
        )}
      </div>
      <div className="flex gap-4">
        <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
          {clubQuery?.map((club) => (
            <li key={club.id}>
              <Link
                href={createLink({ clubId: club.id }, href)}
                className={twMerge(
                  "w-full text-center",
                  clubId === club.id && "badge badge-primary",
                )}
              >
                {club.name}
              </Link>
            </li>
          ))}
        </ul>

        {clubId === "" ? null : <ClubContent userId={userId} clubId={clubId} />}
      </div>
    </div>
  );
}
