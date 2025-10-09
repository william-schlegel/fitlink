"use client";

import { useTranslations } from "next-intl";
import React, { Fragment } from "react";
import { isDate } from "date-fns";

import { GetNotificationByIdReturn } from "@/server/api/routers/notification";
import { NotificationTypeEnum } from "@/db/schema/enums";
import { formatDateLocalized } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatNumber";
import Spinner from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { FromTo } from "./types";

type NotificationMessageProps = {
  fromTo: FromTo;
  notification: GetNotificationByIdReturn;
};

export function NotificationMessage({
  notification,
  fromTo,
}: NotificationMessageProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("auth");
  const { getName } = useNotificationType();
  if (!notification) return null;

  async function handleClick(link: string | null, id: string) {
    if (!link) return;
    const sp = new URLSearchParams({ notificationId: id });
    const url = link.concat("?", sp.toString());
    console.log("url", url);
    const res = await fetch(url);
    const json = await res.json();
    if (json.trpcerror) {
      toast.error(json.error);
    } else if (json.error) {
      toast.error(t(json.error));
    } else if (json.success) {
      toast.success(t(json.success));
      if (notification)
        utils.notifications.getNotificationById.invalidate({
          notificationId: notification.id,
        });
    }
  }
  const Elem: React.ReactNode[] = [];
  Elem.push(
    <div className="badge-info badge">
      {t("notification.notification-type", {
        type: getName(notification.type),
      })}
    </div>,
  );
  Elem.push(<p>{notification.message}</p>);
  if (isDate(notification.answered))
    Elem.push(
      <div className="flex items-center gap-2">
        <span>
          {t("notification.answered", {
            date: formatDateLocalized(notification.answered, {
              dateFormat: "long",
              withTime: true,
            }),
          })}
        </span>
        <span className="badge-primary badge">
          {t(notification.answer ?? "")}
        </span>
      </div>,
    );
  if (
    (notification.type === "NEW_SUBSCRIPTION" ||
      notification.type === "SUBSCRIPTION_REJECTED" ||
      notification.type === "SUBSCRIPTION_VALIDATED") &&
    typeof notification.data === "object"
  ) {
    const sData = notification.data as {
      subscriptionId: string;
      monthly: boolean;
      online: boolean;
    };
    Elem.push(<SubscriptionInfo data={sData} />);
  }

  if (fromTo === "to" && !notification.answered) {
    if (notification.type === "SEARCH_COACH")
      Elem.push(
        <div className="flex items-center gap-2">
          <button
            className="btn-success btn"
            type="button"
            onClick={() =>
              handleClick(
                "/api/notification/acceptSearchCoach",
                notification.id,
              )
            }
          >
            {t("notification.accept")}
          </button>
          <button
            className="btn-error btn"
            type="button"
            onClick={() =>
              handleClick(
                "/api/notification/refuseSearchCoach",
                notification.id,
              )
            }
          >
            {t("notification.refuse")}
          </button>
        </div>,
      );
    if (notification.type === "NEW_SUBSCRIPTION")
      Elem.push(
        <div className="flex items-center gap-2">
          <button
            className="btn-success btn"
            type="button"
            onClick={() =>
              handleClick(
                "/api/notification/validateSubscription",
                notification.id,
              )
            }
          >
            {t("notification.validate")}
          </button>
          <button
            className="btn-error btn"
            type="button"
            onClick={() =>
              handleClick(
                "/api/notification/cancelSubscription",
                notification.id,
              )
            }
          >
            {t("notification.cancel")}
          </button>
        </div>,
      );
  }
  return (
    <>
      {Elem.map((e, idx) => (
        <Fragment key={idx}>{e}</Fragment>
      ))}
    </>
  );
}

type SubscriptionInfoProps = {
  data: { subscriptionId: string; monthly: boolean; online: boolean };
};

function SubscriptionInfo({ data }: SubscriptionInfoProps) {
  const sub = trpc.subscriptions.getSubscriptionById.useQuery(
    data.subscriptionId,
    { enabled: isCUID(data.subscriptionId) },
  );
  const t = useTranslations("auth");

  if (sub.isLoading) return <Spinner />;
  const nextPayment = data.monthly
    ? (sub.data?.monthly ?? 0)
    : (sub.data?.yearly ?? 0);
  const firstPayment = (sub.data?.inscriptionFee ?? 0) + nextPayment;

  return (
    <div>
      <h3>{sub.data?.name}</h3>
      <div>
        {data.monthly ? t("notification.monthly") : t("notification.yearly")}
      </div>
      <div>
        {t(`notification.${data.online ? "payment-online" : "payment-club"}`, {
          firstPayment: formatMoney(firstPayment),
          nextPayment: formatMoney(nextPayment),
        })}
      </div>
    </div>
  );
}

const NOTIFICATION_TYPES: readonly {
  readonly value: NotificationTypeEnum;
  readonly label: string;
}[] = [
  {
    value: "SEARCH_COACH",
    label: "notification.type.search-coach",
  },
  {
    value: "COACH_ACCEPT",
    label: "notification.type.coach-accept",
  },
  {
    value: "COACH_REFUSE",
    label: "notification.type.coach-refuse",
  },
  {
    value: "SEARCH_CLUB",
    label: "notification.type.search-club",
  },
  {
    value: "CLUB_ACCEPT",
    label: "notification.type.club-accept",
  },
  {
    value: "CLUB_REFUSE",
    label: "notification.type.club-refuse",
  },
  {
    value: "NEW_MESSAGE",
    label: "notification.type.new-message",
  },
  {
    value: "NEW_SUBSCRIPTION",
    label: "notification.type.new-subscription",
  },
  {
    value: "NEW_REQUEST",
    label: "notification.type.new-request",
  },
  {
    value: "SUBSCRIPTION_VALIDATED",
    label: "notification.type.subscription-validated",
  },
  {
    value: "SUBSCRIPTION_REJECTED",
    label: "notification.type.subscription-rejected",
  },
  {
    value: "REQUEST_VALIDATED",
    label: "notification.type.request-validated",
  },
  {
    value: "REQUEST_REJECTED",
    label: "notification.type.request-rejected",
  },
];

function useNotificationType() {
  const t = useTranslations("auth");
  function getName(type: NotificationTypeEnum | undefined) {
    if (!type) return "?";
    const nt = NOTIFICATION_TYPES.find((t) => t.value === type);
    return nt?.label ? t(nt.label) : "?";
  }
  function getList() {
    return NOTIFICATION_TYPES.map((nt) => ({
      value: nt.value,
      label: t(nt.label),
    }));
  }
  return { getName, getList };
}
