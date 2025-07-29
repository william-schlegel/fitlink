import nextI18nConfig from "@root/next-i18next.config.mjs";
import { CoachDisplay } from "@sections/coach";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { createContextInner } from "@trpcserver/context";
import { appRouter } from "@trpcserver/router/_app";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import superjson from "superjson";

function CoachPresentation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  return <CoachDisplay pageId={props.pageId} />;
}

export default CoachPresentation;

export const getServerSideProps = async ({
  locale,
  params,
}: GetServerSidePropsContext) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({ session: null }),
    transformer: superjson,
  });

  const pageId = (params?.pageId as string) ?? "";
  ssg.pages.getCoachPage.prefetch(pageId);

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["pages", "coach"],
        nextI18nConfig
      )),
      pageId,
    },
  };
};
