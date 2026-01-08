import { getTranslations } from "next-intl/server";

import { BuildingIcon, HomeIcon, MapPinIcon, UserIcon } from "lucide-react";

import { Card, CardHeader, CardTitle } from "@/components/ui/shadcn";
import { getAdminData } from "@/server/api/routers/dashboard";
import CardGroup from "@/components/ui/cardGroup";
import Title from "@/components/title";

export default async function AdminDashboard() {
  const adminData = await getAdminData();
  const t = await getTranslations("dashboard");
  const siteCount = adminData.clubs?.reduce(
    (acc, c) => {
      acc.sites += c.sites.length;
      acc.rooms += c.sites.reduce((ss, s) => (ss += s.rooms.length), 0);
      return acc;
    },
    { sites: 0, rooms: 0 },
  ) ?? { sites: 0, rooms: 0 };

  const memberCount = adminData?.members?.length;

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("admin-dashboard")} />
      <h1 className="flex justify-between">{t("admin-dashboard")}</h1>
      <CardGroup
        cards={[
          {
            title: t("clubs", { count: adminData?.clubs?.length ?? 0 }),
            value: adminData?.clubs?.length ?? 0,
            icon: BuildingIcon,
          },
          {
            title: t("sites", { count: siteCount.sites }),
            value: siteCount.sites,
            icon: MapPinIcon,
          },
          {
            title: t("rooms", { count: siteCount.rooms }),
            value: siteCount.rooms,
            icon: HomeIcon,
          },
          {
            title: t("members", { count: memberCount }),
            value: memberCount,
            icon: UserIcon,
          },
        ]}
      />

      <section className="grid grid-cols-2 gap-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("subscriptions")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("kpi")}</CardTitle>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
