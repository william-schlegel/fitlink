import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import superjson from "superjson";
import { createContextInner } from "@trpcserver/context";
import { appRouter } from "@trpcserver/router/_app";
import Layout from "@root/src/components/layout";
import { isCUID } from "@lib/checkValidity";
import { CoachOfferPage } from "@sections/coachOffer";

function OfferPage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  return (
    <Layout>
      <section className="bg-base-100 py-48">
        <div className="container mx-auto">
          <CoachOfferPage offerId={props.offerId} />
        </div>
      </section>
    </Layout>
  );
}

export default OfferPage;

export const getServerSideProps = async ({
  locale,
  params,
}: GetServerSidePropsContext) => {
  const offerId = params?.offerId as string;
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({ session: null }),
    transformer: superjson,
  });

  if (isCUID(offerId)) ssg.coachs.getOfferWithDetails.prefetch(offerId);

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "home", "coach"],
        nextI18nConfig
      )),
      trpcState: ssg.dehydrate(),
      offerId,
    },
  };
};
