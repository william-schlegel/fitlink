"use client";

import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { startTransition, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Trash } from "lucide-react";

import { Field, FieldGroup, FieldLabel, FieldSet } from "../ui/shadcn/field";
import ThemeSelector, { TThemes } from "../themeSelector";
import { Textarea } from "../ui/shadcn/textarea";
import DeleteButton from "../ui/deleteButton";
import Confirmation from "../ui/confirmation";
import { UploadButton } from "../uploadthing";
import { getButtonSize } from "../ui/modal";
import { Input } from "../ui/shadcn/input";
import ButtonIcon from "../ui/buttonIcon";
import { trpc } from "@/lib/trpc/client";
import { Button } from "../ui/shadcn";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";

type TitleCreationProps = {
  clubId: string;
  pageId: string;
};

type TitleCreationForm = {
  imageUrls?: string[];
  title: string;
  subtitle: string;
  description: string;
};

export const TitleCreation = ({ clubId, pageId }: TitleCreationProps) => {
  const t = useTranslations("pages");
  const { register, handleSubmit, control, setValue, reset } =
    useForm<TitleCreationForm>();
  const imageUrls = useWatch({ control, name: "imageUrls" });
  const fields = useWatch({ control });
  const utils = trpc.useUtils();
  const [updating, setUpdating] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<TThemes>("cupcake");

  const querySection = trpc.pages.getPageSection.useQuery(
    { pageId, section: "TITLE" },
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
    const hc = querySection.data?.elements.find(
      (e) => e.elementType === "HERO_CONTENT",
    );

    const resetData: TitleCreationForm = {
      description: hc?.content ?? "",
      title: hc?.title ?? "",
      subtitle: hc?.subTitle ?? "",
      imageUrls: hc?.imageUrls ?? [],
    };
    reset(resetData);
    startTransition(() => {
      setUpdating(true);
    });
  }, [querySection.data, setUpdating, reset]);

  const createSection = trpc.pages.createPageSection.useMutation({
    onSuccess() {
      toast.success(t("section-created"));
      utils.pages.getPageSection.invalidate({ pageId, section: "TITLE" });
      reset();
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const deleteSection = trpc.pages.deletePageSection.useMutation({
    onSuccess() {
      toast.success(t("section-deleted"));
      utils.pages.getPageSection.invalidate({ pageId, section: "TITLE" });
      reset();
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const createSectionElement =
    trpc.pages.createPageSectionElement.useMutation();
  const updateSectionElement = trpc.pages.updatePageSectionElement.useMutation({
    onSuccess() {
      toast.success(t("section-updated"));
      utils.pages.getPageSection.invalidate({ pageId, section: "TITLE" });
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

  const onSubmit: SubmitHandler<TitleCreationForm> = async (data) => {
    if (updating) {
      const hc = querySection?.data?.elements.find(
        (e) => e.elementType === "HERO_CONTENT",
      );
      if (hc) {
        await updateSectionElement.mutateAsync({
          id: hc.id,
          title: data.title,
          subTitle: data.subtitle,
          content: data.description,
          images: data.imageUrls ? data.imageUrls : undefined,
        });
      }
    } else {
      const section = await createSection.mutateAsync({
        model: "TITLE",
        pageId,
      });
      await createSectionElement.mutateAsync({
        elementType: "HERO_CONTENT",
        sectionId: section[0].id,
        title: data.title,
        subTitle: data.subtitle,
        content: data.description,
        images: data.imageUrls ? data.imageUrls : undefined,
      });
    }
  };

  const handleDeleteImage = () => {
    setValue("imageUrls", []);
  };

  const handleDeleteSection = () => {
    deleteSection.mutate({ pageId, sectionId: querySection.data?.id ?? "" });
  };

  if (querySection.isLoading) return <Spinner />;

  return (
    <div className="grid w-full auto-rows-auto gap-2 lg:grid-cols-2">
      <div>
        <h3 className="flex items-center gap-2 justify-between">
          <span>{t(updating ? "updating-section" : "creation-section")}</span>
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
        </h3>

        <form
          className="space-y-2 rounded border border-primary p-2"
          onSubmit={handleSubmit(onSubmit)}
        >
          <UploadButton
            endpoint="imageAttachment"
            onClientUploadComplete={(result) =>
              setValue(
                "imageUrls",
                result.map((r) => r.ufsUrl),
              )
            }
            buttonText={t("title.image")}
          />

          {imageUrls && imageUrls.length > 0 ? (
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-60 max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrls[0]} alt="" />
                <DeleteButton
                  icon
                  label={t("hero.delete-image")}
                  onClick={handleDeleteImage}
                  className="absolute right-2 bottom-2 z-10"
                />
              </div>
            </div>
          ) : null}
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title-title">
                  {t("title.title")}
                </FieldLabel>
                <Input id="title-title" {...register("title")} type="text" />
              </Field>
              <Field>
                <FieldLabel htmlFor="title-subtitle">
                  {t("title.subtitle")}
                </FieldLabel>
                <Input
                  id="title-subtitle"
                  {...register("subtitle")}
                  type="text"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="title-description">
                  {t("title.description")}
                </FieldLabel>
                <Textarea
                  id="title-description"
                  {...register("description")}
                  rows={4}
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <div className="col-span-2 flex justify-between">
            <Button className="ml-auto" type="submit">
              {t("save-section")}
            </Button>
          </div>
        </form>
      </div>
      <div className={`space-y-2`}>
        <h3 className="flex flex-wrap items-center justify-between">
          <span>{t("preview")}</span>
          <ThemeSelector
            onSelect={(t) => setPreviewTheme(t)}
            onSave={(t) => updatePageStyle.mutate({ clubId, pageStyle: t })}
          />
        </h3>
        <div data-theme={previewTheme}>
          <TitleContent
            imageSrc={imageUrls?.[0] ?? undefined}
            title={fields.title}
            subtitle={fields.subtitle}
            description={fields.description}
            preview={true}
          />
        </div>
      </div>
    </div>
  );
};

type TitleDisplayProps = {
  clubId: string;
  pageId: string;
};

export const TitleDisplay = ({ pageId }: TitleDisplayProps) => {
  const querySection = trpc.pages.getPageSection.useQuery(
    {
      pageId,
      section: "TITLE",
    },
    {
      refetchOnWindowFocus: false,
    },
  );
  const titleContent = querySection.data?.elements.find(
    (e) => e.elementType === "HERO_CONTENT",
  );
  if (querySection.isLoading) return <Spinner />;
  if (!querySection.data) return <div>Title section unavailable</div>;

  return (
    <TitleContent
      imageSrc={titleContent?.imageUrls?.[0]}
      title={titleContent?.title ?? ""}
      subtitle={titleContent?.subTitle ?? ""}
      description={titleContent?.content ?? ""}
    />
  );
};

type TitleContentProps = {
  imageSrc?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  preview?: boolean;
};

function TitleContent({
  imageSrc,
  title,
  subtitle,
  description,
  preview = false,
}: TitleContentProps) {
  return (
    <div
      className={`cover flex ${
        preview ? "aspect-4/1" : "min-h-[30vh]"
      } w-full flex-col items-center justify-center gap-4`}
      style={{
        backgroundImage: `${imageSrc ? `url(${imageSrc})` : "unset"}`,
        backgroundColor: "rgb(0 0 0 / 0.5)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "darken",
      }}
    >
      <p
        className={`${
          preview
            ? "text-3xl"
            : "text-[clamp(4rem,5vw,6rem)] leading-[clamp(6rem,7.5vw,9rem)]"
        } font-bold text-white`}
      >
        {title}
      </p>
      <p
        className={`${
          preview
            ? "text-lg"
            : "text-[clamp(1.5rem,2.5vw,3rem)] leading-[clamp(2.25rem,3.75vw,4.5rem)]"
        } font-semibold text-white`}
      >
        {subtitle}
      </p>
      <p className="text-gray-100">{description}</p>
    </div>
  );
}
