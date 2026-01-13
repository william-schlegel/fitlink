"use client";

import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  FormProvider,
  useFormContext,
  Controller,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import {
  SubscriptionModeEnum,
  SubscriptionRestrictionEnum,
} from "@/db/schema/enums";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import Confirmation from "../ui/confirmation";
import { useUser } from "@/lib/auth/client";
import createLink from "@/lib/createLink";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Modal from "../ui/modal";

import { Pencil, Trash } from "lucide-react";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../ui/shadcn";

import type { ButtonSize, ButtonVariant } from "@/components/ui/shadcn/button";

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
  const router = useRouter();
  const t = useTranslations("club");
  const { data: user } = useUser();
  const userId = user?.id ?? "";
  const createSubscription = trpc.subscriptions.createSubscription.useMutation({
    onSuccess: (data) => {
      utils.clubs.getClubById.invalidate({ clubId, userId });
      utils.subscriptions.getSubscriptionsForClub.invalidate(clubId);
      toast.success(t("subscription.created"));
      router.push(createLink({ subscriptionId: data[0].id }));
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
      size="md"
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
    },
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
      buttonIcon={<Pencil />}
      variant="outline"
      buttonSize="icon"
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
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export const DeleteSubscription = ({
  clubId,
  subscriptionId,
  variant = "destructive",
  buttonSize = "icon",
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
      buttonIcon={<Trash />}
      onConfirm={() => {
        deleteSubscription.mutate(subscriptionId);
      }}
      variant={variant}
      buttonSize={buttonSize}
    />
  );
};

function SubscriptionForm() {
  const t = useTranslations("club");
  const form = useFormContext<SubscriptionFormValues>();
  return (
    <FormProvider {...form}>
      <form className="space-y-4">
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">{t("subscription.name")}</FieldLabel>
              <Input
                id="name"
                {...form.register("name", {
                  required: t("subscription.name-mandatory"),
                })}
              />
              {form.formState.errors.name && (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="description">
                {t("subscription.description")}
              </FieldLabel>
              <Textarea
                id="description"
                {...form.register("description", { required: true })}
                rows={3}
              />
              {form.formState.errors.description && (
                <FieldError>
                  {form.formState.errors.description.message}
                </FieldError>
              )}
            </Field>
          </FieldGroup>
        </FieldSet>
        <FieldSet>
          <FieldGroup className="grid grid-cols-2 gap-2">
            <Field>
              <FieldLabel htmlFor="highlight">
                {t("subscription.highlight")}
              </FieldLabel>
              <Input id="highlight" {...form.register("highlight")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="startDate">
                {t("subscription.start-date")}
              </FieldLabel>
              <Input
                id="startDate"
                {...form.register("startDate", {
                  required: t("subscription.start-date-mandatory"),
                })}
                type="date"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="monthly">
                {t("subscription.monthly")}
              </FieldLabel>
              <Input
                id="monthly"
                {...form.register("monthly", { valueAsNumber: true })}
                type="number"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="yearly">
                {t("subscription.yearly")}
              </FieldLabel>
              <Input
                id="yearly"
                {...form.register("yearly", { valueAsNumber: true })}
                type="number"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="inscriptionFee">
                {t("subscription.inscription-fee")}
              </FieldLabel>
              <Input
                id="inscriptionFee"
                {...form.register("inscriptionFee", { valueAsNumber: true })}
                type="number"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cancelationFee">
                {t("subscription.cancelation-fee")}
              </FieldLabel>
              <Input
                id="cancelationFee"
                {...form.register("cancelationFee", { valueAsNumber: true })}
                type="number"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="mode">
                {t("subscription.select-mode")}
              </FieldLabel>
              <Controller
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("subscription.select-mode")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBSCRIPTION_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {t(mode.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="restriction">
                {t("subscription.select-restriction")}
              </FieldLabel>
              <Controller
                control={form.control}
                name="restriction"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("subscription.select-restriction")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBSCRIPTION_RESTRICTION.map((restriction) => (
                        <SelectItem
                          key={restriction.value}
                          value={restriction.value}
                        >
                          {t(restriction.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </FormProvider>
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
