"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { SubmitHandler, useForm, useWatch } from "react-hook-form";

import { InferSelectModel } from "drizzle-orm";

import { Pencil, Trash } from "lucide-react";

import { toast } from "sonner";

import Image from "next/image";

import { Spinner } from "@/components/ui/shadcn/spinner";
import { pageSectionElement } from "@/db/schema/page";
import { trpc } from "@/lib/trpc/client";
import { cn, isCUID } from "@/lib/utils";
import ThemeSelector, { TThemes } from "../themeSelector";
import Confirmation from "../ui/confirmation";
import DeleteButton from "../ui/deleteButton";
import Modal from "../ui/modal";
import { PageButton } from "../ui/page/button";
import {
  PageCard,
  PageCardAction,
  PageCardContent,
  PageCardDescription,
  PageCardTitle,
} from "../ui/page/card";
import PageContainer from "../ui/page/container";
import PageText from "../ui/page/text";
import { Button, Card, CardContent, Separator } from "../ui/shadcn";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/shadcn/field";
import { Input } from "../ui/shadcn/input";
import { Textarea } from "../ui/shadcn/textarea";
import { UploadButton } from "../uploadthing";

type ActivityGroupCreationProps = {
  clubId: string;
  pageId: string;
};

type ActivityGroupForm = {
  title: string;
  subTitle: string;
};

type ActivityForm = {
  imageUrls?: string[];
  title: string;
  subTitle: string;
  description: string;
};

export const ActivityGroupCreation = ({
  clubId,
  pageId,
}: ActivityGroupCreationProps) => {
  const t = useTranslations("pages");
  const { register, handleSubmit, control, reset } =
    useForm<ActivityGroupForm>();
  const fields = useWatch({ control });
  const utils = trpc.useUtils();
  const [previewTheme, setPreviewTheme] = useState<TThemes>("cupcake");
  const [updating, setUpdating] = useState(false);

  const querySection = trpc.pages.getPageSection.useQuery(
    { pageId, section: "ACTIVITY_GROUPS" },
    {
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (!querySection.data) {
      startTransition(() => {
        setUpdating(false);
      });
      return;
    }
    reset({
      title: querySection.data?.title ?? "",
      subTitle: querySection.data?.subTitle ?? "",
    });
    startTransition(() => {
      setUpdating(true);
    });
  }, [querySection.data, reset]);

  const createSection = trpc.pages.createPageSection.useMutation({
    onSuccess(data) {
      toast.success(t("section-created"));
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "ACTIVITY_GROUPS",
      });
      reset({
        title: data[0].title ?? "",
        subTitle: data[0].subTitle ?? "",
      });
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const updateSection = trpc.pages.updatePageSection.useMutation({
    onSuccess(data) {
      toast.success(t("section-created"));
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "ACTIVITY_GROUPS",
      });
      reset({
        title: data[0].title ?? "",
        subTitle: data[0].subTitle ?? "",
      });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const deleteSection = trpc.pages.deletePageSection.useMutation({
    onSuccess() {
      toast.success(t("section-deleted"));
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "ACTIVITY_GROUPS",
      });
      reset();
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const updatePageStyle = trpc.pages.updatePageStyleForClub.useMutation({
    onSuccess() {
      toast.success(t("style-saved"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<ActivityGroupForm> = (data) => {
    if (updating) {
      updateSection.mutate({
        ...querySection.data,
        title: data.title,
        subTitle: data.subTitle,
      });
    } else {
      createSection.mutate({
        model: "ACTIVITY_GROUPS",
        pageId,
        title: data.title,
        subTitle: data.subTitle,
      });
    }
  };

  const handleDeleteSection = () => {
    deleteSection.mutate({ pageId, sectionId: querySection.data?.id ?? "" });
  };

  if (querySection.isLoading) return <Spinner />;

  return (
    <div className="grid w-full auto-rows-auto gap-2 lg:grid-cols-2">
      <div className="space-y-2">
        <h3>{t(updating ? "updating-section" : "creation-section")}</h3>
        <form
          className="space-y-2 rounded border border-primary p-2"
          onSubmit={handleSubmit(onSubmit)}
        >
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">
                  {t("activity-group.title")}
                </FieldLabel>
                <Input {...register("title")} id="title" type="text" />
              </Field>
              <Field>
                <FieldLabel htmlFor="subtitle">
                  {t("activity-group.subtitle")}
                </FieldLabel>
                <Input {...register("subTitle")} id="subtitle" type="text" />
              </Field>
            </FieldGroup>
          </FieldSet>
          <div className="col-span-2 flex justify-between">
            <Button type="submit">{t("save-section")}</Button>
            {updating ? (
              <Confirmation
                title={t("section-deletion")}
                message={t("section-deletion-message")}
                variant="destructive"
                buttonIcon={<Trash />}
                buttonSize="icon"
                textConfirmation={t("section-deletion-confirm")}
                onConfirm={() => handleDeleteSection()}
              />
            ) : null}
          </div>
        </form>
        {querySection.data?.id ? (
          <>
            <div className="flex flex-wrap gap-2">
              {querySection.data.elements.map((activity) => (
                <Card key={activity.id}>
                  <CardContent>
                    <h4 className="text-center">{activity.title}</h4>
                    <Separator />
                    <div className="flex items-center justify-center gap-2">
                      <UpdateActivityGroup
                        pageId={pageId}
                        activityId={activity.id!}
                      />
                      <DeleteActivityGroup
                        pageId={pageId}
                        activityId={activity.id!}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <AddActivityGroup
              pageId={pageId}
              sectionId={querySection.data.id}
            />
          </>
        ) : null}
      </div>
      <div className={`space-y-2`}>
        <h3 className="flex flex-wrap items-center justify-between">
          <span>{t("preview")}</span>
          <ThemeSelector
            onSelect={(t) => setPreviewTheme(t)}
            onSave={(t) => updatePageStyle.mutate({ clubId, pageStyle: t })}
          />
        </h3>
        <PageContainer theme={previewTheme}>
          <ActivityGroupContentCard
            title={fields.title}
            subtitle={fields.subTitle}
            elements={querySection.data?.elements ?? []}
            preview
          />
        </PageContainer>
      </div>
    </div>
  );
};

type ActivityProps = {
  pageId: string;
  sectionId: string;
};

function AddActivityGroup({ pageId, sectionId }: ActivityProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const [close, setClose] = useState(false);

  const createAG = trpc.pages.createPageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "ACTIVITY_GROUPS",
      });
      toast.success(t("activity-group.activity-created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function handleSubmit(data: ActivityForm) {
    createAG.mutate({
      pageId,
      sectionId,
      elementType: "CARD",
      title: data.title,
      subTitle: data.subTitle,
      content: data.description,
      images: data.imageUrls,
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("activity-group.new-activity")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      size="md"
    >
      <h3>
        <span>{t("activity-group.new-activity")}</span>
      </h3>
      <ActivityGroupForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
      />
    </Modal>
  );
}

type UpdateActivityGroupProps = {
  pageId: string;
  activityId: string;
};

function UpdateActivityGroup({ pageId, activityId }: UpdateActivityGroupProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const [close, setClose] = useState(false);
  const [initialData, setInitialData] = useState<ActivityForm | undefined>();
  const queryActivity = trpc.pages.getPageSectionElementById.useQuery(
    activityId,
    {
      enabled: isCUID(activityId),
      refetchOnWindowFocus: false,
    },
  );

  useEffect(() => {
    if (!queryActivity.data) return;
    const activityData = queryActivity.data;
    startTransition(() => {
      setInitialData({
        title: activityData.title ?? "",
        subTitle: activityData.subTitle ?? "",
        description: activityData.content ?? "",
        imageUrls: activityData.images ?? [],
      });
    });
  }, [queryActivity.data]);

  const updateAG = trpc.pages.updatePageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "ACTIVITY_GROUPS",
      });
      toast.success(t("activity-group.activity-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function handleSubmit(data: ActivityForm) {
    updateAG.mutate({
      id: activityId,
      pageId,
      title: data.title,
      subTitle: data.subTitle,
      content: data.description,
      images: data.imageUrls,
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("activity-group.update-activity")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      variant="outline"
      buttonIcon={<Pencil />}
      buttonSize="icon"
      size="md"
    >
      <h3>
        <span>{t("activity-group.update-activity")}</span>
      </h3>
      <ActivityGroupForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
        initialValues={initialData}
      />
    </Modal>
  );
}

function DeleteActivityGroup({ pageId, activityId }: UpdateActivityGroupProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");

  const deleteActivity = trpc.pages.deletePageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "ACTIVITY_GROUPS",
      });
      toast.success(t("activity-group.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("activity-group.deletion-message")}
      title={t("activity-group.deletion")}
      buttonIcon={<Trash />}
      onConfirm={() => {
        deleteActivity.mutate(activityId);
      }}
      variant="destructive"
      buttonSize="icon"
    />
  );
}

type ActivityGroupFormProps = {
  onSubmit: (data: ActivityForm) => void;
  initialValues?: ActivityForm;
  onCancel: () => void;
  update?: boolean;
};

const defaultValues: ActivityForm = {
  title: "",
  subTitle: "",
  description: "",
  imageUrls: [],
};

function ActivityGroupForm({
  onSubmit,
  initialValues,
  onCancel,
}: ActivityGroupFormProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("pages");
  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
    reset,
    setValue,
  } = useForm<ActivityForm>({
    defaultValues,
  });
  const imageUrls = useWatch({ control, name: "imageUrls" });

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  const handleDeleteImage = () => {
    setValue("imageUrls", []);
  };

  const onSuccess: SubmitHandler<ActivityForm> = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSuccess)}>
      <div className="space-y-1">
        <UploadButton
          endpoint="imageAttachment"
          onClientUploadComplete={(result) =>
            setValue(
              "imageUrls",
              result.map((r) => r.ufsUrl),
            )
          }
          buttonText={t("activity-group.image")}
          className="col-span-2"
        />

        {imageUrls && imageUrls.length > 0 ? (
          <div className="relative col-span-full flex gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[0]}
              alt=""
              className="max-h-40 w-full object-contain"
            />
            <DeleteButton
              label={t("activity.delete-image")}
              icon
              onClick={handleDeleteImage}
              className="absolute right-2 bottom-2"
            />
          </div>
        ) : null}

        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="activity-group-title">
                {t("activity-group.title")}
              </FieldLabel>
              <Input
                id="activity-group-title"
                {...register("title", {
                  required: t("activity-group.title-mandatory") ?? true,
                })}
              />
              {errors?.title?.message && (
                <FieldError>{errors.title.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-group-subtitle">
                {t("activity-group.subtitle")}
              </FieldLabel>
              <Input id="activity-group-subtitle" {...register("subTitle")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-group-description">
                {t("activity-group.description")}
              </FieldLabel>
              <Textarea
                id="activity-group-description"
                {...register("description")}
                rows={4}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </div>
      <Separator className="my-4" />
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            reset();
            onCancel();
          }}
        >
          {tCommon("cancel")}
        </Button>
        <Button type="submit">{tCommon("save")}</Button>
      </div>
    </form>
  );
}

type ActivityGroupDisplayProps = {
  pageId: string;
};

export const ActivityGroupDisplayCard = ({
  pageId,
}: ActivityGroupDisplayProps) => {
  const querySection = trpc.pages.getPageSection.useQuery({
    pageId,
    section: "ACTIVITY_GROUPS",
  });
  if (querySection.isLoading) return <Spinner />;
  if (!querySection.data) return <div>Activities section unavailable</div>;

  return (
    <ActivityGroupContentCard
      title={querySection.data?.title ?? ""}
      subtitle={querySection.data?.subTitle ?? ""}
      elements={querySection.data?.elements}
    />
  );
};

type ActivityContentElement = InferSelectModel<typeof pageSectionElement>;

type ActivitiesContentCardProps = {
  title?: string;
  subtitle?: string;
  preview?: boolean;
  elements?: ActivityContentElement[];
};

function ActivityGroupContentCard({
  title,
  subtitle,
  preview = false,
  elements,
}: ActivitiesContentCardProps) {
  const t = useTranslations("pages");
  return (
    <section
      id="ACTIVITY_GROUPS"
      className={`${preview ? "aspect-4/3" : "min-h-screen"} w-full p-4`}
    >
      <div className={`container mx-auto p-4 ${preview ? "py-2" : "py-48"}`}>
        <PageText
          level="h2"
          color="primary"
          className={`${
            preview
              ? "text-3xl"
              : "text-[clamp(4rem,5vw,6rem)] leading-[clamp(6rem,7.5vw,9rem)]"
          } font-bold`}
        >
          {title}
        </PageText>
        <PageText
          level="h3"
          color="primary"
          className={`${
            preview
              ? "text-lg"
              : "text-[clamp(1.5rem,2.5vw,3rem)] leading-[clamp(2.25rem,3.75vw,4.5rem)]"
          } font-semibold text-primary-content`}
        >
          {subtitle}
        </PageText>
        <div
          className={`mt-4 grid ${
            preview
              ? "grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2"
              : "grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4"
          }`}
        >
          {elements?.map((activity) => (
            <PageCard key={activity.id}>
              {activity.imageUrls?.[0] ? (
                <Image
                  src={activity.imageUrls[0]}
                  alt=""
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              ) : null}
              <PageCardContent
                className={cn("space-y-2", preview && "space-y-1 p-4 text-sm")}
              >
                <PageCardTitle className={cn(preview && "text-base")}>
                  {activity.title}
                </PageCardTitle>
                {activity.subTitle ? (
                  <PageCardDescription>{activity.subTitle}</PageCardDescription>
                ) : null}
                <PageText level="p">{activity.content}</PageText>
                <PageCardAction>
                  <PageButton
                    asChild
                    variant="primary"
                    size={preview ? "xs" : "default"}
                  >
                    <Link
                      href={
                        preview
                          ? "#"
                          : `${window.location.origin}${window.location.pathname}/activity-group/${activity.id}`
                      }
                    >
                      {t("activity-group.more-details")}
                    </Link>
                  </PageButton>
                </PageCardAction>
              </PageCardContent>
            </PageCard>
          ))}
        </div>
      </div>
    </section>
  );
}

export const ActivityGroupDisplayElement = ({
  elementId,
}: {
  elementId: string;
}) => {
  const queryElement = trpc.pages.getPageSectionElementById.useQuery(
    elementId,
    {
      enabled: isCUID(elementId),
    },
  );
  if (queryElement.isLoading) return <Spinner />;
  if (!queryElement.data) return <div>Activity group unavailable</div>;

  return (
    <div className={`container mx-auto p-4 py-12`}>
      <PageCard>
        {queryElement.data.images?.[0] ? (
          <Image
            src={queryElement.data.images[0]}
            alt={queryElement.data.title ?? ""}
            className="w-full h-full object-cover"
            width={400}
            height={400}
          />
        ) : null}
        <PageCardTitle>{queryElement.data.title}</PageCardTitle>
        <PageCardDescription>{queryElement.data.subTitle}</PageCardDescription>
        <PageCardContent className="mt-4">
          <PageText level="p">{queryElement.data.content}</PageText>
        </PageCardContent>
      </PageCard>
    </div>
  );
};
