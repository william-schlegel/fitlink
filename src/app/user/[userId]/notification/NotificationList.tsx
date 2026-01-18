"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";
import { useQuery } from "convex/react";
import Link from "next/link";

import {
  Check,
  CircleQuestionMark,
  Euro,
  HeartHandshake,
  X,
} from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { formatDateLocalized } from "@/lib/formatDate";
import Pagination from "@/components/ui/pagination";
import { Button } from "@/components/ui/shadcn";
import createLink from "@/lib/createLink";
import { FromTo } from "./types";

const PER_PAGE = 20;

type NotificationListProps = {
  userId: string;
  fromTo: FromTo;
  notificationId: string;
  page: number;
};

export function NotificationList({
  userId,
  fromTo,
  notificationId,
  page,
}: NotificationListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("auth");

  const notificationsData = useQuery(
    api.notifications.getNotificationsForUser,
    {
      userId,
      userFromId: fromTo === "from" ? userId : undefined,
      limit: PER_PAGE,
      skip: page * PER_PAGE,
    },
  );

  const notifications = notificationsData?.notifications ?? [];
  const total = notificationsData?.total ?? 0;

  return (
    <div className="w-1/4 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Button variant={fromTo === "to" ? "default" : "outline"} asChild>
          <Link
            href={createLink(
              {
                notificationId: "",
                page: "0",
                fromTo: "to",
              },
              null,
              pathname,
            )}
          >
            {t("notification.to")}
          </Link>
        </Button>
        <Button variant={fromTo === "from" ? "default" : "outline"} asChild>
          <Link
            href={createLink(
              {
                notificationId: "",
                page: "0",
                fromTo: "from",
              },
              null,
              pathname,
            )}
          >
            {t("notification.from")}
          </Link>
        </Button>
      </div>
      <ul className="menu w-full overflow-hidden rounded bg-card">
        {notifications.map((notification) => (
          <li key={notification._id}>
            <Link
              href={createLink(
                {
                  notificationId: notification._id,
                  page: page.toString(),
                  fromTo,
                },
                null,
                pathname,
              )}
              className={twMerge(
                "flex items-center justify-between",
                notificationId === notification._id &&
                  "border border-primary bg-primary/10",
                !notification.viewedAt && "font-bold",
              )}
            >
              <div>
                {formatDateLocalized(new Date(notification.createdAt), {
                  dateFormat: "short",
                  withTime: true,
                })}
              </div>
              <div className="space-x-2">
                {notification.type === "COACH_ACCEPT" ||
                notification.type === "CLUB_ACCEPT" ||
                notification.type === "SUBSCRIPTION_VALIDATED" ||
                notification.type === "REQUEST_VALIDATED" ? (
                  <HeartHandshake
                    className="rounded-full bg-green-500/10 p-2 text-green-500"
                    size={12}
                  />
                ) : null}
                {notification.type === "COACH_REFUSE" ||
                notification.type === "CLUB_REFUSE" ||
                notification.type === "SUBSCRIPTION_REJECTED" ||
                notification.type === "REQUEST_REJECTED" ? (
                  <X
                    className="rounded-full bg-destructive/10 text-destructive p-2"
                    size={12}
                  />
                ) : null}
                {notification.type === "SEARCH_COACH" ||
                notification.type === "SEARCH_CLUB" ? (
                  <CircleQuestionMark
                    className="rounded-full bg-accent/10 p-2 text-accent"
                    size={12}
                  />
                ) : null}
                {notification.type === "NEW_SUBSCRIPTION" ? (
                  <Euro
                    className="rounded-full bg-accent/10 p-2 text-accent"
                    size={12}
                  />
                ) : null}
                {notification.answeredAt ? (
                  <Check
                    className="rounded-full bg-green-500/10 p-2 text-green-500"
                    size={12}
                  />
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination
        actualPage={page}
        count={total}
        onPageClick={(newPage) => {
          router.push(
            createLink(
              {
                notificationId: "",
                page: newPage.toString(),
                fromTo,
              },
              null,
              pathname,
            ),
          );
        }}
        perPage={PER_PAGE}
      />
    </div>
  );
}
