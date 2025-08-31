import { authOptions } from "@auth/[...nextauth]";
import { Role } from "@prisma/client";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import Layout from "@root/src/components/layout";
import { CoachCreation } from "@sections/coach";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import { toast } from "react-toastify";

function CoachPage({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation("pages");
  const queryPage = trpc.pages.getPageForCoach.useQuery(userId);
  const utils = trpc.useContext();
  const publishPage = trpc.pages.updatePagePublication.useMutation({
    onSuccess(data) {
      utils.pages.getPageForCoach.invalidate(userId);
      toast.success(t(data.published ? "page-published" : "page-unpublished"));
    },
  });

  return (
    <Layout
      title={t("coach.manage-page")}
      className="container mx-auto my-2 space-y-2 p-2"
    >
      <h1 className="flex flex-wrap items-center justify-between">
        <span>{t("coach.manage-page")}</span>

        {queryPage.data?.id ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="pill">
              <div className="form-control">
                <label className="label cursor-pointer gap-4">
                  <span className="label-text">{t("publish-page")}</span>
                  <input
                    type="checkbox"
                    className="checkbox-primary checkbox"
                    checked={queryPage.data?.published}
                    onChange={(e) =>
                      publishPage.mutate({
                        pageId: queryPage.data?.id,
                        published: e.target.checked,
                      })
                    }
                  />
                </label>
              </div>
            </div>

            <Link
              href={`/presentation-page/coach/${userId}/${queryPage.data.id}`}
              target="_blank"
              referrerPolicy="no-referrer"
              className="btn btn-primary flex gap-2"
            >
              {t("page-preview")}
              <i className="bx bx-link-external bx-xs" />
            </Link>
          </div>
        ) : null}
      </h1>
      {queryPage.isLoading ? (
        <Spinner />
      ) : queryPage.data?.id ? (
        <CoachCreation userId={userId} pageId={queryPage.data.id} />
      ) : (
        <div>Error</div>
      )}
    </Layout>
  );
}

export default CoachPage;

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (
    session?.user?.role !== Role.COACH &&
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
        ["common", "pages", "coach"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
