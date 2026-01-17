import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { FloatingChatWidget } from "@/components/assistant";
import FindCoach from "@/components/sections/findCoach";
import FindClub from "@/components/sections/findClub";
import ButtonLink from "@/components/ui/buttonLink";
import Title from "@/components/title";

export default async function FitlinkPage() {
  const t = await getTranslations("home");

  return (
    <>
      <Title title={t("title")} />
      <section className="bg-gradient-home-hero hero min-h-screen">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <Image
            src="/images/photo.jpg"
            alt=""
            width={800}
            height={800}
            className="max-w-lg rounded-lg shadow-2xl"
          />

          <div>
            <h1 className="text-[clamp(2rem,5vw,8rem)] font-bold leading-[clamp(1.5rem,4vw,6rem)] text-background">
              {t("title")}
            </h1>
            <p className="py-6 text-background">{t("hero-text")}</p>
            <div className="flex flex-wrap gap-2">
              <ButtonLink size="xl" href="#find-club">
                {t("btn-visitor")}
              </ButtonLink>
              <ButtonLink size="xl" href="/manager">
                {t("btn-manager")}
              </ButtonLink>
              <ButtonLink size="xl" href="/coach">
                {t("btn-coach")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <section id="find-club" className="bg-muted">
        <div className="container mx-auto p-4">
          <h2>{t("find-club")}</h2>
          <FindClub />
        </div>
      </section>
      <section id="find-coach" className="bg-card">
        <div className="container mx-auto p-4 @container">
          <h2>{t("find-coach")}</h2>
          <FindCoach />
        </div>
      </section>

      {/* AI Assistant Floating Widget */}
      <FloatingChatWidget />
    </>
  );
}
