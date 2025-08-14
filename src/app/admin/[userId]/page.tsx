import { getTranslations } from "next-intl/server";
import { getAdminData } from "@/server/api/routers/dashboard";

export default async function AdminDashboard() {
  const adminData = await getAdminData();
  const t = await getTranslations("dashboard");
  const siteCount = adminData.clubs?.reduce(
    (acc, c) => {
      acc.sites += c.sites.length;
      acc.rooms += c.sites.reduce((ss, s) => (ss += s.rooms.length), 0);
      return acc;
    },
    { sites: 0, rooms: 0 }
  ) ?? { sites: 0, rooms: 0 };

  const memberCount = adminData?.members?.length;

  return (
    <div
      // title={t("admin-dashboard")}
      className="container mx-auto my-2 space-y-2 p-2"
    >
      <h1 className="flex justify-between">{t("admin-dashboard")}</h1>
      <section className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-building bx-lg" />
          </div>
          <div className="stat-title">
            {t("clubs", { count: adminData?.clubs?.length ?? 0 })}
          </div>
          <div className="stat-value text-primary">
            {adminData?.clubs?.length}
          </div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-map-pin bx-lg" />
          </div>
          <div className="stat-title">
            {t("sites", { count: siteCount.sites })}
          </div>
          <div className="stat-value text-primary">{siteCount.sites}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-home bx-lg" />
          </div>
          <div className="stat-title">
            {t("rooms", { count: siteCount.rooms })}
          </div>
          <div className="stat-value text-primary">{siteCount.rooms}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-user bx-lg" />
          </div>
          <div className="stat-title">
            {t("members", { count: memberCount })}
          </div>
          <div className="stat-value text-primary">{memberCount}</div>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-2">
        <article className="rounded-md border border-primary p-2">
          <h2>{t("subscriptions")}</h2>
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("kpi")}</h2>
        </article>
      </section>
    </div>
  );
}
