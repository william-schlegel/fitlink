"use client";

import {
  Path,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
} from "react-hook-form";
import { useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";

import { pageSectionModelEnum, pageTargetEnum } from "@/db/schema/enums";
import { getButtonSize, TModalVariant } from "../ui/modal";
import Confirmation from "../ui/confirmation";
import { ButtonSize } from "../ui/buttonIcon";
import SimpleForm from "../ui/simpleform";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";
import Modal from "../ui/modal";

type CreatePageProps = {
  clubId: string;
  variant?: TModalVariant;
};

export type PageTarget = (typeof pageTargetEnum.enumValues)[number];
export type PageSectionModel = (typeof pageSectionModelEnum.enumValues)[number];

const PAGE_TARGET_LIST: {
  value: PageTarget;
  label: string;
}[] = [
  { value: "HOME", label: "target.home" },
  { value: "ACTIVITIES", label: "target.activities" },
  { value: "OFFERS", label: "target.offers" },
  { value: "TEAM", label: "target.team" },
  { value: "PLANNING", label: "target.planning" },
  { value: "VIDEOS", label: "target.videos" },
  { value: "EVENTS", label: "target.events" },
] as const;

const PAGE_SECTION_LIST: {
  value: PageSectionModel;
  label: string;
}[] = [
  { value: "HERO", label: "section.hero" },
  { value: "TITLE", label: "section.title" },
  { value: "PLANNINGS", label: "section.plannings" },
  { value: "ACTIVITY_GROUPS", label: "section.activity-groups" },
  { value: "ACTIVITIES", label: "section.activity-details" },
  { value: "OFFERS", label: "section.offers" },
  { value: "VIDEO", label: "section.video" },
  { value: "LOCATION", label: "section.location" },
  { value: "CONTACT", label: "section.contact" },
  { value: "SOCIAL", label: "section.social" },
  { value: "TEAMMATES", label: "section.teammates" },
  { value: "FOOTER", label: "section.footer" },
] as const;

const TARGET_SECTIONS: {
  target: PageTarget;
  sections: PageSectionModel[];
}[] = [
  {
    target: "HOME",
    sections: ["HERO", "ACTIVITY_GROUPS", "ACTIVITIES", "CONTACT", "LOCATION"],
  },
  {
    target: "OFFERS",
    sections: ["TITLE", "OFFERS"],
  },
  {
    target: "ACTIVITIES",
    sections: ["TITLE", "ACTIVITY_GROUPS", "ACTIVITIES"],
  },
  { target: "PLANNING", sections: ["TITLE", "PLANNINGS"] },
  { target: "TEAM", sections: ["TITLE", "TEAMMATES"] },
];

export function usePageSection() {
  const t = useTranslations("pages");
  const getTargetName = useCallback(
    (target: (typeof pageTargetEnum.enumValues)[number] | undefined) => {
      if (!target) return "?";
      const tg = PAGE_TARGET_LIST.find((t) => t.value === target);
      if (tg) return t(tg.label);
      return "?";
    },
    [t],
  );

  const getSectionName = useCallback(
    (section: PageSectionModel | undefined) => {
      if (!section) return "?";
      const sc = PAGE_SECTION_LIST.find((s) => s.value === section);
      if (sc) return t(sc.label);
      return "?";
    },
    [t],
  );

  const defaultSection = useCallback(
    (target: PageTarget | undefined): PageSectionModel => {
      if (!target) return "HERO";
      const ts = TARGET_SECTIONS.find((ts) => ts.target === target);
      return ts?.sections?.[0] ?? "HERO";
    },
    [],
  );

  const getSections = useCallback((target: PageTarget): PageSectionModel[] => {
    const ts = TARGET_SECTIONS.find((ts) => ts.target === target);
    return ts?.sections ?? [];
  }, []);

  return { getTargetName, getSectionName, defaultSection, getSections };
}

type CreatePageFormValues = {
  name: string;
  target: PageTarget;
};

export const CreatePage = ({
  clubId,
  variant = "Primary",
}: CreatePageProps) => {
  const utils = trpc.useUtils();
  const createPage = trpc.pages.createPage.useMutation({
    onSuccess: () => {
      utils.pages.getPagesForClub.invalidate(clubId);
      toast.success(t("club.page-created"));
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
  variant?: TModalVariant;
  size?: ButtonSize;
};

export function UpdatePage({
  clubId,
  pageId,
  variant = "Icon-Outlined-Primary",
  size = "sm",
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
      buttonIcon={<i className={`bx bx-edit ${getButtonSize(size)}`} />}
      variant={variant}
      buttonSize={size}
    >
      <h3 className="space-x-2">
        {t("club.update-page")}
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
                <select
                  defaultValue={getValues(
                    "target" as Path<CreatePageFormValues>,
                  )}
                  {...register("target" as Path<CreatePageFormValues>)}
                >
                  {PAGE_TARGET_LIST.map((target) => (
                    <option key={target.value} value={target.value}>
                      {t(target.label)}
                    </option>
                  ))}
                </select>
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
  variant?: TModalVariant;
  size?: ButtonSize;
};

export function DeletePage({
  pageId,
  clubId,
  size = "sm",
  variant = "Icon-Outlined-Secondary",
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
      buttonIcon={<i className={`bx bx-trash ${getButtonSize(size)}`} />}
      variant={variant}
      textConfirmation={t("club.page-deletion-confirmation")}
      buttonSize={size}
    />
  );
}
