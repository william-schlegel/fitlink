import { type GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import Layout from "@root/src/components/layout";
import { useTranslation } from "next-i18next";
import FindClub from "@sections/findClub";
import { useRouter } from "next/router";
import { trpc } from "@trpcclient/trpc";
import { isCUID } from "@lib/checkValidity";

function Subscribe() {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const userId = router.query.userId as string;
  const userQuery = trpc.users.getUserById.useQuery(userId, {
    enabled: isCUID(userId),
  });
  return (
    <Layout
      title={t("new-subscription")}
      className="container mx-auto my-2 space-y-2 p-2"
    >
      <h1 className="flex justify-between">{t("new-subscription")}</h1>
      <h2>{t("find-club")}</h2>
      <p>{t("how-to-subscribe")}</p>
      <FindClub address={userQuery.data?.address ?? ""} />
    </Layout>
  );
}
export default Subscribe;

export const getServerSideProps = async ({
  locale,
}: GetServerSidePropsContext) => {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "auth", "home"],
        nextI18nConfig
      )),
    },
  };
};
