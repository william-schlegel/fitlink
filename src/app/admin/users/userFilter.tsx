"use client";

import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useState } from "react";

import { Search } from "lucide-react";

import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/shadcn";
import SimpleForm from "@/components/ui/simpleform";
import { RoleEnum } from "@/db/schema/enums";
import { ROLE_LIST } from "@/lib/data";

export type TUserFilter = {
  name?: string;
  email?: string;
  internalRole?: RoleEnum;
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
  const [open, setOpen] = useState(false);

  const onSubmit: SubmitHandler<TUserFilter> = (data) => {
    const flt: TUserFilter = {};
    if (data.name) flt.name = data.name;
    if (data.email) flt.email = data.email;
    if (data.internalRole) flt.internalRole = data.internalRole;
    router.push(`/admin/users?filter=${JSON.stringify(flt)}`);
  };

  const onError: SubmitErrorHandler<TUserFilter> = (errors) => {
    console.error("errors", errors);
  };
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-4">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-4 w-full p-4 border border-muted"
        >
          {tAdmin("user.filter")}
          <Badge variant="info">{Object.keys(filter).length}</Badge>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mb-4 p-4 border border-muted rounded-md space-y-4">
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
                label: t("internalRole"),
                name: "internalRole",
                component: (
                  <select className="max-w-xs" {...register("internalRole")}>
                    <option></option>
                    {ROLE_LIST.filter((rl) => rl.value !== "ADMIN").map(
                      (rl) => (
                        <option key={rl.value} value={rl.value}>
                          {t(rl.label)}
                        </option>
                      ),
                    )}
                  </select>
                ),
              },
            ]}
          />
          <Button
            onClick={handleSubmit(onSubmit, onError)}
            variant="default"
            className="w-full"
          >
            <Search className="size-4" />
            {tAdmin("user.search")}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
