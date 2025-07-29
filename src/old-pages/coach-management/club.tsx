import { authOptions } from "@auth/[...nextauth]";
import { Role } from "@prisma/client";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { trpc } from "@trpcclient/trpc";
import { useTranslation } from "next-i18next";
import Layout from "@root/src/components/layout";
import { AddCoachToClub, CoachDataPresentation } from "@modals/manageClub";
import { isCUID } from "@lib/checkValidity";
import { useRouter } from "next/router";
import Link from "next/link";
import createLink from "@lib/createLink";

function CoachManagementForClub({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation("club");
  const router = useRouter();
  const clubId = router.query.clubId as string;
  const coachId = router.query.coachId as string;
  const queryClubs = trpc.clubs.getClubsForManager.useQuery(userId, {
    onSuccess(data) {
      if (!clubId) router.push(createLink({ clubId: data[0]?.id, coachId }));
    },
  });
  const queryCoachs = trpc.coachs.getCoachsForClub.useQuery(clubId, {
    enabled: isCUID(clubId),
    onSuccess(data) {
      if (!coachId) router.push(createLink({ clubId, coachId: data[0]?.id }));
    },
  });
  const queryCoach = trpc.coachs.getCoachById.useQuery(coachId, {
    enabled: isCUID(coachId),
  });

  return (
    <Layout
      title={t("common:navigation.coach-management")}
      className="container mx-auto my-2 space-y-2 p-2"
    >
      <h1 className="flex items-center">
        {t("common:navigation.coach-management")}
        <div className="ml-auto flex items-center gap-2">
          <label>{t("select-club")}</label>
          <select
            className="w-48 min-w-fit"
            value={clubId}
            onChange={(e) => {
              router.push(
                createLink({ clubId: e.target.value, coachId: undefined })
              );
            }}
          >
            {queryClubs.data?.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
      </h1>
      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="min-w-fit space-y-2 lg:max-w-xs">
          <h4>{t("coach.coachs")}</h4>
          <AddCoachToClub clubId={clubId} userId={userId} />
          <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
            {queryCoachs.data?.map((coach) => (
              <li key={coach.id}>
                <Link
                  href={createLink({ clubId, coachId: coach.id })}
                  className={`w-full text-center ${
                    coachId === coach.id ? "active" : ""
                  }`}
                >
                  {coach.name}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        {queryCoach.data ? (
          <CoachDataPresentation
            url={queryCoach.data.imageUrl}
            activityGroups={
              queryCoach.data.coachData?.activityGroups?.map((ag) => ({
                id: ag.id,
                name: ag.name,
              })) ?? []
            }
            certifications={
              queryCoach.data.coachData?.certifications?.map((cert) => ({
                id: cert.id,
                name: cert.name,
                modules: cert.modules.map((mod) => ({
                  id: mod.id,
                  name: mod.name,
                })),
              })) ?? []
            }
            rating={queryCoach.data.coachData?.rating ?? 0}
            id={queryCoach.data.id ?? ""}
            pageId={queryCoach.data.coachData?.page?.id}
          />
        ) : null}
      </div>
    </Layout>
  );
}

export default CoachManagementForClub;

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (
    session?.user?.role !== Role.MANAGER &&
    session?.user?.role !== Role.MANAGER_COACH &&
    session?.user?.role !== Role.ADMIN
  )
    return {
      redirect: {
        permanent: false,
        destination: "/",
      },
      props: {
        userId: "",
      },
    };

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "club", "coach", "home"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
