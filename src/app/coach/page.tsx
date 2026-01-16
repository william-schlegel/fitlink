import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Bell, UserCheck, Video } from "lucide-react";

import { Feature, FeatureContainer } from "@/components/ui/features";
import { getPricingForRole } from "@/server/api/routers/pricing";
import { PricingContainer } from "@/components/ui/pricing";
import { PricingComponent } from "@/components/ui/pricing";
import { Alert } from "@/components/ui/shadcn/alert";
import { getActualUser } from "@/lib/auth/server";
import { SigninOrAccount } from "../manager/page";
import Title from "@/components/title";

export default async function CoachPage() {
  const pricingQuery = await getPricingForRole("COACH");
  const t = await getTranslations("home");
  const user = await getActualUser();

  return (
    <div>
      <Title title={t("coach-title")} />
      <section className="hero bg-primary/10">
        <div className="hero-content py-48 text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">{t("coach-title")}</h1>
            <p className="py-6 text-lg">{t("coach-text")}</p>
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
