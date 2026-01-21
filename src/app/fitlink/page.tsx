import { getTranslations } from "next-intl/server";
import Image from "next/image";

import { FloatingChatWidget } from "@/components/assistant";
import FindClub from "@/components/sections/findClub";
import FindCoach from "@/components/sections/findCoach";
import Title from "@/components/title";
import ButtonLink from "@/components/ui/buttonLink";
import { AnimatedGradient } from "@/components/ui/shadcn/stripe-animated-gradient";

export default async function FitlinkPage() {
  const t = await getTranslations("home");

  return (
    <>
      <Title title={t("title")} />
      {/* <section className="bg-gradient-home-hero hero min-h-screen"> */}
      <section className="relative min-h-screen">
        <AnimatedGradient
          color1="#4f46e5"
          color2="#ff8600"
          color3="#016630"
          color4="#e7000b"
        />
        <div className="absolute inset-0 isolate justify-center items-center gap-4 max-w-7xl p-4 flex flex-col lg:flex-row-reverse mx-auto">
          <Image
            src="/images/photo.jpg"
            alt=""
            width={800}
            height={800}
            className="max-w-lg rounded-lg shadow-2xl"
          />

          <div>
            <h1 className="text-[clamp(2rem,5vw,8rem)] font-bold leading-[clamp(1.5rem,4vw,6rem)] text-gray-100">
              {t("title")}
            </h1>
            <p className="py-6 text-gray-100">{t("hero-text")}</p>
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
      <section className="bg-card py-16">
        <div className="container mx-auto p-4 space-y-4 text-card-foreground text-[clamp(2rem,3vw,4rem)] font-bold">
          <p className="text-center ">{t("hero-intro-1")}</p>
          <p className="text-center ">{t("hero-intro-2")}</p>
        </div>
      </section>
      <section id="find-club" className="bg-muted">
        <div className="container mx-auto p-4 space-y-4">
          <h2>{t("find-club")}</h2>
          <p className="text-sm text-muted-foreground">{t("find-club-text")}</p>
          <FindClub />
        </div>
      </section>
      <section id="find-coach" className="bg-card">
        <div className="container mx-auto p-4 @container space-y-4">
          <h2>{t("find-coach")}</h2>
          <FindCoach />
        </div>
      </section>

      {/* AI Assistant Floating Widget */}
      <FloatingChatWidget />
    </>
  );
}
