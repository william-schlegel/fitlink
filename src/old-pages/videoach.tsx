import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "../../next-i18next.config.mjs";
import Image from "next/image.js";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router.js";
import Layout from "@root/src/components/layout";
import FindClub from "@sections/findClub";
import FindCoach from "@sections/findCoach";

const Home = () => {
  const { t } = useTranslation("home");
  const router = useRouter();

  return (
    <Layout title={t("title")}>
      <section className="bg-gradient-home-hero hero min-h-screen">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <Image
            src="/images/bruce-mars-gJtDg6WfMlQ-unsplash.jpg"
            alt=""
            width={800}
            height={800}
            className="max-w-lg rounded-lg shadow-2xl"
          />

          <div>
            <h1 className="text-[clamp(2rem,5vw,8rem)] font-bold leading-[clamp(1.5rem,4vw,6rem)]">
              {t("title")}
            </h1>
            <p className="py-6">{t("hero-text")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-accent btn"
                onClick={() => router.push("#find-club")}
              >
                {t("btn-visitor")}
              </button>
              <button
                className="btn-primary btn"
                onClick={() => router.push("/manager")}
              >
                {t("btn-manager")}
              </button>
              <button
                className="btn-secondary btn"
                onClick={() => router.push("/coach")}
              >
                {t("btn-coach")}
              </button>
            </div>
          </div>
        </div>
      </section>
      <section id="find-club" className="bg-base-200">
        <div className="container mx-auto p-4">
          <h2>{t("find-club")}</h2>
          <FindClub />
        </div>
      </section>
      <section id="find-coach" className="bg-base-100">
        <div className="container mx-auto p-4 @container">
          <h2>{t("find-coach")}</h2>
          <FindCoach />
        </div>
      </section>
    </Layout>
  );
};

export default Home;

export const getServerSideProps = async () => {
  return {
    props: {
      ...(await serverSideTranslations(
        "fr",
        ["common", "home"],
        nextI18nConfig
      )),
    },
  };
};
