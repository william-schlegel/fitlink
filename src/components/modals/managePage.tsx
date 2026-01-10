"use client";

import {
  Controller,
  Path,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { Pencil, Trash } from "lucide-react";

import {
  PAGE_TARGET_LIST,
  PageTarget,
  TARGET_SECTIONS,
} from "@/lib/sections/data";
import { usePageSection } from "@/lib/sections/useGetSection";
import Confirmation from "../ui/confirmation";
import { getButtonSize } from "../ui/modal";
import createLink from "@/lib/createLink";
import SimpleForm from "../ui/simpleform";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";
import Modal from "../ui/modal";

import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/shadcn";

import { SelectValue } from "@radix-ui/react-select";

import type { ButtonSize, ButtonVariant } from "@/components/ui/shadcn/button";

type CreatePageProps = {
  clubId: string;
  variant?: ButtonVariant;
  className?: string;
};

type CreatePageFormValues = {
  name: string;
  target: PageTarget;
};

export const CreatePage = ({
  clubId,
  variant = "default",
  className,
}: CreatePageProps) => {
  const utils = trpc.useUtils();
  const router = useRouter();
  const createPage = trpc.pages.createPage.useMutation({
    onSuccess: (data) => {
      utils.pages.getPagesForClub.invalidate(clubId);
      toast.success(t("club.page-created"));
      router.push(createLink({ clubId, pageId: data[0].id }));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<CreatePageFormValues>();

  const t = useTranslations("pages");
  const { getTargetName } = usePageSection();

  const onSubmit: SubmitHandler<CreatePageFormValues> = (data) => {
    createPage.mutate({
      clubId,
      ...data,
    });
  };

  const onError: SubmitErrorHandler<CreatePageFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <Modal
      title={t("club.create-new-page")}
      variant={variant}
      handleSubmit={handleSubmit(onSubmit, onError)}
      buttonClassName={className}
    >
      <h3>{t("club.create-new-page")}</h3>
      <SimpleForm
        errors={errors}
        register={register}
        fields={[
          {
            label: t("club.page-name"),
            name: "name",
            required: t("club.name-mandatory"),
          },
          {
            label: t("club.page-target"),
            name: "target",
            component: (
              <select
                defaultValue={getValues("target" as Path<CreatePageFormValues>)}
                {...register("target" as Path<CreatePageFormValues>)}
              >
                {TARGET_SECTIONS.map((ts) => (
                  <option key={ts.target} value={ts.target}>
                    {getTargetName(ts.target)}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
      />
    </Modal>
  );
};

type UpdatePageProps = {
  clubId: string;
  pageId: string;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export function UpdatePage({
  clubId,
  pageId,
  variant = "outline",
  buttonSize = "icon",
}: UpdatePageProps) {
  const utils = trpc.useUtils();
  const pageQuery = trpc.pages.getPageById.useQuery(pageId, {
    enabled: isCUID(pageId),
  });

  const updatePage = trpc.pages.updatePage.useMutation({
    onSuccess: () => {
      utils.pages.getPagesForClub.invalidate(clubId);
      toast.success(t("club.page-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
  } = useForm<CreatePageFormValues>();

  const t = useTranslations("pages");

  useEffect(() => {
    if (!pageQuery.data) return;
    reset({
      name: pageQuery.data.name ?? "",
      target: pageQuery.data.target ?? "HOME",
    });
  }, [pageQuery.data, reset]);

  const onSubmit: SubmitHandler<CreatePageFormValues> = (data) => {
    updatePage.mutate({
      id: pageId,
      ...data,
    });
  };

  const onError: SubmitErrorHandler<CreatePageFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <Modal
      title={t("club.update-page")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      buttonIcon={<Pencil />}
      variant={variant}
      buttonSize={buttonSize}
    >
      <h3 className="space-x-2">
        <span>{t("club.update-page")}</span>
        <span className="text-primary">{pageQuery.data?.name}</span>
      </h3>
      {pageQuery.isLoading ? (
        <Spinner />
      ) : (
        <SimpleForm
          errors={errors}
          register={register}
          fields={[
            {
              label: t("club.page-name"),
              name: "name",
              required: t("club.name-mandatory"),
            },
            {
              label: t("club.page-target"),
              name: "target",
              component: (
                <Controller
                  control={control}
                  name="target"
                  render={({ field }) => (
                    <Select {...field}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("club.page-target")} />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_TARGET_LIST.map((target) => (
                          <SelectItem key={target.value} value={target.value}>
                            {t(target.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ),
            },
          ]}
        />
      )}
    </Modal>
  );
}

type DeletePageProps = {
  clubId: string;
  pageId: string;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export function DeletePage({
  pageId,
  clubId,
  buttonSize = "icon",
  variant = "destructive",
}: DeletePageProps) {
  const utils = trpc.useUtils();
  const deletePage = trpc.pages.deletePage.useMutation({
    onSuccess: () => {
      utils.pages.getPagesForClub.invalidate(clubId);
      toast.success(t("club.page-deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const t = useTranslations("pages");

  return (
    <Confirmation
      title={t("club.page-deletion")}
      message={t("club.page-deletion-message")}
      onConfirm={() => deletePage.mutate(pageId)}
      buttonIcon={<Trash />}
      variant={variant}
      textConfirmation={t("club.page-deletion-confirmation")}
      buttonSize={buttonSize}
    />
  );
}
