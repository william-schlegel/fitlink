"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import Link from "next/link";
import { Lock } from "lucide-react";

import { FeatureEnum, RoleEnum } from "@/db/schema/enums";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/shadcn/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { useUser } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

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
      : "skip"
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

  if (locked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-2 text-base-content/30 cursor-not-allowed px-3 py-2">
              <Lock className="h-4 w-4" />
              {t(label)}
            </span>
          </TooltipTrigger>
          <TooltipContent className="bg-error text-error-content">
            <p>{t("navigation.insufficient-plan")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm font-medium",
        "hover:bg-base-200 transition-colors"
      )}
      href={page}
    >
      {t(label)}
      {badgeCount !== undefined && badgeCount > 0 && (
        <Badge variant="default" className="text-xs px-1.5 py-0">
          {badgeCount}
        </Badge>
      )}
    </Link>
  );
}
