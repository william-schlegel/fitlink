"use client";

import { RoleEnum } from "@/db/schema/enums";
import Modal, { type TModalVariant } from "../ui/modal";
import { trpc } from "@/lib/trpc/client";
import { useEffect, useState } from "react";
import {
  SubmitHandler,
  useForm,
  SubmitErrorHandler,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/toast";
import Spinner from "../ui/spinner";
import Confirmation from "../ui/confirmation";
import SimpleForm from "../ui/simpleform";
import { ROLE_LIST } from "@/lib/useUserInfo";
import { Pricing as PricingCard, PricingContainer } from "../ui/pricing";

type UserFormValues = {
  name: string;
  email: string;
  role: RoleEnum;
};

type PropsUpdateDelete = {
  userId: string;
  variant?: TModalVariant;
};

export const UpdateUser = ({
  userId,
  variant = "Icon-Outlined-Primary",
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
        role: queryUser.data.role ?? "MEMBER",
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
        buttonIcon={<i className="bx bx-edit bx-sm" />}
        variant={variant}
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
  variant = "Icon-Outlined-Secondary",
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
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      onConfirm={() => {
        deleteUser.mutate(userId);
      }}
      variant={variant}
    />
  );
};

function UserForm() {
  const t = useTranslations("auth");
  const form = useFormContext<UserFormValues>();

  return (
    <SimpleForm
      errors={form.formState.errors}
      register={form.register}
      fields={[
        {
          label: t("name"),
          name: "name",
          required: t("user-name-mandatory"),
        },
        {
          label: t("email"),
          name: "email",
          type: "email",
          required: t("user-email-mandatory"),
        },
        {
          label: t("role"),
          name: "role",
          component: (
            <select className="max-w-xs" {...form.register("role")}>
              {ROLE_LIST.map((rl) => (
                <option key={rl.value} value={rl.value}>
                  {t(rl.label)}
                </option>
              ))}
            </select>
          ),
        },
      ]}
    />
  );
}

type SubscriptionFormProps = {
  role: RoleEnum | undefined;
  subscriptionId?: string;
  onNewPlan: (subscriptionId: string, monthlyPayment: boolean) => void;
};

export function SubscriptionForm({
  role,
  subscriptionId = "",
  onNewPlan,
}: SubscriptionFormProps) {
  const t = useTranslations("auth");
  const pricingQuery = trpc.pricing.getPricingForRole.useQuery(
    role ?? "MEMBER"
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
