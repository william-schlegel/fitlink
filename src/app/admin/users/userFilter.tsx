"use client";

import SimpleForm from "@/components/ui/simpleform";
import { RoleEnum } from "@/db/schema/enums";
import { ROLE_LIST } from "@/lib/data";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";

export type TUserFilter = {
  name?: string;
  email?: string;
  role?: RoleEnum;
  dueDate?: Date;
};

export default function UserFilter({ filter }: { filter: TUserFilter }) {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<TUserFilter>({ defaultValues: filter });

  const tAdmin = useTranslations("admin");
  const t = useTranslations("auth");
  const router = useRouter();

  const onSubmit: SubmitHandler<TUserFilter> = (data) => {
    const flt: TUserFilter = {};
    if (data.name) flt.name = data.name;
    if (data.email) flt.email = data.email;
    if (data.role) flt.role = data.role;
    router.push(`/admin/users?filter=${JSON.stringify(flt)}`);
  };

  const onError: SubmitErrorHandler<TUserFilter> = (errors) => {
    console.error("errors", errors);
  };
  return (
    <>
      <SimpleForm
        errors={errors}
        register={register}
        fields={[
          {
            label: t("name"),
            name: "name",
          },
          {
            label: t("email"),
            name: "email",
          },
          {
            label: t("role"),
            name: "role",
            component: (
              <select className="max-w-xs" {...register("role")}>
                <option></option>
                {ROLE_LIST.filter((rl) => rl.value !== "ADMIN").map((rl) => (
                  <option key={rl.value} value={rl.value}>
                    {t(rl.label)}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
      />
      <button
        onClick={handleSubmit(onSubmit, onError)}
        className="btn btn-primary btn-block mt-2 flex gap-4"
      >
        <i className="bx bx-search bx-sm" />
        {tAdmin("user.search")}
      </button>
    </>
  );
}
