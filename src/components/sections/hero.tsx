"use client";

import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Trash } from "lucide-react";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "../ui/shadcn";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "../ui/shadcn/input-group";
import { Field, FieldGroup, FieldLabel, FieldSet } from "../ui/shadcn/field";
import { usePageSection } from "@/lib/sections/useGetSection";
import ThemeSelector, { TThemes } from "../themeSelector";
import { PageSectionModelEnum } from "@/db/schema/enums";
import { Textarea } from "../ui/shadcn/textarea";
import DeleteButton from "../ui/deleteButton";
import Confirmation from "../ui/confirmation";
import { UploadButton } from "../uploadthing";
import { Input } from "../ui/shadcn/input";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Spinner from "../ui/spinner";
import { toast } from "sonner";

import "@/app/pageComponents.css";
import "@/app/pageTheme.css";

type HeroCreationProps = {
  clubId: string;
  pageId: string;
};

type HeroCreationForm = {
  imageUrl?: string;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  linkedPage: string;
  pageSection: PageSectionModelEnum;
  protocol: string;
  url: string;
};

export const HeroCreation = ({ clubId, pageId }: HeroCreationProps) => {
  const t = useTranslations("pages");
  const { register, handleSubmit, getValues, control, setValue, reset } =
    useForm<HeroCreationForm>();
  const [imagePreview, setImagePreview] = useState("");
  const fields = useWatch({ control });
  const utils = trpc.useUtils();
  const [updating, setUpdating] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<TThemes>("cupcake");
  const { getSectionName, getSections } = usePageSection();

  const querySection = trpc.pages.getPageSection.useQuery(
    { pageId, section: "HERO" },
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
    const cta = querySection.data?.elements.find(
      (e) => e.elementType === "CTA",
    );
    const imageUrl = hc?.imageUrls?.[0] ?? "";
    const linkUrl = cta?.link
      ? new URL(cta.link)
      : { protocol: "https:", host: "", pathname: "" };
    const resetData: HeroCreationForm = {
      cta: cta?.title ?? "",
      description: hc?.content ?? "",
      linkedPage: cta?.pageId ?? "url",
      pageSection: cta?.pageSection ?? "HERO",
      url: `${linkUrl.host}${linkUrl.pathname}`,
      protocol: linkUrl.protocol,
      title: hc?.title ?? "",
      subtitle: hc?.subTitle ?? "",
    };
    reset(resetData);
    startTransition(() => {
      setImagePreview(imageUrl);
      setUpdating(true);
    });
  }, [querySection.data, reset]);

  const [sections, setSections] = useState<PageSectionModelEnum[]>([]);
  const queryPages = trpc.pages.getPagesForClub.useQuery(clubId, {
    enabled: isCUID(clubId),
  });
  const createSection = trpc.pages.createPageSection.useMutation({
    onSuccess() {
      toast.success(t("section-created"));
      utils.pages.getPageSection.invalidate({ pageId, section: "HERO" });
      // reset();
      // setImagePreview("");
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const deleteSectionElement =
    trpc.pages.deletePageSectionElement.useMutation();
  const deleteSection = trpc.pages.deletePageSection.useMutation({
    onSuccess() {
      toast.success(t("section-deleted"));
      utils.pages.getPageSection.invalidate({ pageId, section: "HERO" });
      reset();
      setImagePreview("");
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
      utils.pages.getPageSection.invalidate({ pageId, section: "HERO" });
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

  const onSubmit: SubmitHandler<HeroCreationForm> = async (data) => {
    if (updating) {
      const hc = querySection?.data?.elements.find(
        (e) => e.elementType === "HERO_CONTENT",
      );
      const cta = querySection?.data?.elements.find(
        (e) => e.elementType === "CTA",
      );
      if (hc) {
        await updateSectionElement.mutateAsync({
          id: hc.id,
          title: data.title,
          subTitle: data.subtitle,
          content: data.description,
          images: data.imageUrl ? [data.imageUrl] : undefined,
        });
      }
      if (data.cta) {
        if (cta) {
          await updateSectionElement.mutateAsync({
            id: cta.id,
            title: data.cta,
            link:
              data.linkedPage === "url"
                ? `${data.protocol}//${data.url}`
                : undefined,
            pageId: data.linkedPage === "url" ? undefined : data.linkedPage,
            pageSection:
              data.linkedPage === "url" ? undefined : data.pageSection,
          });
        } else {
          if (querySection.data?.id)
            await createSectionElement.mutateAsync({
              elementType: "CTA",
              sectionId: querySection.data.id,
              title: data.cta,
              link: data.url ? `${data.protocol}//${data.url}` : undefined,
              pageId: data.linkedPage === "url" ? undefined : data.linkedPage,
              pageSection:
                data.linkedPage === "url" ? undefined : data.pageSection,
            });
        }
      } else if (cta) {
        await deleteSectionElement.mutateAsync(cta.id);
      }
    } else {
      const section = await createSection.mutateAsync({
        model: "HERO",
        pageId,
      });
      await createSectionElement.mutateAsync({
        elementType: "HERO_CONTENT",
        sectionId: section[0].id,
        title: data.title,
        subTitle: data.subtitle,
        content: data.description,
        images: data.imageUrl ? [data.imageUrl] : undefined,
      });
      if (data.cta) {
        await createSectionElement.mutateAsync({
          elementType: "CTA",
          sectionId: section[0].id,
          title: data.cta,
          link: data.url ? `${data.protocol}//${data.url}` : undefined,
          pageId: data.linkedPage === "url" ? undefined : data.linkedPage,
          pageSection: data.linkedPage === "url" ? undefined : data.pageSection,
        });
      }
    }
  };

  useEffect(() => {
    if (!isCUID(fields.linkedPage)) {
      startTransition(() => {
        setSections([]);
      });
      return;
    }
    const page = queryPages?.data?.find((p) => p.id === fields.linkedPage);
    if (page) {
      startTransition(() => {
        setSections(getSections(page.target ?? "HOME"));
      });
    }
  }, [fields.linkedPage, queryPages?.data, getSections]);

  useEffect(() => {
    if (fields.imageUrl) {
      const imageUrl = fields.imageUrl;
      startTransition(() => {
        setImagePreview(imageUrl);
      });
    }
  }, [fields.imageUrl]);

  const handleDeleteImage = () => {
    setImagePreview("");
    setValue("imageUrl", undefined);
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
              setValue("imageUrl", result[0].ufsUrl)
            }
            buttonText={t("hero.image")}
          />
          {imagePreview ? (
            <div className="flex items-center justify-center gap-2">
              <div className="relative w-60 max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="" />
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
                <FieldLabel htmlFor="hero-title">{t("hero.title")}</FieldLabel>
                <Input {...register("title")} id="hero-title" type="text" />
              </Field>
              <Field>
                <FieldLabel htmlFor="hero-subtitle">
                  {t("hero.subtitle")}
                </FieldLabel>
                <Input
                  {...register("subtitle")}
                  id="hero-subtitle"
                  type="text"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="hero-description">
                  {t("hero.description")}
                </FieldLabel>
                <Textarea
                  {...register("description")}
                  id="hero-description"
                  rows={4}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="hero-cta">
                  {t("hero.button-cta")}
                </FieldLabel>
                <Input {...register("cta")} id="hero-cta" type="text" />
              </Field>
            </FieldGroup>
            {fields.cta ? (
              <div className="grid grid-cols-2 gap-2">
                <Field>
                  <FieldLabel>{t("hero.linked-page")}</FieldLabel>
                  <Controller
                    control={control}
                    name="linkedPage"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("hero.linked-page")} />
                        </SelectTrigger>
                        <SelectContent>
                          {queryPages.data?.map((page) => (
                            <SelectItem key={page.id} value={page.id}>
                              {page.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="url">
                            {t("hero.external-url")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field>
                  <FieldLabel>{t("hero.linked-section")}</FieldLabel>
                  <Controller
                    control={control}
                    name="pageSection"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("hero.linked-section")} />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((sec) => (
                            <SelectItem key={sec} value={sec}>
                              {getSectionName(sec)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>
            ) : null}
            {fields.cta && fields.linkedPage === "url" ? (
              <Field>
                <FieldLabel htmlFor="hero-url">
                  {t("hero.external-url")}
                </FieldLabel>
                <InputGroup>
                  <InputGroupButton>
                    <Controller
                      control={control}
                      name="protocol"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full border-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="https:">https://</SelectItem>
                            <SelectItem value="http:">http://</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </InputGroupButton>
                  <InputGroupInput
                    {...register("url")}
                    id="hero-url"
                    type="text"
                    className="flex-1"
                  />
                </InputGroup>
              </Field>
            ) : null}
            <Separator />
            <Button className="ml-auto" type="submit">
              {t("save-section")}
            </Button>
          </FieldSet>
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
          <HeroContent
            imageSrc={imagePreview}
            title={fields.title}
            subtitle={fields.subtitle}
            description={fields.description}
            cta={fields.cta}
            preview={true}
          />
        </div>
      </div>
    </div>
  );
};

type HeroDisplayProps = {
  clubId: string;
  pageId: string;
};

export const HeroDisplay = ({ clubId, pageId }: HeroDisplayProps) => {
  const querySection = trpc.pages.getPageSection.useQuery({
    pageId,
    section: "HERO",
  });
  const heroContent = querySection.data?.elements.find(
    (e) => e.elementType === "HERO_CONTENT",
  );
  const cta = querySection.data?.elements.find((e) => e.elementType === "CTA");

  if (querySection.isLoading) return <Spinner />;
  if (!querySection.data) return <div>Hero section unavailable</div>;

  return (
    <HeroContent
      imageSrc={heroContent?.imageUrls?.[0]}
      title={heroContent?.title ?? ""}
      subtitle={heroContent?.subTitle ?? ""}
      description={heroContent?.content ?? ""}
      cta={cta?.title ?? ""}
      ctaLink={
        cta?.link ??
        `/presentation-page/club/${clubId}/${cta?.pageId}#${cta?.pageSection}`
      }
    />
  );
};

type HeroContentProps = {
  imageSrc?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  cta?: string;
  ctaLink?: string;
  preview?: boolean;
};

function HeroContent({
  imageSrc,
  title,
  subtitle,
  description,
  cta,
  ctaLink,
  preview = false,
}: HeroContentProps) {
  const router = useRouter();

  return (
    <div
      className={`cover flex ${
        preview ? "aspect-4/3" : "min-h-screen"
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
      {cta && (
        <button
          className={`btn btn-primary ${
            preview ? "btn-sm" : "btn-xl"
          } w-fit normal-case`}
          onClick={() => {
            if (ctaLink) router.push(ctaLink);
          }}
        >
          {cta}
        </button>
      )}
    </div>
  );
}
