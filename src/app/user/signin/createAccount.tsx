"use client";

import Modal from "@/app/_components/ui/modal";
import SimpleForm from "@/app/_components/ui/simpleform";
import { toast } from "@/lib/toast";
import { trpc } from "@/lib/trpc/client";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { SubmitHandler } from "react-hook-form";
import { SubmitErrorHandler } from "react-hook-form";

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
    console.log("data", data);
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
      buttonIcon={<i className="bx bx-user bx-xs" />}
      variant={"Outlined-Primary"}
    >
      <SimpleForm
        errors={errors}
        register={register}
        fields={[
          { name: "name", label: t("profile.name"), required: true },
          {
            name: "email",
            label: t("profile.my-email"),
            type: "email",
            required: true,
          },
          {
            name: "password",
            label: t("profile.password"),
            type: "password",
            required: true,
          },
        ]}
      />
    </Modal>
  );
}
