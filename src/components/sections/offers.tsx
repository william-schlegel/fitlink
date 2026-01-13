"use client";

import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { startTransition, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { InferSelectModel } from "drizzle-orm";

import { Pencil, Trash } from "lucide-react";

import { toast } from "sonner";

import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "../ui/shadcn";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/shadcn/field";
import { useDisplaySubscriptionInfo } from "@/lib/useDisplaySubscription";
import ThemeSelector, { TThemes } from "../themeSelector";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { pageSectionElement } from "@/db/schema/page";
import Modal, { getButtonSize } from "../ui/modal";
import { List } from "@/app/member/[userId]/list";
import { Textarea } from "../ui/shadcn/textarea";
import { formatMoney } from "@/lib/formatNumber";
import DeleteButton from "../ui/deleteButton";
import Confirmation from "../ui/confirmation";
import { UploadButton } from "../uploadthing";
import { useUser } from "@/lib/auth/client";
import { Input } from "../ui/shadcn/input";
import ButtonIcon from "../ui/buttonIcon";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";

type OfferCreationProps = {
  clubId: string;
  pageId: string;
};

type OfferFormValues = {
  imageUrls?: string[];
  title: string;
  subTitle: string;
  description: string;
  offerId: string;
};

export const OfferCreation = ({ clubId, pageId }: OfferCreationProps) => {
  const t = useTranslations("pages");
  const [previewTheme, setPreviewTheme] = useState<TThemes>("cupcake");

  const querySection = trpc.pages.getPageSection.useQuery(
    { pageId, section: "OFFERS", createIfNone: true },
    {
      enabled: isCUID(pageId),
      refetchOnWindowFocus: false,
    },
  );

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
        <h3>{t("offer.offer-section")}</h3>
        {querySection.data?.id ? (
          <>
            <div className="flex flex-wrap gap-2">
              {querySection.data.elements.map((offer) => (
                <Card key={offer.id}>
                  <CardContent>
                    <h4>{offer.title}</h4>
                    <Separator />
                    <div className="flex items-center justify-center gap-2">
                      <UpdateOffer
                        clubId={clubId}
                        pageId={pageId}
                        offerId={offer.id}
                      />
                      <DeleteOffer
                        clubId={clubId}
                        pageId={pageId}
                        offerId={offer.id}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <AddOffer
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
          <div className="grid grid-cols-2 gap-4 bg-muted p-4">
            {querySection.data?.elements.map((card) => (
              <OfferContentCard
                key={card.id}
                offer={card}
                clubId={clubId}
                preview
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

type OfferProps = {
  pageId: string;
  sectionId: string;
  clubId: string;
};

function AddOffer({ clubId, pageId, sectionId }: OfferProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const [close, setClose] = useState(false);

  const createOffer = trpc.pages.createPageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "OFFERS",
      });
      toast.success(t("offer.offer-created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function handleSubmit(data: OfferFormValues) {
    createOffer.mutate({
      pageId,
      sectionId,
      elementType: "CARD",
      title: data.title,
      subTitle: data.subTitle,
      content: data.description,
      images: data.imageUrls,
      optionValue: data.offerId,
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("offer.new-offer")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      className="w-11/12 max-w-2xl"
    >
      <h3>
        <span>{t("offer.new-offer")}</span>
      </h3>
      <OfferForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
        pageId={pageId}
        clubId={clubId}
      />
    </Modal>
  );
}

type UpdateOfferProps = {
  pageId: string;
  offerId: string;
  clubId: string;
};

function UpdateOffer({ clubId, pageId, offerId }: UpdateOfferProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");
  const [close, setClose] = useState(false);
  const [initialData, setInitialData] = useState<OfferFormValues | undefined>();
  const queryOffer = trpc.pages.getPageSectionElementById.useQuery(offerId, {
    enabled: isCUID(offerId),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (queryOffer.data) {
      const data = queryOffer.data;
      startTransition(() => {
        setInitialData({
          title: data.title ?? "",
          subTitle: data.subTitle ?? "",
          description: data.content ?? "",
          imageUrls: data.images ?? [],
          offerId: data.optionValue ?? "",
        });
      });
    }
  }, [queryOffer.data, setInitialData]);

  const updateAG = trpc.pages.updatePageSectionElement.useMutation({
    onSuccess: (data) => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "OFFERS",
      });
      toast.success(t("offer.offer-updated"));
      setInitialData({
        title: data[0].title ?? "",
        subTitle: data[0].subTitle ?? "",
        description: data[0].content ?? "",
        imageUrls: data[0].imageUrls ?? [],
        offerId: data[0].optionValue ?? "",
      });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function handleSubmit(data: OfferFormValues) {
    updateAG.mutate({
      id: offerId,
      pageId,
      title: data.title,
      subTitle: data.subTitle,
      content: data.description,
      images: data.imageUrls,
      optionValue: data.offerId,
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("offer.update-offer")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      variant="outline"
      buttonIcon={<Pencil />}
      buttonSize="icon"
      className="w-11/12 max-w-2xl"
    >
      <h3>
        <span>{t("offer.update-offer")}</span>
      </h3>
      <OfferForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
        initialValues={initialData}
        initialImageUrl={queryOffer.data?.images?.[0]}
        pageId={pageId}
        clubId={clubId}
      />
    </Modal>
  );
}

function DeleteOffer({ pageId, offerId }: UpdateOfferProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("pages");

  const deleteOffer = trpc.pages.deletePageSectionElement.useMutation({
    onSuccess: () => {
      utils.pages.getPageSection.invalidate({
        pageId,
        section: "OFFERS",
      });
      toast.success(t("offer.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("offer.deletion-message")}
      title={t("offer.deletion")}
      buttonIcon={<Trash />}
      onConfirm={() => {
        deleteOffer.mutate(offerId);
      }}
      variant="destructive"
      buttonSize="icon"
    />
  );
}

type OfferFormProps = {
  onSubmit: (data: OfferFormValues) => void;
  initialValues?: OfferFormValues;
  initialImageUrl?: string;
  onCancel: () => void;
  update?: boolean;
  pageId: string;
  clubId: string;
};

function OfferForm({
  onSubmit,
  initialValues,
  onCancel,
  clubId,
}: OfferFormProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("pages");

  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm<OfferFormValues>({
    defaultValues: {
      title: initialValues?.title ?? "",
      subTitle: initialValues?.subTitle ?? "",
      description: initialValues?.description ?? "",
      imageUrls: initialValues?.imageUrls ?? [],
      offerId: initialValues?.offerId ?? "",
    },
  });

  const imageUrls = useWatch({ control, name: "imageUrls" });

  const offers = trpc.subscriptions.getSubscriptionsForClub.useQuery(clubId, {
    enabled: isCUID(clubId),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  const handleDeleteImage = () => {
    setValue("imageUrls", []);
  };

  const onSuccess: SubmitHandler<OfferFormValues> = (data) => {
    onSubmit({ ...data });
    reset({
      title: data.title,
      subTitle: data.subTitle,
      description: data.description,
      imageUrls: data.imageUrls,
      offerId: data.offerId,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSuccess)}>
      <div className="space-y-2">
        <UploadButton
          endpoint="imageAttachment"
          onClientUploadComplete={(result) =>
            setValue(
              "imageUrls",
              result.map((r) => r.ufsUrl),
            )
          }
          buttonText={t("offer.image")}
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
              label={t("offer.delete-image")}
              icon
              onClick={handleDeleteImage}
              className="absolute right-2 bottom-2"
            />
          </div>
        ) : null}

        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="offer-title" className="required">
                {t("offer.title")}
              </FieldLabel>
              <Input
                id="offer-title"
                {...register("title", {
                  required: t("offer.title-mandatory") ?? true,
                })}
              />
              {errors?.title?.message && (
                <FieldError>{errors.title.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="offer-subtitle">
                {t("offer.subtitle")}
              </FieldLabel>
              <Input id="offer-subtitle" {...register("subTitle")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="offer-description">
                {t("offer.description")}
              </FieldLabel>
              <Textarea
                id="offer-description"
                {...register("description")}
                rows={4}
              />
            </Field>
          </FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel htmlFor="offer-offer">{t("offer.offer")}</FieldLabel>
            <Controller
              control={control}
              name="offerId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("offer.offer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {offers.data?.map((offer) => (
                      <SelectItem key={offer.id} value={offer.id}>
                        {offer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
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

type OfferDisplayProps = {
  pageId: string;
  clubId: string;
};

export const OfferDisplayCard = ({ pageId, clubId }: OfferDisplayProps) => {
  const querySection = trpc.pages.getPageSection.useQuery(
    {
      pageId,
      section: "OFFERS",
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  if (querySection.isLoading) return <Spinner />;
  if (!querySection.data) return <div>Offers section unavailable</div>;

  return (
    <div className="grid grid-flow-col justify-center gap-4 bg-muted p-4">
      {querySection.data?.elements
        .filter((e) => e.elementType === "CARD")
        .map((e) => (
          <OfferContentCard key={e.id} offer={e} clubId={clubId} />
        ))}
    </div>
  );
};

type OffersContentCardProps = {
  preview?: boolean;
  offer: InferSelectModel<typeof pageSectionElement>;
  clubId: string;
};

type OfferContentElement = InferSelectModel<typeof pageSectionElement>;

function OfferContentCard({
  preview = false,
  offer,
  clubId,
}: OffersContentCardProps) {
  const user = useUser();
  const offerQuery = trpc.subscriptions.getSubscriptionById.useQuery(
    offer.optionValue ?? "",
    { enabled: isCUID(offer.optionValue) },
  );
  const { shortInfo, sites, rooms, activityGroups, activities } =
    useDisplaySubscriptionInfo(
      offerQuery.data?.mode ?? undefined,
      offerQuery.data?.restriction ?? undefined,
      offerQuery.data?.activitieGroups.map((ag) => ag.activityGroupId) ?? [],
      offerQuery.data?.activities.map((ag) => ag.activityId) ?? [],
      offerQuery.data?.sites.map((ag) => ag.siteId) ?? [],
      offerQuery.data?.rooms.map((ag) => ag.roomId) ?? [],
    );
  const t = useTranslations();

  return (
    <div
      className={`card ${
        preview ? "card-compact w-full" : "w-96"
      } bg-card shadow-xl`}
    >
      <figure>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={offer.imageUrls?.[0] ?? ""} alt={offer.title ?? ""} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{offer.title}</h2>
        {offer.subTitle ? (
          <p className="font-semibold">{offer.subTitle}</p>
        ) : null}
        {offer.content ? <p>{offer.content}</p> : null}
        {shortInfo ? <p>{shortInfo}</p> : ""}
        <div className="flex gap-2">
          <List label="sites" items={sites} />
          <List label="rooms" items={rooms} />
          <List label="activity-groups" items={activityGroups} />
          <List label="activities" items={activities} />
        </div>
        <div className="grid grid-cols-[auto,1fr] items-center gap-2">
          {offerQuery.data?.monthly ? (
            <>
              <label>{t("club.subscription.monthly")}</label>
              <span>{formatMoney(offerQuery.data?.monthly)}</span>
            </>
          ) : null}
          {offerQuery.data?.yearly ? (
            <>
              <label>{t("club.subscription.yearly")}</label>
              <span>{formatMoney(offerQuery.data?.yearly)}</span>
            </>
          ) : null}
          {offerQuery.data?.inscriptionFee ? (
            <>
              <label>{t("club.subscription.inscription-fee")}</label>
              <span>{formatMoney(offerQuery.data?.inscriptionFee)}</span>
            </>
          ) : null}
          {offerQuery.data?.cancelationFee ? (
            <>
              <label>{t("club.subscription.cancelation-fee")}</label>
              <span>{formatMoney(offerQuery.data?.cancelationFee)}</span>
            </>
          ) : null}
        </div>
        {preview ? (
          <div className="card-actions justify-end">
            <button className="btn btn-primary">
              {t("pages.offer.select")}
            </button>
          </div>
        ) : user?.data?.id ? (
          <div>
            <Link
              href={`/user/${user.data.id}/subscribe?clubId=${clubId}&offerId=${offer.optionValue}`}
            >
              <button className="btn btn-primary">
                {t("pages.offer.select")}
              </button>
            </Link>
          </div>
        ) : (
          <div>
            <Link href="/user/signin">
              <button className="btn btn-primary">
                {t("pages.offer.connect-to-subscribe")}
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
