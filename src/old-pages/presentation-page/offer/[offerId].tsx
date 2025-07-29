import { isCUID } from "@lib/checkValidity";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { CoachOfferPage } from "@sections/coachOffer";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { trpc } from "@trpcclient/trpc";
import { createContextInner } from "@trpcserver/context";
import { appRouter } from "@trpcserver/router/_app";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import superjson from "superjson";

function Offer(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const offerData = trpc.coachs.getOfferWithDetails.useQuery(props.offerId, {
    enabled: isCUID(props.offerId),
  });

  return (
    <div
      data-theme={offerData.data?.coach?.pageStyle ?? "light"}
      className="flex min-h-screen flex-col items-center justify-center"
    >
      <Head>
        <title>{offerData.data?.coach?.publicName ?? ""}</title>
      </Head>
      <CoachOfferPage offerId={props.offerId} />
    </div>
  );
}
export default Offer;

export const getServerSideProps = async ({
  locale,
  params,
}: GetServerSidePropsContext) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({ session: null }),
    transformer: superjson,
  });

  const offerId = (params?.offerId as string) ?? "";
  ssg.coachs.getOfferWithDetails.prefetch(offerId);

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["pages", "coach"],
        nextI18nConfig
      )),
      offerId,
    },
  };
};
