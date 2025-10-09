import { redirect, RedirectType } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { twMerge } from "tailwind-merge";
import Link from "next/link";

import { NewGroup } from "@/components/modals/manageActivity";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { getActualUser } from "@/lib/auth/server";
import { AGContent } from "./agContent";
import Title from "@/components/title";

export default async function ActivityGroupManagement({
  searchParams,
}: {
  searchParams: Promise<{ agId?: string }>;
}) {
  const user = await getActualUser();
  if (!user) redirect("/", RedirectType.replace);
  const t = await getTranslations("admin");
  const agId = (await searchParams).agId;
  if (user.internalRole !== "ADMIN") return <div>{t("admin-only")}</div>;

  const caller = await createTrpcCaller();
  if (!caller) return null;
  const agQuery = await caller.activities.getAllActivityGroups();

  if (!agId && agQuery[0]?.id)
    redirect(
      `/admin/activitygroups?agId=${agQuery[0]?.id || ""}`,
      RedirectType.replace,
    );

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("ag.manage-ag")} />
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("ag.manage-ag")}</h1>
        <NewGroup />
      </div>
      <div className="flex gap-4">
        <div className="w-1/4 ">
          <h3>{t("ag.groups")}</h3>
          <ul className="menu overflow-hidden rounded bg-base-100">
            {agQuery?.map((ag) => (
              <li key={ag.id}>
                <Link
                  className={twMerge(
                    "flex w-full items-center justify-between text-center",
                    agId === ag.id && "badge badge-primary",
                  )}
                  href={`/admin/activitygroups?agId=${ag.id}`}
                >
                  <span>{ag.name}</span>
                  {ag.default ? (
                    <i className="bx bxs-star bx-xs text-accent" />
                  ) : (
                    <span className="badge">{ag.coach?.user.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {agId ? <AGContent agId={agId} /> : null}
      </div>
    </div>
  );
}
