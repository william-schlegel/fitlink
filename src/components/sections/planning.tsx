"use client";

import { SubmitHandler, useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { PageSectionElementTypeEnum } from "@/db/schema/enums";
import ThemeSelector, { TThemes } from "../themeSelector";
import Modal, { getButtonSize } from "../ui/modal";
import Confirmation from "../ui/confirmation";
import { UploadButton } from "../uploadthing";
import { TextError } from "../ui/simpleform";
import ButtonIcon from "../ui/buttonIcon";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";

type PlanningCreationProps = {
  clubId: string;
  pageId: string;
};

type PlanningFormValues = {
  imageUrls?: string[];
  title: string;
  subtitle: string;
  description: string;
  sites: string[];
};

export const PlanningCreation = ({ clubId, pageId }: PlanningCreationProps) => {
  const t = useTranslations("pages");
  const utils = trpc.useUtils();
  const [previewTheme, setPreviewTheme] = useState<TThemes>("cupcake");

  const createSection = trpc.pages.createPageSection.useMutation();
  const querySection = trpc.pages.getPageSection.useQuery(
    { pageId, section: "PLANNINGS" },
    {
      refetchOnWindowFocus: false,
    },
  );
  useEffect(() => {
    if (!querySection.data) {
      createSection.mutate({
        pageId,
        model: "PLANNINGS",
      });
      utils.pages.getPageSection.refetch({ pageId, section: "PLANNINGS" });
    }
  }, [querySection.data, createSection, utils, pageId]);

  const updatePageStyle = trpc.pages.updatePageStyleForClub.useMutation({
    onSuccess() {
      toast.success(t("style-saved"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  if (querySection.isLoading) return <Spinner />;

  return (
    <div className="grid w-full auto-rows-auto gap-2 lg:grid-cols-2">
      <div className="space-y-2">
        <h3>{t("planning.planning-section")}</h3>
        {querySection.data?.id ? (
          <>
            <div className="flex flex-wrap gap-2">
              {querySection.data.elements.map((planning) => (
                <div
                  key={planning.id}
                  className="rounded border border-primary p-4"
                >
                  <p>{planning.title}</p>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <UpdatePlanning
                      clubId={clubId}
                      pageId={pageId}
                      planningId={planning.id}
                    />
                    <DeletePlanning
                      clubId={clubId}
                      pageId={pageId}
                      planningId={planning.id}
                    />
                  </div>
                </div>
              ))}
            </div>
            <AddPlanning
              clubId={clubId}
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
        <div data-theme={previewTheme}>
          {querySection.data?.elements.map((card) => (
            <PlanningContentCard key={card.id} planning={card} preview />
          ))}
        </div>
      </div>
    </div>
  );
};

type PlanningProps = {
  pageId: string;
  sectionId: string;
  clubId: string;
};

function AddPlanning({ clubId, pageId, sectionId }: PlanningProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const [close, setClose] = useState(false);

  const createPlanning = trpc.pages.createPageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "PLANNINGS",
      });
      toast.success(t("planning.planning-created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function handleSubmit(data: PlanningFormValues) {
    createPlanning.mutate({
      pageId,
      sectionId,
      elementType: "CARD",
      title: data.title,
      subTitle: data.subtitle,
      content: data.description,
      images: data.imageUrls,
      optionValue: JSON.stringify(data.sites),
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("planning.new-planning")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      className="w-11/12 max-w-4xl"
    >
      <h3>
        <span>{t("planning.new-planning")}</span>
      </h3>
      <PlanningForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
        pageId={pageId}
        clubId={clubId}
      />
    </Modal>
  );
}

type UpdatePlanningProps = {
  pageId: string;
  planningId: string;
  clubId: string;
};

function UpdatePlanning({ clubId, pageId, planningId }: UpdatePlanningProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const [close, setClose] = useState(false);
  const [initialData, setInitialData] = useState<
    PlanningFormValues | undefined
  >();
  const queryPlanning = trpc.pages.getPageSectionElementById.useQuery(
    planningId,
    {
      enabled: isCUID(planningId),
      refetchOnWindowFocus: false,
    },
  );
  useEffect(() => {
    if (!queryPlanning.data) return;
    setInitialData({
      title: queryPlanning.data?.title ?? "",
      subtitle: queryPlanning.data?.subTitle ?? "",
      description: queryPlanning.data?.content ?? "",
      imageUrls: queryPlanning.data?.images ?? [],
      sites: JSON.parse(queryPlanning.data?.optionValue ?? "[]"),
    });
  }, [queryPlanning.data, setInitialData]);

  const updateAG = trpc.pages.updatePageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "PLANNINGS",
      });
      toast.success(t("planning.planning-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function handleSubmit(data: PlanningFormValues) {
    updateAG.mutate({
      id: planningId,
      pageId,
      title: data.title,
      subTitle: data.subtitle,
      content: data.description,
      images: data.imageUrls,
      optionValue: JSON.stringify(data.sites),
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("planning.update-planning")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      variant="Icon-Outlined-Primary"
      buttonIcon={<i className={`bx bx-edit ${getButtonSize("sm")}`} />}
      buttonSize="sm"
      className="w-11/12 max-w-4xl"
    >
      <h3>
        <span>{t("planning.update-planning")}</span>
      </h3>
      <PlanningForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
        initialValues={initialData}
        pageId={pageId}
        clubId={clubId}
      />
    </Modal>
  );
}

function DeletePlanning({ pageId, planningId }: UpdatePlanningProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");

  const deletePlanning = trpc.pages.deletePageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "PLANNINGS",
      });
      toast.success(t("planning.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("planning.deletion-message")}
      title={t("planning.deletion")}
      buttonIcon={<i className={`bx bx-trash ${getButtonSize("sm")}`} />}
      onConfirm={() => {
        deletePlanning.mutate(planningId);
      }}
      variant={"Icon-Outlined-Secondary"}
      buttonSize={"sm"}
    />
  );
}

type PlanningFormProps = {
  onSubmit: (data: PlanningFormValues) => void;
  initialValues?: PlanningFormValues;
  onCancel: () => void;
  update?: boolean;
  pageId: string;
  clubId: string;
};

const defaultValues: PlanningFormValues = {
  title: "",
  subtitle: "",
  description: "",
  imageUrls: [],
  sites: [],
};

function PlanningForm({
  onSubmit,
  initialValues,
  onCancel,
  clubId,
}: PlanningFormProps) {
  const t = useTranslations();
  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
    reset,
    setValue,
  } = useForm<PlanningFormValues>({
    defaultValues,
  });
  const imageUrls = useWatch({ control, name: "imageUrls" });
  const [planningGroups, setPlanningGroups] = useState<boolean[]>([]);
  const sites = trpc.sites.getSitesForClub.useQuery(clubId, {
    enabled: isCUID(clubId),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!sites.data) return;
    if (sites.data?.length) {
      const sts: boolean[] = [];
      for (const st of sites.data) {
        sts.push(initialValues?.sites.includes(st.id) ?? false);
      }
      setPlanningGroups(sts);
    }
  }, [sites.data, initialValues, setPlanningGroups]);

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  const handleDeleteImage = () => {
    setValue("imageUrls", []);
  };

  const onSuccess: SubmitHandler<PlanningFormValues> = (data) => {
    const sts =
      sites.data?.filter((_, idx) => planningGroups[idx]).map((ag) => ag.id) ??
      [];
    onSubmit({ ...data, sites: sts });
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSuccess)}
      className="grid grid-cols-[3fr_2fr] gap-2"
    >
      <div className="grid grid-cols-[auto_1fr] place-content-start gap-y-1">
        <UploadButton
          endpoint="imageAttachment"
          onClientUploadComplete={(result) =>
            setValue(
              "imageUrls",
              result.map((r) => r.ufsUrl),
            )
          }
          buttonText={t("pages.planning.image")}
          className="col-span-2"
        />

        {imageUrls && imageUrls.length > 0 ? (
          <div className="relative col-span-full flex gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrls[0]}
              alt=""
              className="max-h-[10rem] w-full object-contain"
            />
            <button
              className="absolute right-2 bottom-2"
              type="button"
              onClick={handleDeleteImage}
            >
              <ButtonIcon
                iconComponent={<i className="bx bx-trash" />}
                title={t("pages.planning.delete-image")}
                buttonVariant="Icon-Outlined-Secondary"
                buttonSize="md"
              />
            </button>
          </div>
        ) : null}

        <label className="required">{t("pages.planning.title")}</label>
        <div>
          <input
            className="input-bordered input w-full"
            {...register("title", {
              required: t("pages.planning.title-mandatory") ?? true,
            })}
          />
          <TextError err={errors?.title?.message} />
        </div>
        <label>{t("pages.planning.subtitle")}</label>
        <input
          className="input-bordered input w-full"
          {...register("subtitle")}
        />
        <label className="self-start">{t("pages.planning.description")}</label>
        <textarea
          {...register("description")}
          className="field-sizing-content"
          rows={4}
        />
      </div>
      <div>
        <label>{t("pages.planning.sites")}</label>
        <div className="rounded border border-primary p-2">
          {sites.data?.map((group, idx) => (
            <div key={group.id} className="form-control">
              <div className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox-primary checkbox"
                  checked={planningGroups[idx] ?? false}
                  onChange={(e) => {
                    const ags = [...planningGroups];
                    ags[idx] = e.target.checked;
                    setPlanningGroups(ags);
                  }}
                />
                <span className="label-text">{group.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-full mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          className="btn-outline btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            reset();
            onCancel();
          }}
        >
          {t("common.cancel")}
        </button>
        <button className="btn btn-primary" type="submit">
          {t("common.save")}
        </button>
      </div>
    </form>
  );
}

type PlanningDisplayProps = {
  pageId: string;
};

export const PlanningDisplayCard = ({ pageId }: PlanningDisplayProps) => {
  const querySection = trpc.pages.getPageSection.useQuery(
    {
      pageId,
      section: "PLANNINGS",
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  if (querySection.isLoading) return <Spinner />;
  if (!querySection.data) return <div>Plannings section unavailable</div>;

  return (
    <div className={`container mx-auto mt-4`}>
      {querySection.data?.elements
        .filter((e) => e.elementType === "CARD")
        .map((e) => (
          <PlanningContentCard key={e.id} planning={e} />
        ))}
    </div>
  );
};

type PlanningsContentCardProps = {
  preview?: boolean;
  planning: PlanningContentElement;
};

type PlanningContentElement = {
  id: string;
  title: string | null;
  subTitle: string | null;
  content: string | null;
  elementType: PageSectionElementTypeEnum | null;
  link: string | null;
  optionValue: string | null;
  images: string[] | null;
};

function PlanningContentCard({
  preview = false,
  planning,
}: PlanningsContentCardProps) {
  return (
    <>
      <h2
        className={`${
          preview
            ? "text-xl"
            : "text-[clamp(4rem,5vw,6rem)] leading-[clamp(6rem,7.5vw,9rem)]"
        } text-center font-bold text-white`}
      >
        {planning.title}
      </h2>
      <div
        className={`cover flex ${
          preview ? "aspect-[4/3]" : "min-h-[90vh]"
        } w-full flex-col items-center justify-center gap-4`}
        style={{
          backgroundImage: `${
            planning?.images?.[0] ? `url(${planning.images[0]})` : "unset"
          }`,
          backgroundColor: "rgb(255 255 255 / 0.5)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "lighten",
        }}
      ></div>
    </>
  );
}
