import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ExternalLink } from "lucide-react";

import { DeleteUser, UpdateUser } from "@/components/modals/manageUser";
import CardGroup from "@/components/ui/cardGroup";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/shadcn";
import { UserId } from "@/db/types";
import { formatMoney } from "@/lib/formatNumber";
import { getUserFullById } from "@/server/api/routers/users";

type UserContentProps = {
  userId: UserId;
};

export default async function UserContent({ userId }: UserContentProps) {
  const userQuery = await getUserFullById(userId);

  const t = await getTranslations();

  const isInTrial =
    userQuery?.trialUntil && new Date(userQuery.trialUntil) > new Date();

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
      <section className="grid xl:grid-cols-2 gap-2">
        <Card className="bg-transparent">
          <CardHeader>
            <h2 className="flex items-center justify-between gap-2">
              {t("admin.user.plan")}
              <Badge variant="info">
                {t(`common.roles.${userQuery?.internalRole ?? "MEMBER"}`)}
              </Badge>
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Badge variant="info">{userQuery?.pricing?.title}</Badge>
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
            </div>
            {userQuery?.internalRole === "MANAGER" ||
            userQuery?.internalRole === "MANAGER_COACH" ? (
              <>
                <h3>{t("admin.user.manager-activity")}</h3>
                <CardGroup
                  size="sm"
                  maxWidth={100}
                  cards={[
                    {
                      title: t("dashboard.clubs", {
                        count:
                          userQuery?.managerData?.managedClubs?.length ?? 0,
                      }),
                      value: userQuery?.managerData?.managedClubs?.length ?? 0,
                    },
                    {
                      title: t("dashboard.sites", {
                        count: managerCount.sites,
                      }),
                      value: managerCount.sites,
                    },
                    {
                      title: t("dashboard.activities", {
                        count: managerCount.activities,
                      }),
                      value: managerCount.activities,
                    },
                    {
                      title: t("dashboard.members", {
                        count: managerCount.members,
                      }),
                      value: managerCount.members,
                    },
                  ]}
                />
              </>
            ) : null}
            {userQuery?.internalRole === "COACH" ||
            userQuery?.internalRole === "MANAGER_COACH" ? (
              <>
                <h3>{t("admin.user.coach-activity")}</h3>
                <CardGroup
                  size="sm"
                  maxWidth={100}
                  cards={[
                    {
                      title: t("dashboard.clubs", { count: 0 }),
                      value: 0,
                    },
                    {
                      title: t("dashboard.certifications", {
                        count: userQuery.coachData?.certifications.length ?? 0,
                      }),
                      value: userQuery.coachData?.certifications.length ?? 0,
                    },
                    {
                      title: t("dashboard.rating"),
                      value:
                        userQuery.coachData?.rating?.toFixed(1) ??
                        t("admin.user.unrated"),
                    },
                  ]}
                />
              </>
            ) : null}
            {(userQuery?.internalRole === "COACH" ||
              userQuery?.internalRole === "MANAGER_COACH") &&
            userQuery?.coachData?.page &&
            userQuery.coachData.page.published ? (
              <Button asChild>
                <Link
                  href={`/presentation-page/coach/${userId}/${userQuery.coachData.page.id}`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                >
                  {t("pages.page-preview")}
                  <ExternalLink size={16} />
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <Card className="bg-transparent">
          <CardHeader>
            <h2>{t("admin.user.payments")}</h2>
          </CardHeader>
          <CardContent className="space-y-4"></CardContent>
        </Card>
      </section>
    </div>
  );
}
