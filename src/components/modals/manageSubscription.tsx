"use client";

import {
  SubscriptionModeEnum,
  SubscriptionRestrictionEnum,
} from "@/db/schema/enums";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import { toast } from "@/lib/toast";
import { trpc } from "@/lib/trpc/client";
import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import Modal, { TModalVariant } from "../ui/modal";
import { useEffect } from "react";
import { isCUID } from "@/lib/utils";
import { useUser } from "@/lib/auth/client";
import Confirmation from "../ui/confirmation";
import SimpleForm from "../ui/simpleform";
import { useTranslations } from "next-intl";

type SubscriptionFormValues = {
  name: string;
  description: string;
  highlight: string;
  startDate: string;
  monthly: number;
  yearly: number;
  cancelationFee: number;
  inscriptionFee: number;
  mode: SubscriptionModeEnum;
  restriction: SubscriptionRestrictionEnum;
};

type CreateSubscriptionProps = {
  clubId: string;
};

export const CreateSubscription = ({ clubId }: CreateSubscriptionProps) => {
  const form = useForm<SubscriptionFormValues>({
    defaultValues: {
      inscriptionFee: 0,
      cancelationFee: 0,
      mode: "ALL_INCLUSIVE",
      monthly: 0,
      yearly: 0,
      startDate: formatDateAsYYYYMMDD(new Date()),
    },
  });
  const utils = trpc.useUtils();
  const t = useTranslations("club");
  const { data: user } = useUser();
  const userId = user?.id ?? "";
  const createSubscription = trpc.subscriptions.createSubscription.useMutation({
    onSuccess: () => {
      utils.clubs.getClubById.invalidate({ clubId, userId });
      utils.subscriptions.getSubscriptionsForClub.invalidate(clubId);
      toast.success(t("subscription.created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const onSubmit: SubmitHandler<SubscriptionFormValues> = (data) => {
    createSubscription.mutate({
      clubId,
      ...data,
      startDate: new Date(data.startDate),
    });
  };

  const onError: SubmitErrorHandler<SubscriptionFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <Modal
      title={t("subscription.create")}
      handleSubmit={form.handleSubmit(onSubmit, onError)}
      errors={form.formState.errors}
      buttonIcon={<i className="bx bx-plus bx-xs" />}
      onOpenModal={() => form.reset()}
      className="w-11/12 max-w-3xl"
    >
      <h3>{t("subscription.create-new")}</h3>
      <FormProvider {...form}>
        <SubscriptionForm />
      </FormProvider>
    </Modal>
  );
};

type UpdateSubscriptionProps = {
  subscriptionId: string;
  clubId: string;
};

export const UpdateSubscription = ({
  subscriptionId,
  clubId,
}: UpdateSubscriptionProps) => {
  const utils = trpc.useUtils();
  const form = useForm<SubscriptionFormValues>();
  const querySubscription = trpc.subscriptions.getSubscriptionById.useQuery(
    subscriptionId,
    {
      enabled: isCUID(subscriptionId),
    }
  );

  useEffect(() => {
    if (querySubscription.data) {
      form.reset({
        name: querySubscription.data.name ?? "",
        description: querySubscription.data.description ?? "",
        highlight: querySubscription.data.highlight ?? "",
        startDate: formatDateAsYYYYMMDD(querySubscription.data.startDate),
        monthly: querySubscription.data.monthly ?? 0,
        yearly: querySubscription.data.yearly ?? 0,
        cancelationFee: querySubscription.data.cancelationFee ?? 0,
        inscriptionFee: querySubscription.data.inscriptionFee ?? 0,
        mode: querySubscription.data.mode ?? "ALL_INCLUSIVE",
        restriction: querySubscription.data.restriction ?? "CLUB",
      });
    }
  }, [querySubscription.data, form]);

  const updateSubscription = trpc.subscriptions.updateSubscription.useMutation({
    onSuccess: () => {
      utils.subscriptions.getSubscriptionById.invalidate(subscriptionId);
      utils.subscriptions.getSubscriptionsForClub.invalidate(clubId);
      toast.success(t("subscription.updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const t = useTranslations("club");

  const onSubmit: SubmitHandler<SubscriptionFormValues> = (data) => {
    updateSubscription.mutate({
      id: subscriptionId,
      ...data,
      startDate: new Date(data.startDate),
    });
  };

  const onError: SubmitErrorHandler<SubscriptionFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <Modal
      title={t("subscription.update", {
        subscriptionName: querySubscription.data?.name ?? "",
      })}
      handleSubmit={form.handleSubmit(onSubmit, onError)}
      submitButtonText={t("subscription.update")}
      errors={form.formState.errors}
      buttonIcon={<i className="bx bx-edit bx-sm" />}
      variant={"Icon-Outlined-Primary"}
      className="w-11/12 max-w-3xl"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-4">
          {t("subscription.update")}
          <span className="text-primary">{querySubscription?.data?.name}</span>
        </h3>
      </div>
      <FormProvider {...form}>
        <SubscriptionForm />
      </FormProvider>
    </Modal>
  );
};

type PropsUpdateDelete = {
  clubId: string;
  subscriptionId: string;
  variant?: TModalVariant;
};

export const DeleteSubscription = ({
  clubId,
  subscriptionId,
  variant = "Icon-Outlined-Secondary",
}: PropsUpdateDelete) => {
  const utils = trpc.useUtils();
  const user = useUser();
  const t = useTranslations("club");

  const deleteSubscription = trpc.subscriptions.deleteSubscription.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(user?.data?.id ?? "");
      utils.clubs.getClubById.invalidate({
        clubId,
        userId: user.data?.id ?? "",
      });
      toast.success(t("subscription.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("subscription.deletion-message")}
      title={t("subscription.deletion")}
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      onConfirm={() => {
        deleteSubscription.mutate(subscriptionId);
      }}
      variant={variant}
    />
  );
};

function SubscriptionForm() {
  const t = useTranslations("club");
  const form = useFormContext<SubscriptionFormValues>();
  return (
    <SimpleForm
      errors={form.formState.errors}
      register={form.register}
      fields={[
        {
          label: t("subscription.name"),
          name: "name",
          required: t("subscription.name-mandatory"),
        },
        {
          label: t("subscription.description"),
          name: "description",
          required: true,
          rows: 3,
        },
        {
          label: t("subscription.highlight"),
          name: "highlight",
        },
        {
          label: t("subscription.start-date"),
          name: "startDate",
          type: "date",
          required: t("subscription.start-date-mandatory"),
        },
        {
          label: t("subscription.monthly"),
          name: "monthly",
          type: "number",
          unit: t("subscription.per-month"),
        },
        {
          label: t("subscription.yearly"),
          name: "yearly",
          type: "number",
          unit: t("subscription.per-year"),
        },
        {
          label: t("subscription.inscription-fee"),
          name: "inscriptionFee",
          type: "number",
          unit: "€",
        },
        {
          label: t("subscription.cancelation-fee"),
          name: "cancelationFee",
          type: "number",
          unit: "€",
        },
        {
          label: t("subscription.select-mode"),
          name: "mode",
          component: (
            <select
              defaultValue={form.getValues("mode")}
              {...form.register("mode")}
            >
              {SUBSCRIPTION_MODES.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {t(mode.label)}
                </option>
              ))}
            </select>
          ),
        },
        {
          label: t("subscription.select-restriction"),
          name: "restriction",
          component: (
            <select
              defaultValue={form.getValues("restriction")}
              {...form.register("restriction")}
            >
              {SUBSCRIPTION_RESTRICTION.map((restriction) => (
                <option key={restriction.value} value={restriction.value}>
                  {t(restriction.label)}
                </option>
              ))}
            </select>
          ),
        },
      ]}
    />
  );
}

export const SUBSCRIPTION_MODES: {
  value: SubscriptionModeEnum;
  label: string;
}[] = [
  {
    value: "ALL_INCLUSIVE",
    label: "subscription.mode.all-inclusive",
  },
  {
    value: "ACTIVITY_GROUP",
    label: "subscription.mode.activity-group",
  },
  { value: "ACTIVITY", label: "subscription.mode.activity" },
  { value: "COURSE", label: "subscription.mode.course" },
  { value: "DAY", label: "subscription.mode.day" },
] as const;

export const SUBSCRIPTION_RESTRICTION: {
  value: SubscriptionRestrictionEnum;
  label: string;
}[] = [
  {
    value: "CLUB",
    label: "subscription.restriction.club",
  },
  {
    value: "SITE",
    label: "subscription.restriction.site",
  },
  {
    value: "ROOM",
    label: "subscription.restriction.room",
  },
] as const;

export function useSubscriptionMode() {
  const t = useTranslations("club");
  function getModeLabel(value?: SubscriptionModeEnum | null) {
    return (
      SUBSCRIPTION_MODES.find((d) => d.value === value)?.label ??
      "subscription.mode.activity-group"
    );
  }

  function getModeName(value?: SubscriptionModeEnum | null) {
    return t(getModeLabel(value));
  }
  return { getModeName, getModeLabel };
}

export function useSubscriptionRestriction() {
  const t = useTranslations("club");
  function getRestrictionLabel(value?: SubscriptionRestrictionEnum | null) {
    return (
      SUBSCRIPTION_RESTRICTION.find((d) => d.value === value)?.label ??
      "subscription.restriction.club"
    );
  }

  function getRestrictionName(value?: SubscriptionRestrictionEnum | null) {
    return t(getRestrictionLabel(value));
  }
  return { getRestrictionName, getRestrictionLabel };
}
