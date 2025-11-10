"use client";

import { useTranslations } from "next-intl";
import React, { Fragment } from "react";
import { isDate } from "date-fns";

import { FromTo, NOTIFICATION_TYPES, NotificationType } from "./types";
import { CreateNotificationInConvexArgs } from "@/lib/convex/types";
import SendMessage from "@/components/modals/sendMessage";
import { formatDateLocalized } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatNumber";
import Spinner from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import { toast } from "@/lib/toast";

type UserDetails = {
  name: string;
  imageUrl: string;
} | null;

export type NotificationForMessage = CreateNotificationInConvexArgs & {
  userFrom: UserDetails;
  userTo: UserDetails;
};

type NotificationMessageProps = {
  fromTo: FromTo;
  notification: NotificationForMessage;
};

export function NotificationMessage({
  notification,
  fromTo,
}: NotificationMessageProps) {
  const t = useTranslations("auth");
  const { getName } = useNotificationType();

  if (!notification) return null;

  async function handleClick(link: string | null, id: string) {
    if (!link) return;
    const sp = new URLSearchParams({ notificationId: id });
    const url = link.concat("?", sp.toString());
    const res = await fetch(url);
    const json = await res.json();
    if (json.trpcerror) {
      toast.error(json.error);
    } else if (json.error) {
      toast.error(t(json.error));
    } else if (json.success) {
      toast.success(json.success);
    }
  }
  const Elem: React.ReactNode[] = [];
  Elem.push(
    <div className="badge-info badge">
      {t("notification.notification-type", {
        type: getName(notification.type as NotificationType),
      })}
    </div>,
  );
  Elem.push(<p>{notification.message}</p>);
  if (isDate(notification.answeredAt))
    Elem.push(
      <div className="flex items-center gap-2">
        <span>
          {t("notification.answered", {
            date: formatDateLocalized(notification.answeredAt, {
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

  if (fromTo === "to" && !notification.answeredAt) {
    if (notification.type === "SEARCH_COACH")
      Elem.push(
        <div className="flex items-center gap-2">
          <button
            className="btn-success btn"
            type="button"
            onClick={() =>
              handleClick(
                "/api/notification/acceptSearchCoach",
                notification._id!.toString(),
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
                notification._id!.toString(),
              )
            }
          >
            {t("notification.refuse")}
          </button>
          <SendMessage
            toUserId={notification.userFromId}
            fromUserId={notification.userId}
          />
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
                notification._id!.toString(),
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
                notification._id!.toString(),
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

function useNotificationType() {
  const t = useTranslations("auth");
  function getName(type: NotificationType | undefined) {
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
