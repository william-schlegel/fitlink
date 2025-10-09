import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { DeleteUser, UpdateUser } from "@/components/modals/manageUser";
import { getUserFullById } from "@/server/api/routers/users";
import { formatMoney } from "@/lib/formatNumber";
import Periodicity from "./periodicity";

type UserContentProps = {
  userId: string;
};

export default async function UserContent({ userId }: UserContentProps) {
  const userQuery = await getUserFullById(userId);

  const t = await getTranslations();

  const isInTrial =
    userQuery?.trialUntil &&
    new Date(userQuery.trialUntil) > new Date(Date.now());

  const managerCount = userQuery?.managerData?.managedClubs?.reduce(
    (acc, c) => {
      acc.sites += c.sites.length;
      acc.activities += c.activities.length;
      acc.members += c.subscriptions.length;
      return acc;
    },
    { sites: 0, activities: 0, members: 0 },
  ) ?? { sites: 0, activities: 0, members: 0 };

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2>{userQuery?.name}</h2>
          <p>({userQuery?.email})</p>
        </div>
        <div className="flex items-center gap-2">
          <UpdateUser userId={userId} />
          <DeleteUser userId={userId} />
        </div>
      </div>
      <section className="grid grid-cols-2 gap-2">
        <article className="flex flex-col gap-2 rounded-md border border-primary p-2">
          <h2 className="flex items-center justify-between gap-2">
            {t("admin.user.plan")}
            <span className="badge-primary badge">
              {t(`common.roles.${userQuery?.internalRole ?? "MEMBER"}`)}
            </span>
          </h2>
          {isInTrial && (
            <div className="alert alert-info">
              {t("admin.user.trial-until", {
                trialDate: userQuery?.trialUntil
                  ? new Date(userQuery.trialUntil).toLocaleDateString()
                  : "",
              })}
            </div>
          )}
          <div className="flex items-center gap-2">
            <span>{t("admin.user.pricing")}</span>
            <span className="rounded border border-secondary px-2 py-1 text-secondary">
              {userQuery?.pricing?.title}
            </span>
            <span>
              {userQuery?.pricing?.free
                ? t("admin.pricing.free")
                : userQuery?.monthlyPayment
                  ? `${formatMoney(userQuery?.pricing?.monthly)}${t(
                      "admin.user.per-month",
                    )}`
                  : `${formatMoney(userQuery?.pricing?.yearly)}${t(
                      "admin.user.per-year",
                    )}`}
            </span>
            <Periodicity
              userId={userId}
              monthlyPayment={userQuery?.monthlyPayment ?? false}
            />
          </div>
          {userQuery?.internalRole === "MANAGER" ||
          userQuery?.internalRole === "MANAGER_COACH" ? (
            <>
              <h3>{t("admin.user.manager-activity")}</h3>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">
                    {t("dashboard.clubs", {
                      count: userQuery?.managerData?.managedClubs?.length ?? 0,
                    })}
                  </div>
                  <div className="stat-value text-primary">
                    {userQuery?.managerData?.managedClubs?.length}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">
                    {t("dashboard.sites", { count: managerCount.sites })}
                  </div>
                  <div className="stat-value text-primary">
                    {managerCount.sites}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">
                    {t("dashboard.activities", {
                      count: managerCount.activities,
                    })}
                  </div>
                  <div className="stat-value text-primary">
                    {managerCount.activities}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">
                    {t("dashboard.members", { count: managerCount.members })}
                  </div>
                  <div className="stat-value text-primary">
                    {managerCount.members}
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {userQuery?.internalRole === "COACH" ||
          userQuery?.internalRole === "MANAGER_COACH" ? (
            <>
              <h3>{t("admin.user.coach-activity")}</h3>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">
                    {t("dashboard.clubs", {
                      count: 0, // userQuery?.coachData?.clubs?.length ?? 0,
                    })}
                  </div>
                  <div className="stat-value text-primary">
                    {/* {userQuery?.coachData?.clubs?.length ?? 0} */}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">
                    {t("dashboard.certifications", {
                      count: userQuery.coachData?.certifications.length ?? 0,
                    })}
                  </div>
                  <div className="stat-value text-primary">
                    {userQuery.coachData?.certifications.length ?? 0}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">{t("dashboard.rating")}</div>
                  <div className="stat-value text-primary">
                    {userQuery.coachData?.rating?.toFixed(1) ??
                      t("admin.user.unrated")}
                  </div>
                </div>
              </div>
            </>
          ) : null}
          {(userQuery?.internalRole === "COACH" ||
            userQuery?.internalRole === "MANAGER_COACH") &&
          userQuery?.coachData?.page &&
          userQuery.coachData.page.published ? (
            <Link
              href={`/presentation-page/coach/${userId}/${userQuery.coachData.page.id}`}
              target="_blank"
              referrerPolicy="no-referrer"
              className="btn btn-primary flex gap-2"
            >
              {t("pages.page-preview")}
              <i className="bx bx-link-external bx-xs" />
            </Link>
          ) : null}
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("admin.user.payments")}</h2>
        </article>
      </section>
    </div>
  );
}
