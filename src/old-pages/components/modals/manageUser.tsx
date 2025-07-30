import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
  type FieldErrorsImpl,
  type UseFormRegister,
  type UseFormGetValues,
} from "react-hook-form";
import Modal, { type TModalVariant } from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import { useState, type PropsWithoutRef } from "react";
import type { Role } from "@prisma/client";
import Confirmation from "@ui/confirmation";
import { useTranslation } from "next-i18next";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import { toast } from "react-toastify";
import { Pricing as PricingCard, PricingContainer } from "@ui/pricing";
import { ROLE_LIST } from "@lib/useUserInfo";

type UserFormValues = {
  name: string;
  email: string;
  role: Role;
};

type PropsUpdateDelete = {
  userId: string;
  variant?: TModalVariant;
};

export const UpdateUser = ({
  userId,
  variant = "Icon-Outlined-Primary",
}: PropsUpdateDelete) => {
  const utils = trpc.useContext();
  const queryUser = trpc.users.getUserById.useQuery(userId, {
    onSuccess(data) {
      if (data)
        reset({
          name: data.name ?? "",
          email: data.email ?? "",
          role: data.role ?? "MEMBER",
        });
    },
  });
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess: () => {
      utils.users.getUserById.invalidate(userId);
      utils.users.getUserFullById.invalidate(userId);
      reset();
      toast.success(t("user-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<UserFormValues>();
  const { t } = useTranslation("auth");

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
        handleSubmit={handleSubmit(onSubmit, onError)}
        buttonIcon={<i className="bx bx-edit bx-sm" />}
        variant={variant}
      >
        <h3>{t("update-user")}</h3>
        {queryUser.isLoading ? (
          <Spinner />
        ) : (
          <UserForm register={register} errors={errors} getValues={getValues} />
        )}
      </Modal>
    </>
  );
};

export const DeleteUser = ({
  userId,
  variant = "Icon-Outlined-Secondary",
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useContext();
  const { t } = useTranslation("auth");

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

type UserFormProps = {
  errors?: FieldErrorsImpl;
  register: UseFormRegister<UserFormValues>;
  getValues: UseFormGetValues<UserFormValues>;
};

function UserForm({ errors, register }: UserFormProps): JSX.Element {
  const { t } = useTranslation("auth");
  return (
    <SimpleForm
      errors={errors}
      register={register}
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
            <select className="max-w-xs" {...register("role")}>
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
  role: Role;
  subscriptionId?: string;
  onNewPlan: (subscriptionId: string, monthlyPayment: boolean) => void;
};

export function SubscriptionForm({
  role,
  subscriptionId = "",
  onNewPlan,
}: SubscriptionFormProps) {
  const { t } = useTranslation("auth");
  const pricingQuery = trpc.pricings.getPricingForRole.useQuery(role);
  const [closeModal, setCloseModal] = useState(false);

  return (
    <Modal
      title={t("select-plan")}
      className="w-11/12 max-w-7xl overflow-y-auto"
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
    >
      <h3>{t("select-plan")}</h3>
      <PricingContainer>
        {pricingQuery.data?.map((pricing) => (
          <PricingCard
            key={pricing.id}
            pricingId={pricing.id}
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
