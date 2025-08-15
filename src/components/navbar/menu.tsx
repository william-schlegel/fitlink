"use client";

import { FeatureEnum, RoleEnum } from "@/db/schema/enums";
import { useUser } from "@/lib/auth/client";
import { useTranslations } from "next-intl";
import Link from "next/link";

type MenuDefinitionType = {
  label: string;
  page: string;
  access: ("VISITOR" | RoleEnum)[];
  featured?: FeatureEnum;
};

const MENUS: MenuDefinitionType[] = [
  {
    label: "navigation.dashboard",
    page: "/",
    access: ["ADMIN", "COACH", "MANAGER", "MANAGER_COACH", "MEMBER"],
  },
  {
    label: "navigation.find-club",
    page: "/videoach/#find-club",
    access: ["VISITOR"],
  },
  {
    label: "navigation.chat",
    page: "/chat",
    access: ["ADMIN", "COACH", "MANAGER", "MANAGER_COACH", "MEMBER"],
  },

  {
    label: "navigation.find-coach",
    page: "/videoach/#find-coach",
    access: ["VISITOR"],
  },
  { label: "navigation.manager-offer", page: "/manager", access: ["VISITOR"] },
  { label: "navigation.coach-offer", page: "/coach", access: ["VISITOR"] },
  {
    label: "navigation.company-offer",
    page: "/company",
    access: ["MEMBER", "VISITOR"],
  },
  {
    label: "navigation.planning-management",
    page: `/planning-management`,
    access: ["MANAGER", "MANAGER_COACH"],
    featured: "MANAGER_PLANNING",
  },
  {
    label: "navigation.coach-marketplace",
    page: `/coach-management`,
    access: ["MANAGER", "MANAGER_COACH"],
    featured: "MANAGER_COACH",
  },
  {
    label: "navigation.coaching-offer",
    page: `/coach/offer`,
    access: ["COACH", "MANAGER_COACH"],
    featured: "COACH_OFFER",
  },
  {
    label: "navigation.presentation-page",
    page: `/create-page`,
    access: ["MANAGER", "COACH", "MANAGER_COACH"],
  },
  {
    label: "navigation.users",
    page: "/admin/users",
    access: ["ADMIN"],
  },
  {
    label: "navigation.pricing-definition",
    page: "/admin/pricing",
    access: ["ADMIN"],
  },
  {
    label: "navigation.certifications",
    page: "/admin/certifications",
    access: ["ADMIN"],
  },
  {
    label: "navigation.activity-groups",
    page: "/admin/activitygroups",
    access: ["ADMIN"],
  },
];
const Menu = () => {
  const { data: user } = useUser({ withFeatures: true });
  return (
    <>
      {MENUS.map((menu) => {
        if (
          (user?.role && menu.access.includes(user.role)) ||
          (!user && menu.access.includes("VISITOR"))
        ) {
          const locked =
            (menu.featured &&
              !user?.features.map((f) => f).includes(menu.featured)) ??
            false;
          return (
            <li key={menu.page}>
              <MenuItem locked={locked} label={menu.label} page={menu.page} />
            </li>
          );
        }
        return null;
      })}
    </>
  );
};

export default Menu;

function MenuItem({
  locked,
  label,
  page,
}: {
  locked: boolean;
  label: string;
  page: string;
}) {
  const t = useTranslations("common");
  return locked ? (
    <span
      className="tooltip tooltip-bottom tooltip-error flex items-center gap-2 text-gray-300"
      data-tip={t("navigation.insufficient-plan")}
    >
      <i className="bx bx-lock bx-xs" />
      {t(label)}
    </span>
  ) : (
    <Link className="justify-between" href={page}>
      {t(label)}
    </Link>
  );
}
