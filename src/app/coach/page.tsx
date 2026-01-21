import { getTranslations } from "next-intl/server";

import { Bell, UserCheck, Video } from "lucide-react";

import Title from "@/components/title";
import { Feature, FeatureContainer } from "@/components/ui/features";
import { PricingComponent, PricingContainer } from "@/components/ui/pricing";
import { Alert } from "@/components/ui/shadcn/alert";
import { getActualUser } from "@/lib/auth/server";
import { getPricingForRole } from "@/server/api/routers/pricing";
import { SigninOrAccount } from "../manager/page";
import Image from "next/image";

export default async function CoachPage() {
  const pricingQuery = await getPricingForRole("COACH");
  const t = await getTranslations("home");
  const user = await getActualUser();

  return (
    <div>
      <Title title={t("coach-title")} />
      <section >
        <div className="py-36 grid place-content-center">
          <div className="space-y-8">
            <h1 className="text-5xl font-bold text-center">{t("coach-title")}</h1>
            <div className="flex flex-col md:flex-row items-center gap-8 w-4/5 mx-auto max-w-3xl">
              <Image src="/images/coach.jpeg" alt="Coach" width={300} height={300} className="rounded-lg shadow-2xl" />
              <p className="py-6 text-2xl">{t("coach-text")}</p>
            </div>
          </div>
        </div>
      </section>


      <section className="bg-card">
        <div className="container mx-auto">
          <h2 className="pt-12">{t("features.coach")}</h2>
          <FeatureContainer>
            <Feature
              title={t("features.coaching.title")}
              description={t("features.coaching.description")}
              icon={<UserCheck size={60} />}
            />

            <Feature
              title={t("features.coach-communication.title")}
              description={t("features.coach-communication.description")}
              icon={<Bell size={60} />}
            />
            <Feature
              title={t("features.video.title")}
              description={t("features.video.description")}
              icon={<Video size={60} />}
            />
          </FeatureContainer>
        </div>
      </section>
      <section className="bg-muted">
        <div className="container mx-auto">
          <h2 className="pt-12">{t("pricing.usage")}</h2>
          <Alert variant="info">{t("pricing.try-offer")}</Alert>
          <PricingContainer>
            {pricingQuery?.map((pricing) => (
              <PricingComponent key={pricing.id} data={pricing} />
            ))}
          </PricingContainer>
          <SigninOrAccount userId={user?.id} />
        </div>
      </section>
    </div>
  );
}
