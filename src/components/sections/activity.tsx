"use client";

import { useTranslations } from "next-intl";
import { Fragment, startTransition, useEffect, useState } from "react";
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
import {
  PageCard,
  PageCardContent,
  PageCardDescription,
  PageCardTitle,
} from "../ui/page/card";
import PageContainer from "../ui/page/container";
import PageText from "../ui/page/text";
import { Button, Card, CardContent, Checkbox } from "../ui/shadcn";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../ui/shadcn/field";
import { Input } from "../ui/shadcn/input";
import { Textarea } from "../ui/shadcn/textarea";
import { UploadButton } from "../uploadthing";

type ActivityCreationProps = {
  clubId: string;
  pageId: string;
};

type ActivityForm = {
  imageUrls?: string[];
  title: string;
  subtitle: string;
  description: string;
  activityGroups: string[];
};

export const ActivityCreation = ({ clubId, pageId }: ActivityCreationProps) => {
  const t = useTranslations("pages");
  const [previewTheme, setPreviewTheme] = useState<TThemes>("cupcake");

  const querySection = trpc.pages.getPageSection.useQuery(
    { pageId, section: "ACTIVITIES", createIfNone: true },
    { refetchOnWindowFocus: false },
  );

  const updatePageStyle = trpc.pages.updatePageStyleForClub.useMutation({
    onSuccess() {
      toast.success(t("style-saved"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const groups = trpc.pages.getPageSectionElements.useQuery({
    pageId,
    section: "ACTIVITY_GROUPS",
  });

  if (querySection.isLoading) return <Spinner />;

  return (
    <div className="grid w-full auto-rows-auto gap-2 lg:grid-cols-2">
      <div className="space-y-2">
        <h3>{t("activity.activity-section")}</h3>
        {querySection.data?.id ? (
          <Fragment key={querySection.data.id}>
            <div className="flex flex-wrap gap-2">
              {querySection.data.elements.map((activity) => (
                <Card key={activity.id}>
                  <CardContent>
                    <h4>{activity.title}</h4>
                    <div className="flex items-center justify-center gap-2">
                      <UpdateActivity
                        pageId={pageId}
                        activityId={activity.id!}
                      />
                      <DeleteActivity
                        pageId={pageId}
                        activityId={activity.id!}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <AddActivity pageId={pageId} sectionId={querySection.data.id} />
          </Fragment>
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
        <PageContainer theme={previewTheme as TThemes}>
          {groups.data?.map((group) => (
            <Fragment key={group.id}>
              <PageText level="h2" color="primary" className="text-center">
                {group.title}
              </PageText>
              <section id="ACTIVITIES" className={`w-full bg-muted p-4`}>
                <div className={`@container mx-auto p-4`}>
                  {group.subTitle ? (
                    <PageText
                      level="h4"
                      color="primary"
                      className="text-center"
                    >
                      {group.subTitle}
                    </PageText>
                  ) : null}
                  <div
                    className={
                      "mt-4 grid grid-cols-3 gap-2 @max-xl:grid-cols-2 @max-md:grid-cols-1"
                    }
                  >
                    {querySection.data?.elements
                      .filter((e) =>
                        JSON.parse(e.optionValue ?? "[]").includes(group.id),
                      )
                      .map((e) => (
                        <ActivityContentCard key={e.id} activity={e} preview />
                      ))}
                  </div>
                </div>
              </section>
            </Fragment>
          ))}
        </PageContainer>
      </div>
    </div>
  );
};

type ActivityProps = {
  pageId: string;
  sectionId: string;
};

function AddActivity({ pageId, sectionId }: ActivityProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const [close, setClose] = useState(false);

  const createActivity = trpc.pages.createPageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "ACTIVITIES",
      });
      toast.success(t("activity.activity-created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function handleSubmit(data: ActivityForm) {
    createActivity.mutate({
      pageId,
      sectionId,
      elementType: "CARD",
      title: data.title,
      subTitle: data.subtitle,
      content: data.description,
      images: data.imageUrls,
      optionValue: JSON.stringify(data.activityGroups),
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("activity.new-activity")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      className="w-11/12 max-w-4xl"
    >
      <h3>{t("activity.new-activity")}</h3>
      <ActivityForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
        pageId={pageId}
      />
    </Modal>
  );
}

type UpdateActivityProps = {
  pageId: string;
  activityId: string;
};

function UpdateActivity({ pageId, activityId }: UpdateActivityProps) {
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
        subtitle: activityData.subTitle ?? "",
        description: activityData.content ?? "",
        imageUrls: activityData.images ?? [],
        activityGroups: JSON.parse(activityData.optionValue ?? "[]"),
      });
    });
  }, [queryActivity.data]);

  const updateAG = trpc.pages.updatePageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "ACTIVITIES",
      });
      toast.success(t("activity.activity-updated"));
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
      subTitle: data.subtitle,
      content: data.description,
      images: data.imageUrls,
      optionValue: JSON.stringify(data.activityGroups),
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("activity.update-activity")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      variant="outline"
      buttonIcon={<Pencil />}
      buttonSize="icon"
      className="w-11/12 max-w-4xl"
    >
      <h3>{t("activity.update-activity")}</h3>
      <ActivityForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
        initialValues={initialData}
        initialImageUrl={queryActivity.data?.images?.[0]}
        pageId={pageId}
      />
    </Modal>
  );
}

function DeleteActivity({ pageId, activityId }: UpdateActivityProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");

  const deleteActivity = trpc.pages.deletePageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "ACTIVITIES",
      });
      toast.success(t("activity.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("activity.deletion-message")}
      title={t("activity.deletion")}
      buttonIcon={<Trash />}
      onConfirm={() => {
        deleteActivity.mutate(activityId);
      }}
      variant="destructive"
      buttonSize="icon"
    />
  );
}

type ActivityFormProps = {
  onSubmit: (data: ActivityForm) => void;
  initialValues?: ActivityForm;
  initialImageUrl?: string;
  onCancel: () => void;
  update?: boolean;
  pageId: string;
};

const defaultValues: ActivityForm = {
  title: "",
  subtitle: "",
  description: "",
  imageUrls: [],
  activityGroups: [],
};

function ActivityForm({
  onSubmit,
  initialValues,
  onCancel,
  pageId,
}: ActivityFormProps) {
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
  const groups = trpc.pages.getPageSectionElements.useQuery(
    {
      pageId,
      section: "ACTIVITY_GROUPS",
    },
    {
      enabled: isCUID(pageId),
      refetchOnWindowFocus: false,
    },
  );
  const [activityGroups, setActivityGroups] = useState<boolean[]>([]);

  useEffect(() => {
    if (!groups.data) return;
    if (groups.data?.length) {
      const ags: boolean[] = [];
      for (const ag of groups.data) {
        ags.push(initialValues?.activityGroups.includes(ag.id) ?? false);
      }
      startTransition(() => {
        setActivityGroups(ags);
      });
    }
  }, [groups.data, initialValues?.activityGroups]);

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  const handleDeleteImage = () => {
    setValue("imageUrls", []);
  };

  const onSuccess: SubmitHandler<ActivityForm> = (data) => {
    const ags =
      groups.data?.filter((_, idx) => activityGroups[idx]).map((ag) => ag.id) ??
      [];
    onSubmit({ ...data, activityGroups: ags });
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSuccess)}
      className="grid grid-cols-[3fr_2fr] gap-2"
    >
      <div>
        <UploadButton
          endpoint="imageAttachment"
          onClientUploadComplete={(result) =>
            setValue(
              "imageUrls",
              result.map((r) => r.ufsUrl),
            )
          }
          buttonText={t("activity.image")}
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
              <FieldLabel htmlFor="activity-title">
                {t("activity.title")}
              </FieldLabel>
              <Input
                id="activity-title"
                {...register("title", {
                  required: t("activity.title-mandatory") ?? true,
                })}
              />
              {errors?.title?.message && (
                <FieldError>{errors.title.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-subtitle">
                {t("activity.subtitle")}
              </FieldLabel>
              <Input id="activity-subtitle" {...register("subtitle")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-description">
                {t("activity.description")}
              </FieldLabel>
              <Textarea
                id="activity-description"
                {...register("description")}
                rows={4}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </div>
      <FieldSet className="border border-primary rounded p-2">
        <FieldLegend>{t("activity.activity-group")}</FieldLegend>
        <FieldGroup>
          {groups.data?.map((group, idx) => (
            <Field orientation="horizontal" key={group.id}>
              <Checkbox
                id={group.id}
                checked={activityGroups[idx] ?? false}
                onCheckedChange={(checked) => {
                  const ags = [...activityGroups];
                  ags[idx] = Boolean(checked);
                  setActivityGroups(ags);
                }}
              />
              <FieldLabel htmlFor={group.id}>{group.title}</FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>
      <div className="col-span-full mt-4 flex items-center justify-end gap-2">
        <Button
          type="button"
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

type ActivityDisplayProps = {
  pageId: string;
  groupId: string;
};

export const ActivityDisplayCard = ({
  pageId,
  groupId,
}: ActivityDisplayProps) => {
  const querySection = trpc.pages.getPageSection.useQuery({
    pageId,
    section: "ACTIVITIES",
  });

  if (querySection.isLoading) return <Spinner />;
  if (!querySection.data) return <div>Activities section unavailable</div>;

  return (
    <div
      className={`container mx-auto mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`}
    >
      {querySection.data?.elements
        .filter((e) => JSON.parse(e.optionValue ?? "[]").includes(groupId))
        .map((e) => (
          <ActivityContentCard key={e.id} activity={e} />
        ))}
    </div>
  );
};

type ActivityContentElement = InferSelectModel<typeof pageSectionElement>;

type ActivitiesContentCardProps = {
  preview?: boolean;
  activity: ActivityContentElement;
};

function ActivityContentCard({
  preview = false,
  activity,
}: ActivitiesContentCardProps) {
  return (
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
        <PageCardTitle
          className={`card-title ${preview ? "text-base" : ""} text-primary`}
        >
          {activity.title}
        </PageCardTitle>
        {activity.subTitle ? (
          <PageCardDescription>{activity.subTitle}</PageCardDescription>
        ) : null}
        <PageText level="p">{activity.content}</PageText>
      </PageCardContent>
    </PageCard>
  );
}
