"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import Link from "next/link";

import { FeatureEnum, RoleEnum } from "@/db/schema/enums";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@/lib/auth/client";

type MenuDefinitionType = {
  label: string;
  page: string;
  access: ("VISITOR" | RoleEnum)[];
  featured?: FeatureEnum;
  badge?: "unread_messages";
};

const MENUS: MenuDefinitionType[] = [
  {
    label: "navigation.dashboard",
    page: "/",
    access: ["ADMIN", "COACH", "MANAGER", "MANAGER_COACH", "MEMBER"],
  },
  {
    label: "navigation.find-club",
    page: "/fitlink/#find-club",
    access: ["VISITOR"],
  },
  {
    label: "navigation.chat",
    page: "/chat",
    access: ["ADMIN", "COACH", "MANAGER", "MANAGER_COACH", "MEMBER"],
    badge: "unread_messages",
  },

  {
    label: "navigation.find-coach",
    page: "/fitlink/#find-coach",
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
    label: "navigation.activity-groups",
    page: "/admin/activitygroups",
    access: ["ADMIN"],
  },
  {
    label: "navigation.certifications",
    page: "/admin/certifications",
    access: ["ADMIN"],
  },
];
const Menu = () => {
  const { data: user } = useUser({ withFeatures: true });
  const isAdmin = user?.internalRole === "ADMIN";
  const totalUnreadCount = useQuery(
    api.messages.getTotalUnreadCount,
    user?.id
      ? {
          userId: user.id,
          isAdmin,
        }
      : "skip",
  );

  return (
    <>
      {MENUS.map((menu) => {
        if (
          (user?.internalRole && menu.access.includes(user.internalRole)) ||
          (!user && menu.access.includes("VISITOR"))
        ) {
          const locked =
            (menu.featured &&
              !user?.features.map((f) => f).includes(menu.featured)) ??
            false;
          const badgeCount =
            menu.badge === "unread_messages" && totalUnreadCount !== undefined
              ? totalUnreadCount
              : undefined;
          return (
            <li key={menu.page}>
              <MenuItem
                locked={locked}
                label={menu.label}
                page={menu.page}
                badgeCount={badgeCount}
              />
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
  badgeCount,
}: {
  locked: boolean;
  label: string;
  page: string;
  badgeCount?: number;
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
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="badge badge-primary badge-sm">{badgeCount}</span>
      )}
    </Link>
  );
}
