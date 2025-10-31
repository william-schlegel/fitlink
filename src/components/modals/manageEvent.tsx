"use client";

import {
  FormProvider,
  SubmitHandler,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import MapComponent, { Marker } from "react-map-gl/mapbox";
import { isDate, startOfToday } from "date-fns";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { isSameDay } from "date-fns";
import { format } from "date-fns";

import { useRouter } from "next/navigation";

import Modal, { getButtonSize, TModalVariant } from "../ui/modal";
import AddressSearch, { AddressData } from "../ui/addressSearch";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import ButtonIcon, { ButtonSize } from "../ui/buttonIcon";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import { formatDateLocalized } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatNumber";
import Confirmation from "../ui/confirmation";
import { UploadButton } from "../uploadthing";
import { TextError } from "../ui/simpleform";
import { useUser } from "@/lib/auth/client";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";
import Ribbon from "../ui/ribbon";
import { env } from "@/env";

type EventFormValues = {
  name: string;
  brief: string;
  description: string;
  startDate: string;
  endDate: string;
  startDisplay: string;
  endDisplay: string;
  bannerText: string;
  cancelled: boolean;
  price: number;
  free: boolean;
  address: string;
  searchAddress?: string | null;
  longitude: number;
  latitude: number;
  imageUrls?: string[];
};

type CreateEventProps = {
  clubId: string;
};

export const CreateEvent = ({ clubId }: CreateEventProps) => {
  const utils = trpc.useUtils();
  const t = useTranslations("club");
  const [close, setClose] = useState(false);
  const { data: user } = useUser();
  const router = useRouter();
  const createEvent = trpc.events.createEvent.useMutation({
    onSuccess: () => {
      utils.dashboards.getManagerDataForUserId.invalidate(user?.id);
      toast.success(t("event.created"));
      router.refresh();
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  async function handleSubmit(data: EventFormValues) {
    createEvent.mutate({
      clubId,
      name: data.name,
      brief: data.brief,
      description: data.description,
      bannerText: data.bannerText,
      cancelled: data.cancelled,
      free: data.free,
      address: data.address,
      searchAddress: data.searchAddress,
      longitude: data.longitude,
      latitude: data.latitude,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      startDisplay: new Date(data.startDisplay),
      endDisplay: new Date(data.endDisplay),
      price: isNaN(data.price) ? 0 : Number(data.price),
      imageUrls: data.imageUrls,
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("event.create")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      className="w-11/12 max-w-4xl"
    >
      <h3>
        <span>{t("event.create-new")}</span>
      </h3>
      <EventForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
      />
    </Modal>
  );
};

export const UpdateEvent = ({
  eventId,
  variant = "Icon-Outlined-Primary",
  buttonSize = "sm",
}: PropsUpdateDelete) => {
  const { data: user } = useUser();
  const utils = trpc.useUtils();
  const t = useTranslations("club");
  const [initialData, setInitialData] = useState<EventFormValues | undefined>();
  const [closeModal, setCloseModal] = useState(false);
  const queryEvent = trpc.events.getEventById.useQuery(eventId, {
    enabled: isCUID(eventId),
  });

  useEffect(() => {
    if (!queryEvent.data) return;
    setInitialData({
      name: queryEvent.data?.name ?? "",
      brief: queryEvent.data?.brief ?? "",
      description: queryEvent.data?.description ?? "",
      startDate: formatDateAsYYYYMMDD(queryEvent.data?.startDate, true),
      endDate: formatDateAsYYYYMMDD(queryEvent.data?.endDate, true),
      startDisplay: formatDateAsYYYYMMDD(queryEvent.data?.startDisplay, true),
      endDisplay: formatDateAsYYYYMMDD(queryEvent.data?.endDisplay, true),
      bannerText: queryEvent.data?.bannerText ?? "",
      cancelled: !!queryEvent.data?.cancelled,
      price: queryEvent.data?.price ?? 0,
      free: !!queryEvent.data?.free,
      address: queryEvent.data?.address ?? "",
      searchAddress: queryEvent.data?.searchAddress ?? "",
      longitude: queryEvent.data?.longitude ?? LONGITUDE,
      latitude: queryEvent.data?.latitude ?? LATITUDE,
      imageUrls: queryEvent.data?.imageUrls ?? [],
    });
  }, [queryEvent.data]);

  const updateEvent = trpc.events.updateEvent.useMutation({
    onSuccess: () => {
      utils.dashboards.getManagerDataForUserId.invalidate(user?.id ?? "");
      toast.success(t("event.updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit = async (data: EventFormValues) => {
    updateEvent.mutate({
      id: eventId,
      name: data.name,
      brief: data.brief,
      description: data.description,
      bannerText: data.bannerText,
      cancelled: data.cancelled,
      free: data.free,
      address: data.address,
      searchAddress: data.searchAddress,
      longitude: data.longitude,
      latitude: data.latitude,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      startDisplay: new Date(data.startDisplay),
      endDisplay: new Date(data.endDisplay),
      price: isNaN(data.price) ? 0 : Number(data.price),
      imageUrls: data.imageUrls,
    });
    setInitialData(undefined);
    setCloseModal(true);
  };

  return (
    <Modal
      title={t("event.update")}
      buttonIcon={<i className={`bx bx-edit ${getButtonSize(buttonSize)}`} />}
      variant={variant}
      buttonSize={buttonSize}
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
      className="w-11/12 max-w-4xl"
    >
      <h3>
        {t("event.update")} {queryEvent.data?.name}
      </h3>
      {initialData ? (
        <EventForm
          update={true}
          initialValues={initialData}
          onSubmit={onSubmit}
          onCancel={() => setCloseModal(true)}
        />
      ) : (
        <Spinner />
      )}
    </Modal>
  );
};

type PropsUpdateDelete = {
  clubId: string;
  eventId: string;
  variant?: TModalVariant;
  buttonSize?: ButtonSize;
};

export const DeleteEvent = ({
  clubId,
  eventId,
  variant = "Icon-Outlined-Secondary",
  buttonSize = "sm",
}: PropsUpdateDelete) => {
  const utils = trpc.useUtils();
  const user = useUser();
  const t = useTranslations("club");

  const deleteEvent = trpc.events.deleteEvent.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(user.data?.id ?? "");
      utils.clubs.getClubById.invalidate({
        clubId,
        userId: user.data?.id ?? "",
      });
      toast.success(t("event.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("event.deletion-message")}
      title={t("event.deletion")}
      buttonIcon={<i className={`bx bx-trash ${getButtonSize(buttonSize)}`} />}
      onConfirm={() => {
        deleteEvent.mutate(eventId);
      }}
      variant={variant}
      buttonSize={buttonSize}
    />
  );
};

type EventFormProps = {
  onSubmit: (data: EventFormValues) => void;
  initialValues?: EventFormValues;
  onCancel: () => void;
  update?: boolean;
};

const defaultValues = {
  name: "",
  brief: "",
  description: "",
  startDate: formatDateAsYYYYMMDD(startOfToday(), true),
  endDate: "",
  startDisplay: formatDateAsYYYYMMDD(startOfToday(), true),
  endDisplay: "",
  bannerText: "",
  cancelled: false,
  price: 0,
  free: false,
  address: "",
  searchAddress: "",
  longitude: LONGITUDE,
  latitude: LATITUDE,
  images: undefined,
};

function EventForm({ onSubmit, initialValues, onCancel }: EventFormProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("club");
  const form = useForm<EventFormValues>({
    defaultValues,
  });
  const imageUrls = useWatch({ control: form.control, name: "imageUrls" });
  const free = useWatch({ control: form.control, name: "free" });

  const handleDeleteImage = () => {
    form.setValue("imageUrls", []);
  };

  const onSuccess: SubmitHandler<EventFormValues> = (data) => {
    onSubmit(data);
    form.reset();
  };

  function setAddress(adr: AddressData) {
    form.setValue("searchAddress", adr.address);
    form.setValue("longitude", adr.lng);
    form.setValue("latitude", adr.lat);
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSuccess)}
        className="grid grid-cols-2 gap-2"
      >
        <div className="grid grid-cols-[auto_1fr] place-content-start gap-y-1">
          <UploadButton
            endpoint="imageAttachment"
            onClientUploadComplete={(result) =>
              form.setValue(
                "imageUrls",
                result.map((r) => r.ufsUrl),
              )
            }
            buttonText={t("event.image")}
            className="col-span-2"
          />

          {imageUrls && imageUrls.length > 0 ? (
            <div className="relative col-span-full flex gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrls[0]}
                alt=""
                className="max-h-[10rem] w-full object-cover"
              />
              <button
                className="absolute right-2 bottom-2"
                type="button"
                onClick={handleDeleteImage}
              >
                <ButtonIcon
                  iconComponent={<i className="bx bx-trash" />}
                  title={t("event.delete-image")}
                  buttonVariant="Icon-Outlined-Secondary"
                  buttonSize="md"
                />
              </button>
            </div>
          ) : null}

          <label className="required">{t("event.name")}</label>
          <div>
            <input
              className="input-bordered input w-full"
              {...form.register("name", {
                required: t("event.name-mandatory") ?? true,
              })}
            />
            {form.formState.errors.name ? (
              <p className="text-xs text-error">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <label className="required self-start">{t("event.brief")}</label>
          <div>
            <textarea
              {...form.register("brief", {
                required: t("event.brief-mandatory") ?? true,
              })}
              className="field-sizing-content"
              rows={4}
            />
            <TextError err={form.formState.errors?.brief?.message} />
          </div>
          <label className="self-start">{t("event.description")}</label>
          <textarea
            {...form.register("description")}
            className="field-sizing-content"
            rows={4}
          />
        </div>
        <div className="grid grid-cols-[auto_1fr] place-content-start gap-y-1">
          <label className="required">{t("event.start-date")}</label>
          <div>
            <input
              type="datetime-local"
              className="input-bordered input w-full"
              {...form.register("startDate", {
                required: t("event.date-mandatory") ?? true,
              })}
            />
            <TextError err={form.formState.errors?.startDate?.message} />
          </div>
          <label className="required">{t("event.end-date")}</label>
          <div>
            <input
              type="datetime-local"
              className="input-bordered input w-full"
              {...form.register("endDate", {
                required: t("event.date-mandatory") ?? true,
              })}
            />
            <TextError err={form.formState.errors?.endDate?.message} />
          </div>
          <label className="required">{t("event.start-display")}</label>
          <div>
            <input
              type="datetime-local"
              className="input-bordered input w-full"
              {...form.register("startDisplay", {
                required: t("event.date-mandatory") ?? true,
              })}
            />
            <TextError err={form.formState.errors?.startDisplay?.message} />
          </div>
          <label className="required">{t("event.end-display")}</label>
          <div>
            <input
              type="datetime-local"
              className="input-bordered input w-full"
              {...form.register("endDisplay", {
                required: t("event.date-mandatory") ?? true,
              })}
            />
            <TextError err={form.formState.errors?.endDisplay?.message} />
          </div>
          <label>{t("event.banner")}</label>
          <input
            className="input-bordered input w-full"
            {...form.register("bannerText")}
          />
          <div className="form-control col-span-full">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="checkbox-primary checkbox"
                {...form.register("cancelled")}
                defaultChecked={false}
              />
              <span className="label-text">{t("event.cancelled")}</span>
            </label>
          </div>
          <div className="form-control col-span-full">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="checkbox-primary checkbox"
                {...form.register("free")}
                defaultChecked={false}
              />
              <span className="label-text">{t("event.free")}</span>
            </label>
          </div>
          {free ? null : (
            <>
              <label>{t("event.price")}</label>
              <div className="input-group">
                <input
                  type="number"
                  className="input-bordered input w-full"
                  {...form.register("price")}
                />

                <span>€</span>
              </div>
            </>
          )}
          <label>{t("event.address")}</label>
          <input
            className="input-bordered input w-full"
            {...form.register("address")}
          />
          <label>{t("event.location")}</label>
          <AddressSearch
            defaultAddress={initialValues?.searchAddress ?? ""}
            iconSearch
            onSearch={(adr) => setAddress(adr)}
          />
        </div>
        <DisplayEventCard />
        <div className="col-span-full flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn btn-outline btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              form.reset();
              onCancel();
            }}
          >
            {tCommon("cancel")}
          </button>
          <button className="btn btn-primary" type="submit">
            {tCommon("save")}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}

function DisplayEventCard() {
  const [showMap, setShowMap] = useState(false);
  const t = useTranslations("club");
  const { control } = useFormContext();
  const fields = useWatch({ control });

  return (
    <div
      className="relative col-span-full aspect-[4_/_1] w-full rounded border border-primary p-2 text-center text-white"
      style={{
        backgroundImage: `${fields.imageUrls?.[0] ? `url(${fields.imageUrls?.[0]})` : "unset"}`,
        backgroundColor: "rgb(0 0 0 / 0.5)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundBlendMode: "darken",
      }}
    >
      <h3 className="">{fields.name}</h3>
      <p className="text-lg">{fields.brief}</p>
      <p>{fields.description}</p>
      <p className="text-xl font-bold text-accent">
        <DisplayDate dtStart={fields.startDate} dtEnd={fields.endDate} />
      </p>
      {fields.cancelled ? (
        <p className="absolute left-1/4 top-1/4 bottom-1/4 right-1/4 flex -rotate-12 items-center justify-center bg-error/80 px-20 py-4 text-3xl font-bold text-error-content">
          {t("event.cancelled")}
        </p>
      ) : null}
      {fields.bannerText ? (
        <Ribbon bgColor="accent" offset="1rem" text={fields.bannerText} />
      ) : null}
      <div className="grid grid-cols-2 items-stretch px-4">
        <p className="text-left text-xl font-bold">
          {fields.free
            ? t("event.free")
            : fields.price
              ? t("event.participation-price", {
                  price: formatMoney(fields.price),
                })
              : ""}
        </p>
        <p className="space-x-4 text-right text-xl font-bold">
          <span>{fields.address}</span>
          {fields.searchAddress ? (
            <button type="button" onClick={() => setShowMap((prev) => !prev)}>
              <ButtonIcon
                iconComponent={
                  <i className={`bx ${showMap ? "bx-x" : "bx-map"} bx-sm`} />
                }
                title={t("event.view-map")}
                buttonVariant="Icon-Outlined-Secondary"
                buttonSize="md"
              />
            </button>
          ) : null}
        </p>
        <div
          className={`absolute left-0 top-0 bottom-0 ${
            showMap ? "w-1/2" : "w-0"
          }`}
          style={{ transition: "width 200ms ease" }}
        >
          <MapComponent
            initialViewState={{ zoom: 8 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v9"
            mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
            attributionControl={false}
            longitude={fields.longitude ?? LONGITUDE}
            latitude={fields.latitude ?? LATITUDE}
          >
            <Marker
              longitude={fields.longitude ?? LONGITUDE}
              latitude={fields.latitude ?? LATITUDE}
              anchor="bottom"
            >
              <i className="bx bx-map bx-sm text-secondary" />
            </Marker>
          </MapComponent>
        </div>
      </div>
    </div>
  );
}

export function ShowEventCard({ eventId }: { eventId: string }) {
  const [fields, setFields] = useState<EventFormValues | undefined>(undefined);
  const event = trpc.events.getEventById.useQuery(eventId, {
    enabled: isCUID(eventId),
  });

  const form = useForm<EventFormValues>();

  useEffect(() => {
    if (!event.data) return;
    form.reset({
      name: event.data.name,
      brief: event.data.brief,
      description: event.data.description,
      startDate: formatDateAsYYYYMMDD(event.data.startDate, true),
      endDate: formatDateAsYYYYMMDD(event.data.endDate, true),
      startDisplay: formatDateAsYYYYMMDD(event.data.startDisplay, true),
      endDisplay: formatDateAsYYYYMMDD(event.data.endDisplay, true),
      bannerText: event.data.bannerText,
      cancelled: event.data.cancelled,
      price: event.data.price,
      free: event.data.free,
      address: event.data.address,
      searchAddress: event.data.searchAddress,
      longitude: event.data.longitude ?? LONGITUDE,
      latitude: event.data.latitude ?? LATITUDE,
      imageUrls: event.data.imageUrls ?? [],
    });
  }, [event.data]);
  const t = useTranslations("club");

  return (
    <Modal
      title={t("event.show")}
      className="w-11/12 max-w-4xl"
      variant="Icon-Primary"
      buttonSize="sm"
      buttonIcon={<i className="bx bx-show bx-xs" />}
    >
      {event.isLoading ? (
        <Spinner />
      ) : fields ? (
        <FormProvider {...form}>
          <DisplayEventCard />
        </FormProvider>
      ) : (
        <p>{t("event.no-event")}</p>
      )}
    </Modal>
  );
}

type DisplayDateProps = {
  dtStart: string | null | undefined;
  dtEnd: string | null | undefined;
};

function DisplayDate({ dtStart, dtEnd }: DisplayDateProps) {
  const t = useTranslations("club");

  if (!dtStart) return null;
  const start = new Date(dtStart);
  if (!isDate(start)) return null;
  if (!dtEnd)
    return (
      <span>
        {t("event.start-at", {
          date: formatDateLocalized(start, {
            withDay: "long",
            dateFormat: "long",
          }),
          hour: format(start, "HH:mm"),
        })}
      </span>
    );
  const end = new Date(dtEnd);
  const sameDay = isSameDay(start, end);
  if (sameDay)
    return (
      <span>
        {t("event.same-day-from-to", {
          date: formatDateLocalized(start, {
            withDay: "long",
            dateFormat: "long",
          }),
          start: format(start, "HH:mm"),
          end: format(end, "HH:mm"),
        })}
      </span>
    );
  return (
    <span>
      {t("event.from-to", {
        start: formatDateLocalized(start, {
          withDay: "long",
          dateFormat: "long",
          withTime: true,
        }),
        end: formatDateLocalized(end, {
          withDay: "long",
          dateFormat: "long",
          withTime: true,
        }),
      })}
    </span>
  );
}
