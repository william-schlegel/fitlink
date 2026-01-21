"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";

import { useState } from "react";

import { ChevronDown, Search } from "lucide-react";

import { Select } from "@radix-ui/react-select";

import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn";
import SimpleForm from "@/components/ui/simpleform";
import { RoleEnum } from "@/db/schema/enums";
import { ROLE_LIST } from "@/lib/data";
import { cn } from "@/lib/utils";

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

  const t = useTranslations();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

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
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-4">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full">
          {t("admin.user.filter")}
          <Badge variant="info">{Object.keys(filter).length}</Badge>
          <ChevronDown
            className={cn(
              "size-4 ml-auto transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mb-4 p-4 border border-muted rounded-md space-y-4">
          <SimpleForm
            errors={errors}
            register={register}
            fields={[
              {
                label: t("auth.name"),
                name: "name",
              },
              {
                label: t("auth.email"),
                name: "email",
              },
              {
                label: t("auth.internalRole"),
                name: "internalRole",
                component: (
                  <Select {...register("internalRole")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("auth.internalRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">{t("auth.all-roles")}</SelectItem>
                      {ROLE_LIST.filter((rl) => rl.value !== "ADMIN").map(
                        (rl) => (
                          <SelectItem key={rl.value} value={rl.value}>
                            {t(`common.roles.${rl.value}`)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
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
            {t("admin.user.search")}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
