"use client";
import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { startTransition, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Controller } from "react-hook-form";

import { Pencil, Trash } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/shadcn/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/shadcn/field";
import { useCoachingLevel, useCoachingTarget } from "@/lib/offers/useOffers";
import { COACHING_LEVEL, COACHING_TARGET } from "@/lib/offers/data";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import { CoachingTargetEnum } from "@/db/schema/enums";
import { Checkbox } from "../ui/shadcn/checkbox";
import { formatMoney } from "@/lib/formatNumber";
import Confirmation from "../ui/confirmation";
import { useUser } from "@/lib/auth/client";
import { Input } from "../ui/shadcn/input";
import { trpc } from "@/lib/trpc/client";
import { Textarea } from "../ui/shadcn";
import { isCUID } from "@/lib/utils";
import Spinner from "../ui/spinner";
import Modal from "../ui/modal";
import { toast } from "sonner";

type OfferFormValues = {
  name: string;
  target: CoachingTargetEnum;
  excludingTaxes: boolean;
  description: string;
  startDate: string;
  physical: boolean;
  inHouse: boolean;
  myPlace: boolean;
  publicPlace: boolean;
  perHourPhysical: number;
  perDayPhysical: number;
  travelFee: number;
  travelLimit: number;
  webcam: boolean;
  perHourWebcam: number;
  perDayWebcam: number;
  freeHours: number;
  levels: boolean[];
  packs: TPack[];
};

type TPack = {
  nbHours: number;
  packPrice: number;
};

export const CreateOffer = ({ userId }: { userId: string }) => {
  const utils = trpc.useUtils();
  const t = useTranslations("coach");
  const [closeModal, setCloseModal] = useState(false);

  const createOffer = trpc.coachs.createCoachOffer.useMutation({
    onSuccess: () => {
      utils.coachs.getCoachOffers.invalidate(userId);
      toast.success(t("offer.created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit = async (data: OfferFormValues) => {
    const levels = COACHING_LEVEL.filter((_, idx) => data.levels[idx]).map(
      (l) => l.value,
    );
    createOffer.mutate({
      coachId: userId,
      ...data,
      startDate: new Date(data.startDate),
      levels,
    });
    setCloseModal(true);
  };

  return (
    <Modal
      title={t("offer.create-new")}
      buttonIcon={<i className="bx bx-plus bx-sm" />}
      className="w-11/12 max-w-5xl"
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
    >
      <h3>{t("offer.create-new")}</h3>
      <OfferForm onSubmit={onSubmit} onCancel={() => setCloseModal(true)} />
    </Modal>
  );
};

type PropsUpdateDelete = {
  userId: string;
  offerId: string;
};

export const UpdateOffer = ({ userId, offerId }: PropsUpdateDelete) => {
  const utils = trpc.useUtils();
  const t = useTranslations("coach");
  const [initialData, setInitialData] = useState<OfferFormValues | undefined>();
  const [closeModal, setCloseModal] = useState(false);

  const queryOffer = trpc.coachs.getOfferById.useQuery(offerId, {
    enabled: isCUID(offerId),
  });
  useEffect(() => {
    if (queryOffer.data) {
      const levels = COACHING_LEVEL.map(
        (l) =>
          !!queryOffer.data?.coachingLevel?.find((cl) => cl.level === l.value),
      );
      startTransition(() => {
        setInitialData({
          name: queryOffer.data?.name ?? "",
          description: queryOffer.data?.description ?? "",
          target: queryOffer.data?.target ?? "INDIVIDUAL",
          excludingTaxes: queryOffer.data?.excludingTaxes ?? false,
          startDate: formatDateAsYYYYMMDD(
            queryOffer.data?.startDate ?? new Date(Date.now()),
          ),
          inHouse: queryOffer.data?.inHouse ?? false,
          physical: queryOffer.data?.physical ?? false,
          webcam: queryOffer.data?.webcam ?? false,
          myPlace: queryOffer.data?.myPlace ?? false,
          publicPlace: queryOffer.data?.publicPlace ?? false,
          perHourPhysical: queryOffer.data?.perHourPhysical ?? 0,
          perDayPhysical: queryOffer.data?.perDayPhysical ?? 0,
          perHourWebcam: queryOffer.data?.perHourWebcam ?? 0,
          perDayWebcam: queryOffer.data?.perDayWebcam ?? 0,
          travelFee: queryOffer.data?.travelFee ?? 0,
          travelLimit: queryOffer.data?.travelLimit ?? 0,
          freeHours: queryOffer.data?.freeHours ?? 0,
          levels,
          packs:
            queryOffer.data?.packs?.map((p) => ({
              nbHours: p.nbHours ?? 0,
              packPrice: p.packPrice ?? 0,
            })) ?? [],
        });
      });
    }
  }, [queryOffer.data]);

  const updateOffer = trpc.coachs.updateCoachOffer.useMutation({
    onSuccess: () => {
      utils.coachs.getCoachOffers.invalidate(userId);
      utils.coachs.getOfferById.invalidate(offerId);
      utils.coachs.getOfferWithDetails.invalidate(offerId);
      toast.success(t("offer.updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit = async (data: OfferFormValues) => {
    const levels = COACHING_LEVEL.filter((_, idx) => data.levels[idx]).map(
      (l) => l.value,
    );
    updateOffer.mutate({
      id: offerId,
      ...data,
      startDate: new Date(data.startDate),
      levels,
    });
    setInitialData(undefined);
    setCloseModal(true);
  };

  return (
    <Modal
      title={t("offer.update")}
      buttonIcon={<Pencil />}
      variant="outline"
      buttonSize="icon"
      className="w-11/12 max-w-5xl"
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
    >
      <h3>
        {t("offer.update")} {queryOffer.data?.name}
      </h3>
      {initialData ? (
        <OfferForm
          update={true}
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={() => setCloseModal(true)}
        />
      ) : (
        <Spinner />
      )}
    </Modal>
  );
};

export const DeleteOffer = ({ offerId, userId }: PropsUpdateDelete) => {
  const utils = trpc.useUtils();
  const t = useTranslations("coach");

  const deleteOffer = trpc.coachs.deleteCoachOffer.useMutation({
    onSuccess: () => {
      utils.coachs.getCoachOffers.invalidate(userId);
      utils.coachs.getOfferById.invalidate(offerId);
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
      onConfirm={() => {
        deleteOffer.mutate(offerId);
      }}
      buttonIcon={<Trash className="stroke-destructive" />}
      variant="outline"
      buttonSize="icon"
    />
  );
};

type OfferFormProps = {
  onSubmit: (data: OfferFormValues) => void;
  onCancel: () => void;
  update?: boolean;
  initialData?: OfferFormValues;
};

function OfferForm({ onSubmit, onCancel, initialData }: OfferFormProps) {
  const t2 = useTranslations("common");
  const t = useTranslations("coach");

  const [pack, setPack] = useState<TPack>({ nbHours: 0, packPrice: 0 });
  const defaultValues: OfferFormValues = {
    startDate: formatDateAsYYYYMMDD(new Date()),
    name: "",
    target: "INDIVIDUAL",
    excludingTaxes: false,
    description: "",
    inHouse: false,
    physical: false,
    webcam: false,
    myPlace: false,
    publicPlace: false,
    perHourPhysical: 0,
    perDayPhysical: 0,
    perHourWebcam: 0,
    perDayWebcam: 0,
    travelFee: 0,
    travelLimit: 0,
    freeHours: 0,
    levels: Array.from({ length: COACHING_LEVEL.length }, (_, k) => k === 0),
    packs: [],
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    getValues,
    control,
  } = useForm<OfferFormValues>({
    defaultValues,
  });
  const fields = useWatch({
    control,
  });
  const { getName } = useCoachingLevel();
  const { getLabel } = useCoachingTarget();
  const { data: user } = useUser({ withFeatures: true });

  useEffect(() => {
    reset(initialData);
  }, [initialData, reset]);

  const onSubmitForm: SubmitHandler<OfferFormValues> = (data) => {
    if (!user?.features.includes("COACH_OFFER_COMPANY"))
      data.target = "INDIVIDUAL";
    onSubmit(data);
    reset();
  };

  const onError: SubmitErrorHandler<OfferFormValues> = (errors) => {
    console.error("errors", errors);
  };

  function setPackValue(pack: TPack, idx: number) {
    setValue(`packs.${idx}.nbHours`, pack.nbHours);
    setValue(`packs.${idx}.packPrice`, pack.packPrice);
  }

  function handleAddPack() {
    setPackValue(pack, fields.packs?.length ?? 0);
  }

  function handleDeletePack(idx: number) {
    const packs: TPack[] = (
      fields.packs?.filter((_, i) => i !== idx) ?? []
    ).map((p) => ({ nbHours: p.nbHours ?? 0, packPrice: p.packPrice ?? 0 }));
    setValue("packs", packs);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm, onError)}
      className="flex flex-col gap-2 @container"
    >
      <div className="grid grid-cols-1 gap-2 @xl:grid-cols-2">
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="offer-name" className="required">
                {t("offer.name")}
              </FieldLabel>
              <Input
                id="offer-name"
                {...register("name", {
                  required: t("offer.name-mandatory") ?? true,
                })}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="offer-start-date" className="required">
                {t("offer.start-date")}
              </FieldLabel>
              <Input
                id="offer-start-date"
                {...register("startDate", {
                  required: t("offer.date-mandatory") ?? true,
                })}
                type="date"
                defaultValue={formatDateAsYYYYMMDD()}
              />
              {errors.startDate && (
                <FieldError>{errors.startDate.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="offer-free-hours">
                {t("offer.free-hours")}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="offer-free-hours"
                  {...register("freeHours", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  className="w-auto flex-1"
                />
                <span className="text-sm text-base-content/70">h</span>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="offer-target">
                {t("offer.target")}
              </FieldLabel>
              {user?.features.includes("COACH_OFFER_COMPANY") ? (
                <Controller
                  name="target"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as CoachingTargetEnum)
                      }
                    >
                      <SelectTrigger id="offer-target">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COACHING_TARGET.map((target) => (
                          <SelectItem key={target.value} value={target.value}>
                            {t(target.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              ) : (
                <span>
                  {t(getLabel("INDIVIDUAL"))}
                  <span
                    className="tooltip tooltip-error"
                    data-tip={t2("navigation.limited-plan")}
                  >
                    <i className="bx bx-lock bx-xs ml-2" />
                  </span>
                </span>
              )}
            </Field>
          </FieldGroup>
        </FieldSet>
        {fields.target === "COMPANY" ? (
          <Field orientation="horizontal">
            <Checkbox
              id="offer-excluding-taxes"
              {...register("excludingTaxes")}
              defaultChecked={false}
            />
            <FieldLabel htmlFor="offer-excluding-taxes" className="font-normal">
              {t("offer.excluding-taxes")}
            </FieldLabel>
          </Field>
        ) : null}
        <FieldSet>
          <FieldGroup>
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
        </FieldSet>
      </div>
      <Field>
        <FieldLabel>{t("offer.levels")}</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {COACHING_LEVEL.map((level, idx) => (
            <Field
              key={level.value}
              orientation="horizontal"
              className="flex-1"
            >
              <Checkbox
                id={`offer-level-${idx}`}
                {...register(`levels.${idx}`)}
                defaultChecked={false}
              />
              <FieldLabel
                htmlFor={`offer-level-${idx}`}
                className="font-normal"
              >
                {getName(level.value)}
              </FieldLabel>
            </Field>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-2 @4xl:grid-cols-3">
        <fieldset className="rounded border border-primary p-4">
          <div>
            <Field orientation="horizontal">
              <Checkbox
                id="offer-physical"
                {...register("physical")}
                defaultChecked={false}
              />
              <FieldLabel htmlFor="offer-physical" className="font-normal">
                {t("offer.physical")}
              </FieldLabel>
            </Field>
            {fields.physical ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Field orientation="horizontal">
                    <Checkbox
                      id="offer-in-house"
                      {...register("inHouse")}
                      defaultChecked={false}
                    />
                    <FieldLabel
                      htmlFor="offer-in-house"
                      className="font-normal"
                    >
                      {t("offer.in-house")}
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <Checkbox
                      id="offer-my-place"
                      {...register("myPlace")}
                      defaultChecked={false}
                    />
                    <FieldLabel
                      htmlFor="offer-my-place"
                      className="font-normal"
                    >
                      {t("offer.my-place")}
                    </FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <Checkbox
                      id="offer-public-place"
                      {...register("publicPlace")}
                      defaultChecked={false}
                    />
                    <FieldLabel
                      htmlFor="offer-public-place"
                      className="font-normal"
                    >
                      {t("offer.public-place")}
                    </FieldLabel>
                  </Field>
                </div>
                <div>
                  <label>{t("offer.tarif")}</label>
                  <Field>
                    <FieldLabel>{t("offer.tarif")}</FieldLabel>
                    <Field>
                      <FieldLabel
                        htmlFor="per-hour-physical"
                        className="sr-only"
                      >
                        {t("offer.per-hour")}
                      </FieldLabel>
                      <div className="flex items-center gap-2">
                        <Input
                          id="per-hour-physical"
                          {...register("perHourPhysical", {
                            valueAsNumber: true,
                          })}
                          type="number"
                          className="w-auto flex-1"
                        />
                        <span className="text-sm text-base-content/70">
                          €{t("offer.per-hour")}
                        </span>
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel
                        htmlFor="per-day-physical"
                        className="sr-only"
                      >
                        {t("offer.per-day")}
                      </FieldLabel>
                      <div className="flex items-center gap-2">
                        <Input
                          id="per-day-physical"
                          {...register("perDayPhysical", {
                            valueAsNumber: true,
                          })}
                          type="number"
                          className="w-auto flex-1"
                        />
                        <span className="text-sm text-base-content/70">
                          €{t("offer.per-day")}
                        </span>
                      </div>
                    </Field>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="travel-fee">
                      {t("offer.travel-fee")}
                    </FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        id="travel-fee"
                        {...register("travelFee", { valueAsNumber: true })}
                        type="number"
                        className="w-auto flex-1"
                      />
                      <span className="text-sm text-base-content/70">€</span>
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="travel-limit">
                      {t("offer.travel-limit")}
                    </FieldLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        id="travel-limit"
                        {...register("travelLimit", { valueAsNumber: true })}
                        type="number"
                        className="w-auto flex-1"
                      />
                      <span className="text-sm text-base-content/70">km</span>
                    </div>
                  </Field>
                </div>
              </>
            ) : null}
          </div>
        </fieldset>
        <fieldset className="flex flex-col rounded border border-primary p-4">
          <div>
            <Field orientation="horizontal">
              <Checkbox
                id="offer-webcam"
                {...register("webcam")}
                defaultChecked={false}
              />
              <FieldLabel htmlFor="offer-webcam" className="font-normal">
                {t("offer.webcam")}
              </FieldLabel>
            </Field>
            {fields.webcam ? (
              <Field>
                <FieldLabel>{t("offer.tarif")}</FieldLabel>
                <Field>
                  <FieldLabel htmlFor="per-hour-webcam" className="sr-only">
                    {t("offer.per-hour")}
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="per-hour-webcam"
                      {...register("perHourWebcam", {
                        valueAsNumber: true,
                      })}
                      type="number"
                      className="w-auto flex-1"
                    />
                    <span className="text-sm text-base-content/70">
                      €{t("offer.per-hour")}
                    </span>
                  </div>
                </Field>
                <Field>
                  <FieldLabel htmlFor="per-day-webcam" className="sr-only">
                    {t("offer.per-day")}
                  </FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      id="per-day-webcam"
                      {...register("perDayWebcam", {
                        valueAsNumber: true,
                      })}
                      type="number"
                      className="w-auto flex-1"
                    />
                    <span className="text-sm text-base-content/70">
                      €{t("offer.per-day")}
                    </span>
                  </div>
                </Field>
              </Field>
            ) : null}
          </div>
        </fieldset>
        <fieldset className="flex flex-col rounded border border-primary p-4">
          <label>{t("offer.packs")}</label>
          <table className="table-compact w-full table-auto bg-muted">
            <thead>
              <tr>
                <th>{t("offer.nb-hour")}</th>
                <th>{t("offer.tarif")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fields.packs?.map((pack, idx) => (
                <tr key={idx} className="text-end">
                  <td>{pack.nbHours}</td>
                  <td>{formatMoney(pack.packPrice)}</td>
                  <td>
                    <i
                      className="bx bx-trash bx-xs cursor-pointer text-red-500"
                      onClick={() => handleDeletePack(idx)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="pack-nb-hour">
                  {t("offer.nb-hour")}
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="pack-nb-hour"
                    value={pack.nbHours}
                    onChange={(e) =>
                      setPack((p) => ({
                        ...p,
                        nbHours: e.target.valueAsNumber,
                      }))
                    }
                    type="number"
                    className="w-auto flex-1"
                  />
                  <span className="text-sm text-base-content/70">h</span>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="pack-price">{t("offer.tarif")}</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="pack-price"
                    value={pack.packPrice}
                    onChange={(e) =>
                      setPack((p) => ({
                        ...p,
                        packPrice: e.target.valueAsNumber,
                      }))
                    }
                    type="number"
                    className="w-auto flex-1"
                  />
                  <span className="text-sm text-base-content/70">€</span>
                </div>
              </Field>
            </FieldGroup>
          </FieldSet>
          <button
            type="button"
            className="btn-primary btn"
            onClick={() => handleAddPack()}
          >
            {t("offer.add-pack")}
          </button>
        </fieldset>
      </div>
      <div className="col-span-2 flex items-center justify-end gap-2">
        <button
          className="btn-outline btn-secondary btn"
          onClick={(e) => {
            e.preventDefault();
            reset();
            onCancel();
          }}
        >
          {t2("cancel")}
        </button>
        <button className="btn-primary btn" type="submit">
          {t("offer.save")}
        </button>
      </div>
    </form>
  );
}
