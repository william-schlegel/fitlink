"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Controller,
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useFormContext,
} from "react-hook-form";

import { Pencil, Trash } from "lucide-react";

import { toast } from "sonner";

import { Spinner } from "@/components/ui/shadcn/spinner";
import { RoleEnum } from "@/db/schema/enums";
import { ROLE_LIST } from "@/lib/data";
import { trpc } from "@/lib/trpc/client";
import Confirmation from "../ui/confirmation";
import Modal from "../ui/modal";
import {
  PricingComponent as PricingCard,
  PricingContainer,
} from "../ui/pricing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/shadcn";
import SimpleForm from "../ui/simpleform";

import type { ButtonSize, ButtonVariant } from "@/components/ui/shadcn/button";

type UserFormValues = {
  name: string;
  email: string;
  internalRole: RoleEnum;
};

type PropsUpdateDelete = {
  userId: string;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export const UpdateUser = ({
  userId,
  variant = "outline",
  buttonSize = "icon",
}: PropsUpdateDelete) => {
  const utils = trpc.useUtils();
  const form = useForm<UserFormValues>();
  const t = useTranslations("auth");

  const queryUser = trpc.users.getUserById.useQuery({ id: userId });

  useEffect(() => {
    if (queryUser.data) {
      form.reset({
        name: queryUser.data.name ?? "",
        email: queryUser.data.email ?? "",
        internalRole: queryUser.data.internalRole ?? "MEMBER",
      });
    }
  }, [queryUser.data, form]);

  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess: () => {
      utils.users.getUserById.invalidate({ id: userId });
      // utils.users.getUserFullById.invalidate({ id: userId });
      form.reset();
      toast.success(t("user-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<UserFormValues> = (data) => {
    updateUser.mutate({
      id: userId,
      ...data,
    });
  };

  const onError: SubmitErrorHandler<UserFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <>
      <Modal
        title={t("update-user")}
        handleSubmit={form.handleSubmit(onSubmit, onError)}
        buttonIcon={<Pencil />}
        variant={variant}
        buttonSize={buttonSize}
      >
        <h3>{t("update-user")}</h3>
        {queryUser.isLoading ? (
          <Spinner />
        ) : (
          <FormProvider {...form}>
            <UserForm />
          </FormProvider>
        )}
      </Modal>
    </>
  );
};

export const DeleteUser = ({
  userId,
  variant = "outline",
  buttonSize = "icon",
}: PropsUpdateDelete) => {
  const utils = trpc.useUtils();
  const t = useTranslations("auth");

  const deleteUser = trpc.users.deleteUser.useMutation({
    onSuccess: () => {
      utils.users.getAllUsers.invalidate();
      toast.success(t("user-deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("user-deletion-message")}
      title={t("user-deletion")}
      buttonIcon={<Trash className="stroke-destructive" />}
      onConfirm={() => {
        deleteUser.mutate(userId);
      }}
      variant={variant}
      buttonSize={buttonSize}
    />
  );
};

function UserForm() {
  const t = useTranslations();
  const form = useFormContext<UserFormValues>();

  return (
    <SimpleForm
      errors={form.formState.errors}
      register={form.register}
      fields={[
        {
          label: t("auth.name"),
          name: "name",
          required: t("auth.user-name-mandatory"),
        },
        {
          label: t("auth.email"),
          name: "email",
          type: "email",
          required: t("auth.user-email-mandatory"),
        },
        {
          label: t("auth.internalRole"),
          name: "internalRole",
          component: (
            <Controller
              control={form.control}
              name="internalRole"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("auth.internalRole")} />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_LIST.filter((rl) => rl.value !== "ADMIN").map(
                      (rl) => (
                        <SelectItem key={rl.value} value={rl.value}>
                          {t(`common.roles.${rl.value}`)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          ),
        },
      ]}
    />
  );
}

type SubscriptionFormProps = {
  internalRole: RoleEnum | undefined;
  subscriptionId?: string;
  onNewPlan: (subscriptionId: string, monthlyPayment: boolean) => void;
};

export function SubscriptionForm({
  internalRole,
  subscriptionId = "",
  onNewPlan,
}: SubscriptionFormProps) {
  const t = useTranslations("auth");
  const pricingQuery = trpc.pricings.getPricingForRole.useQuery(
    internalRole ?? "MEMBER",
  );
  const [closeModal, setCloseModal] = useState(false);

  return (
    <Modal
      title={t("account.select-plan")}
      className="w-11/12 max-w-7xl overflow-y-auto"
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
    >
      <h3>{t("account.select-plan")}</h3>
      <PricingContainer>
        {pricingQuery.data?.map((pricing) => (
          <PricingCard
            key={pricing.id}
            data={pricing}
            onSelect={(id, monthly) => {
              onNewPlan(id, monthly);
              setCloseModal(true);
            }}
            forceHighlight={pricing.id === subscriptionId}
          />
        ))}
      </PricingContainer>
    </Modal>
  );
}
