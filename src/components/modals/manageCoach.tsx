"use client";
import { useTranslations } from "next-intl";
import { startTransition, useEffect, useState } from "react";
import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";

import { Controller } from "react-hook-form";

import { Pencil, Plus, Trash } from "lucide-react";

import { toast } from "sonner";

import { Spinner } from "@/components/ui/shadcn/spinner";
import { CoachingTargetEnum } from "@/db/schema/enums";
import { useUser } from "@/lib/auth/client";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatNumber";
import { COACHING_LEVEL, COACHING_TARGET } from "@/lib/offers/data";
import { useCoachingLevel, useCoachingTarget } from "@/lib/offers/useOffers";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Confirmation from "../ui/confirmation";
import DeleteButton from "../ui/deleteButton";
import LockedButton from "../ui/lockedButton";
import Modal from "../ui/modal";
import { Button, Separator, Textarea } from "../ui/shadcn";
import { Checkbox } from "../ui/shadcn/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/shadcn/field";
import { Input } from "../ui/shadcn/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/shadcn/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/shadcn/table";

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
      buttonIcon={<Plus />}
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
    refetchOnWindowFocus: false,
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
    control,
  } = useForm<OfferFormValues>({
    defaultValues,
  });
  const target = useWatch({
    control,
    name: "target",
  });
  const physical = useWatch({
    control,
    name: "physical",
  });
  const webcam = useWatch({
    control,
    name: "webcam",
  });
  const packs = useWatch({
    control,
    name: "packs",
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
    setPackValue(pack, packs?.length ?? 0);
  }

  function handleDeletePack(idx: number) {
    const myPacks: TPack[] = (packs?.filter((_, i) => i !== idx) ?? []).map(
      (p) => ({ nbHours: p.nbHours ?? 0, packPrice: p.packPrice ?? 0 }),
    );
    setValue("packs", myPacks);
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
              <FieldLabel htmlFor="offer-name">{t("offer.name")}</FieldLabel>
              <Input
                id="offer-name"
                {...register("name", {
                  required: t("offer.name-mandatory") ?? true,
                })}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="offer-start-date">
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
              <InputGroup>
                <InputGroupInput
                  id="offer-free-hours"
                  {...register("freeHours", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  className="w-auto flex-1"
                />
                <InputGroupAddon align="inline-end">h</InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldGroup>
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
                <LockedButton label={t(getLabel("INDIVIDUAL"))} />
              )}
            </Field>
            {target === "COMPANY" ? (
              <Controller
                name="excludingTaxes"
                control={control}
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id="offer-excluding-taxes"
                      checked={field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                    <FieldLabel
                      htmlFor="offer-excluding-taxes"
                      className="font-normal"
                    >
                      {t("offer.excluding-taxes")}
                    </FieldLabel>
                  </Field>
                )}
              />
            ) : null}
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
      <h3>{t("offer.levels")}</h3>
      <FieldSet className="flex-row gap-2 flex-wrap">
        {COACHING_LEVEL.map((level, idx) => (
          <Controller
            key={level.value}
            name="levels"
            control={control}
            render={({ field }) => (
              <Field
                key={level.value}
                orientation="horizontal"
                className="flex-1"
              >
                <Checkbox
                  id={`offer-level-${idx}`}
                  checked={field.value[idx]}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                  defaultChecked={false}
                />
                <FieldLabel
                  htmlFor={`offer-level-${idx}`}
                  className="font-normal"
                >
                  {getName(level.value)}
                </FieldLabel>
              </Field>
            )}
          />
        ))}
      </FieldSet>

      <div className="grid grid-cols-1 gap-2 @3xl:grid-cols-3">
        <FieldSet className="rounded border border-primary p-4">
          <FieldGroup>
            <Controller
              name="physical"
              control={control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="offer-physical"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                    defaultChecked={false}
                  />
                  <FieldLabel htmlFor="offer-physical" className="font-normal">
                    {t("offer.physical")}
                  </FieldLabel>
                </Field>
              )}
            />
            {physical ? (
              <>
                <Controller
                  name="inHouse"
                  control={control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id="offer-in-house"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                      <FieldLabel
                        htmlFor="offer-in-house"
                        className="font-normal"
                      >
                        {t("offer.in-house")}
                      </FieldLabel>
                    </Field>
                  )}
                />
                <Controller
                  name="myPlace"
                  control={control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id="offer-my-place"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                      <FieldLabel
                        htmlFor="offer-my-place"
                        className="font-normal"
                      >
                        {t("offer.my-place")}
                      </FieldLabel>
                    </Field>
                  )}
                />
                <Controller
                  name="publicPlace"
                  control={control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id="offer-public-place"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                      <FieldLabel
                        htmlFor="offer-public-place"
                        className="font-normal"
                      >
                        {t("offer.public-place")}
                      </FieldLabel>
                    </Field>
                  )}
                />
                <h4>{t("offer.tarif")}</h4>

                <Field orientation="horizontal">
                  <FieldLabel htmlFor="per-hour-physical" className="sr-only">
                    {t("offer.per-hour")}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="per-hour-physical"
                      {...register("perHourPhysical", { valueAsNumber: true })}
                      type="number"
                    />
                    <InputGroupAddon align="inline-end">
                      €{t("offer.per-hour")}
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel htmlFor="per-day-physical" className="sr-only">
                    {t("offer.per-day")}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="per-day-physical"
                      {...register("perDayPhysical", { valueAsNumber: true })}
                      type="number"
                      className="w-auto flex-1"
                    />
                    <InputGroupAddon align="inline-end">
                      €{t("offer.per-day")}
                    </InputGroupAddon>
                  </InputGroup>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel htmlFor="travel-fee">
                    {t("offer.travel-fee")}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="travel-fee"
                      {...register("travelFee", { valueAsNumber: true })}
                      type="number"
                      className="w-auto flex-1"
                    />
                    <InputGroupAddon align="inline-end">€</InputGroupAddon>
                  </InputGroup>
                </Field>

                <Field orientation="horizontal">
                  <FieldLabel htmlFor="travel-limit" className="sr-only">
                    {t("offer.travel-limit")}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="travel-limit"
                      {...register("travelLimit", { valueAsNumber: true })}
                      type="number"
                      className="w-auto flex-1"
                    />
                    <InputGroupAddon align="inline-end">km</InputGroupAddon>
                  </InputGroup>
                </Field>
              </>
            ) : null}
          </FieldGroup>
        </FieldSet>
        <FieldSet className="flex flex-col rounded border border-primary p-4">
          <FieldGroup>
            <Controller
              name="webcam"
              control={control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="offer-public-place"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(!!checked)}
                    defaultChecked={false}
                  />
                  <FieldLabel
                    htmlFor="offer-public-place"
                    className="font-normal"
                  >
                    {t("offer.webcam")}
                  </FieldLabel>
                </Field>
              )}
            />
            {webcam ? (
              <>
                <h4>{t("offer.tarif")}</h4>
                <Field>
                  <FieldLabel htmlFor="per-hour-webcam" className="sr-only">
                    {t("offer.per-hour")}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="per-hour-webcam"
                      {...register("perHourWebcam", {
                        valueAsNumber: true,
                      })}
                      type="number"
                    />
                    <InputGroupAddon align="inline-end">
                      €{t("offer.per-hour")}
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="per-day-webcam" className="sr-only">
                    {t("offer.per-day")}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="per-day-webcam"
                      {...register("perDayWebcam", {
                        valueAsNumber: true,
                      })}
                      type="number"
                    />
                    <InputGroupAddon align="inline-end">
                      €{t("offer.per-day")}
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              </>
            ) : null}
          </FieldGroup>
        </FieldSet>

        <FieldSet className="flex flex-col rounded border border-primary p-4">
          <label>{t("offer.packs")}</label>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("offer.nb-hour")}</TableHead>
                <TableHead>{t("offer.tarif")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packs?.map((pack, idx) => (
                <TableRow key={idx} className="text-end">
                  <TableCell>{pack.nbHours}</TableCell>
                  <TableCell>{formatMoney(pack.packPrice)}</TableCell>
                  <TableCell>
                    <DeleteButton icon onClick={() => handleDeletePack(idx)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
          <Button type="button" onClick={() => handleAddPack()}>
            {t("offer.add-pack")}
          </Button>
        </FieldSet>
      </div>
      <Separator />
      <div className="col-span-2 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            reset();
            onCancel();
          }}
        >
          {t2("cancel")}
        </Button>
        <Button type="submit">{t("offer.save")}</Button>
      </div>
    </form>
  );
}
