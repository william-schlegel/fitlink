"use client";

import { isDate } from "date-fns";
import { useTranslations } from "next-intl";
import React, { Fragment, useActionState, useEffect } from "react";

import { toast } from "sonner";

import {
  acceptSearchCoachAction,
  cancelSubscriptionAction,
  refuseSearchCoachAction,
  type NotificationActionState,
  validateSubscriptionAction,
} from "@/actions/notification";
import SendMessage from "@/components/modals/sendMessage";
import { Badge, Button } from "@/components/ui/shadcn";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { CreateNotificationInConvexArgs } from "@/lib/convex/types";
import { formatDateLocalized } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatNumber";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import { FromTo, NOTIFICATION_TYPES, NotificationType } from "./types";

type UserDetails = {
  name: string;
  imageUrl: string;
} | null;

export type NotificationForMessage = CreateNotificationInConvexArgs & {
  _id: string;
  userFrom: UserDetails;
  userTo: UserDetails;
  createdAt: number;
  viewedAt?: number;
  answeredAt?: number;
  answer?: string;
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
  const [acceptState, acceptAction] = useActionState(
    acceptSearchCoachAction,
    null,
  );
  const [refuseState, refuseAction] = useActionState(
    refuseSearchCoachAction,
    null,
  );
  const [validateState, validateAction] = useActionState(
    validateSubscriptionAction,
    null,
  );
  const [cancelState, cancelAction] = useActionState(
    cancelSubscriptionAction,
    null,
  );

  useActionToast(acceptState);
  useActionToast(refuseState);
  useActionToast(validateState);
  useActionToast(cancelState);

  if (!notification) return null;

  const notificationId = notification._id;
  const Elem: React.ReactNode[] = [];
  Elem.push(
    <Badge>
      {t("notification.notification-type", {
        type: getName(notification.type as NotificationType),
      })}
    </Badge>,
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
        <Badge>{t(notification.answer ?? "")}</Badge>
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
          <form action={acceptAction} className="inline-flex">
            <input type="hidden" name="notificationId" value={notificationId} />
            <Button variant="success" type="submit">
              {t("notification.accept")}
            </Button>
          </form>
          <form action={refuseAction} className="inline-flex">
            <input type="hidden" name="notificationId" value={notificationId} />
            <Button variant="destructive" type="submit">
              {t("notification.refuse")}
            </Button>
          </form>
          <SendMessage
            toUserId={notification.userFromId}
            fromUserId={notification.userId}
          />
        </div>,
      );
    if (notification.type === "NEW_SUBSCRIPTION")
      Elem.push(
        <div className="flex items-center gap-2">
          <form action={validateAction} className="inline-flex">
            <input type="hidden" name="notificationId" value={notificationId} />
            <Button variant="success" type="submit">
              {t("notification.validate")}
            </Button>
          </form>
          <form action={cancelAction} className="inline-flex">
            <input type="hidden" name="notificationId" value={notificationId} />
            <Button variant="destructive" type="submit">
              {t("notification.cancel")}
            </Button>
          </form>
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

function useActionToast(state: NotificationActionState | null) {
  useEffect(() => {
    if (!state) return;
    if (state.trpcerror) {
      toast.error(state.error ?? state.trpcerror);
      return;
    }
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (state.success) {
      toast.success(state.success);
    }
  }, [state]);
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
