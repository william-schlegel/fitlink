"use client";

import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";

import SimpleForm from "@/components/ui/simpleform";
import Modal from "@/components/ui/modal";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/lib/toast";

type AccountFormValues = {
  name: string;
  email: string;
  password: string;
};

export default function CreateAccount() {
  const t = useTranslations("auth");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountFormValues>();
  const createUser = trpc.users.createUserWithCredentials.useMutation({
    onSuccess() {
      toast.success(t("signin.user-created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<AccountFormValues> = (data) => {
    createUser.mutate(data);
  };

  const onError: SubmitErrorHandler<AccountFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
      <Modal
        title={t("signin.create-account")}
        handleSubmit={handleSubmit(onSubmit, onError)}
        errors={errors}
        buttonIcon={<UserPlus className="h-4 w-4" />}
        variant="outline"
      >
        <SimpleForm
          errors={errors}
          register={register}
        fields={[
          { name: "name", label: t("signin.name"), required: true },
          {
            name: "email",
            label: t("signin.my-email"),
            type: "email",
            required: true,
          },
          {
            name: "password",
            label: t("signin.password"),
            type: "password",
            required: true,
          },
        ]}
      />
    </Modal>
  );
}
