"use client";
import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { useCoachingLevel, useCoachingTarget } from "@/lib/offers/useOffers";
import { COACHING_LEVEL, COACHING_TARGET } from "@/lib/offers/data";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import { CoachingTargetEnum } from "@/db/schema/enums";
import { formatMoney } from "@/lib/formatNumber";
import Confirmation from "../ui/confirmation";
import { useUser } from "@/lib/auth/client";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";
import Modal from "../ui/modal";

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
      buttonIcon={<i className="bx bx-edit bx-sm" />}
      variant={"Icon-Outlined-Primary"}
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
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      variant={"Icon-Outlined-Secondary"}
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
    startDate: formatDateAsYYYYMMDD(new Date(Date.now())),
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
        <div>
          <div className="grid grid-cols-[auto_1fr] gap-1">
            <label className="required">{t("offer.name")}</label>
            <div className="flex flex-1 flex-col gap-2">
              <input
                className="input-bordered input"
                {...register("name", {
                  required: t("offer.name-mandatory") ?? true,
                })}
              />
              {errors.name ? (
                <p className="text-sm text-error">{errors.name.message}</p>
              ) : null}
            </div>
            <label className="required">{t("offer.start-date")}</label>
            <div className="flex flex-1 flex-col gap-2">
              <input
                className="input-bordered input"
                {...register("startDate", {
                  required: t("offer.date-mandatory") ?? true,
                })}
                type="date"
                defaultValue={formatDateAsYYYYMMDD()}
              />
              {errors.startDate ? (
                <p className="text-sm text-error">{errors.startDate.message}</p>
              ) : null}
            </div>
            <label>{t("offer.free-hours")}</label>
            <div className="input-group">
              <input
                {...register("freeHours", {
                  valueAsNumber: true,
                })}
                type={"number"}
                className="input-bordered input w-full"
              />
              <span>h</span>
            </div>

            <label>{t("offer.target")}</label>
            {user?.features.includes("COACH_OFFER_COMPANY") ? (
              <select
                className="flex-1"
                defaultValue={getValues("target")}
                {...register("target")}
              >
                {COACHING_TARGET.map((target) => (
                  <option key={target.value} value={target.value}>
                    {t(target.label)}
                  </option>
                ))}
              </select>
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
          </div>
          {fields.target === "COMPANY" ? (
            <div className="form-control col-span-2">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox-primary checkbox"
                  {...register("excludingTaxes")}
                  defaultChecked={false}
                />
                <span className="label-text">{t("offer.excluding-taxes")}</span>
              </label>
            </div>
          ) : null}
        </div>
        <div>
          <label>{t("offer.description")}</label>
          <textarea {...register("description")} rows={4} />
        </div>
      </div>
      <label>{t("offer.levels")}</label>
      <div className="flex flex-wrap gap-2">
        {COACHING_LEVEL.map((level, idx) => (
          <label
            key={level.value}
            className="label flex-1 cursor-pointer justify-start gap-2"
          >
            <input
              type="checkbox"
              className="checkbox-primary checkbox"
              {...register(`levels.${idx}`)}
              defaultChecked={false}
            />
            <span className="label-text">{getName(level.value)}</span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 @4xl:grid-cols-3">
        <fieldset className="rounded border border-primary p-4">
          <div>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox-primary checkbox"
                  {...register("physical")}
                  defaultChecked={false}
                />
                <span className="label-text">{t("offer.physical")}</span>
              </label>
            </div>
            {fields.physical ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox-primary checkbox"
                        {...register("inHouse")}
                        defaultChecked={false}
                      />
                      <span className="label-text">{t("offer.in-house")}</span>
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox-primary checkbox"
                        {...register("myPlace")}
                        defaultChecked={false}
                      />
                      <span className="label-text">{t("offer.my-place")}</span>
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox-primary checkbox"
                        {...register("publicPlace")}
                        defaultChecked={false}
                      />
                      <span className="label-text">
                        {t("offer.public-place")}
                      </span>
                    </label>
                  </div>
                </div>
                <div>
                  <label>{t("offer.tarif")}</label>
                  <div className="input-group mb-2">
                    <input
                      {...register("perHourPhysical", {
                        valueAsNumber: true,
                      })}
                      type={"number"}
                      className="input-bordered input w-full"
                    />
                    <span>€{t("offer.per-hour")}</span>
                  </div>
                  <div className="input-group">
                    <input
                      {...register("perDayPhysical", {
                        valueAsNumber: true,
                      })}
                      type={"number"}
                      className="input-bordered input w-full"
                    />
                    <span>€{t("offer.per-day")}</span>
                  </div>
                  <label>{t("offer.travel-fee")}</label>
                  <div className="input-group">
                    <input
                      {...register("travelFee", { valueAsNumber: true })}
                      type={"number"}
                      className="input-bordered input w-full"
                    />
                    <span>€</span>
                  </div>

                  <label>{t("offer.travel-limit")}</label>
                  <div className="input-group">
                    <input
                      {...register("travelLimit", { valueAsNumber: true })}
                      type={"number"}
                      className="input-bordered input w-full"
                    />
                    <span>km</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </fieldset>
        <fieldset className="flex flex-col rounded border border-primary p-4">
          <div>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox-primary checkbox"
                  {...register("webcam")}
                  defaultChecked={false}
                />
                <span className="label-text">{t("offer.webcam")}</span>
              </label>
            </div>
            {fields.webcam ? (
              <>
                <div>
                  <label>{t("offer.tarif")}</label>
                  <div className="input-group mb-2">
                    <input
                      {...register("perHourWebcam", {
                        valueAsNumber: true,
                      })}
                      type={"number"}
                      className="input-bordered input w-full"
                    />
                    <span>€{t("offer.per-hour")}</span>
                  </div>
                  <div className="input-group">
                    <input
                      {...register("perDayWebcam", {
                        valueAsNumber: true,
                      })}
                      type={"number"}
                      className="input-bordered input w-full"
                    />
                    <span>€{t("offer.per-day")}</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </fieldset>
        <fieldset className="flex flex-col rounded border border-primary p-4">
          <label>{t("offer.packs")}</label>
          <table className="table-compact w-full table-auto bg-base-200">
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
          <div className="grid grid-cols-[auto_1fr]">
            <label>{t("offer.nb-hour")}</label>
            <div className="input-group my-2">
              <input
                value={pack.nbHours}
                onChange={(e) =>
                  setPack((p) => ({
                    ...p,
                    nbHours: e.target.valueAsNumber,
                  }))
                }
                type={"number"}
                className="input-bordered input w-full"
              />
              <span>h</span>
            </div>
            <label>{t("offer.tarif")}</label>
            <div className="input-group mb-2">
              <input
                value={pack.packPrice}
                onChange={(e) =>
                  setPack((p) => ({
                    ...p,
                    packPrice: e.target.valueAsNumber,
                  }))
                }
                type={"number"}
                className="input-bordered input w-full"
              />
              <span>€</span>
            </div>
          </div>
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
