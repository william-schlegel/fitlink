"use client";

import {
  FormProvider,
  SubmitHandler,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { startTransition, useEffect, useState } from "react";
import MapComponent, { Marker } from "react-map-gl/mapbox";
import { isDate, startOfToday } from "date-fns";
import { useTranslations } from "next-intl";
import "mapbox-gl/dist/mapbox-gl.css";
import { isSameDay } from "date-fns";
import { format } from "date-fns";

import { useRouter } from "next/navigation";

import { Eye, Map, MapPin, Pencil, Trash, X } from "lucide-react";

import { toast } from "sonner";

import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "../ui/shadcn/field";
import AddressSearch, { AddressData } from "../ui/addressSearch";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import { formatDateLocalized } from "@/lib/formatDate";
import Modal, { getButtonSize } from "../ui/modal";
import { Textarea } from "../ui/shadcn/textarea";
import { Checkbox } from "../ui/shadcn/checkbox";
import { formatMoney } from "@/lib/formatNumber";
import Confirmation from "../ui/confirmation";
import { UploadButton } from "../uploadthing";
import { useUser } from "@/lib/auth/client";
import { Input } from "../ui/shadcn/input";
import ButtonIcon from "../ui/buttonIcon";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Ribbon from "../ui/ribbon";
import { env } from "@/env";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/shadcn/input-group";

import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/shadcn/button";

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
  variant = "outline",
  buttonSize = "icon",
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
    startTransition(() => {
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
      buttonIcon={<Pencil />}
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
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export const DeleteEvent = ({
  clubId,
  eventId,
  variant = "destructive",
  buttonSize = "icon",
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
      buttonIcon={<Trash />}
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
  useEffect(() => {
    if (initialValues) form.reset(initialValues);
  }, [initialValues, form]);

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
                className="max-h-40 w-full object-cover"
              />
              <ButtonIcon
                iconComponent={<Trash className="text-destructive" />}
                title={t("event.delete-image")}
                size="icon"
                variant="outlines"
                onClick={handleDeleteImage}
                className="absolute right-2 bottom-2"
              />
            </div>
          ) : null}

          <FieldSet className="col-span-full">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="event-name" className="required">
                  {t("event.name")}
                </FieldLabel>
                <Input
                  id="event-name"
                  {...form.register("name", {
                    required: t("event.name-mandatory") ?? true,
                  })}
                />
                {form.formState.errors.name && (
                  <FieldError>{form.formState.errors.name.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="event-brief" className="required">
                  {t("event.brief")}
                </FieldLabel>
                <Textarea
                  id="event-brief"
                  {...form.register("brief", {
                    required: t("event.brief-mandatory") ?? true,
                  })}
                  rows={4}
                />
                {form.formState.errors?.brief?.message && (
                  <FieldError>{form.formState.errors.brief.message}</FieldError>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="event-description">
                  {t("event.description")}
                </FieldLabel>
                <Textarea
                  id="event-description"
                  {...form.register("description")}
                  rows={4}
                />
              </Field>
            </FieldGroup>
          </FieldSet>
        </div>
        <FieldSet>
          <FieldGroup>
            <Field orientation="horizontal" className="grid grid-cols-2">
              <FieldLabel htmlFor="event-start-date" className="required">
                {t("event.start-date")}
              </FieldLabel>

              <Input
                id="event-start-date"
                type="datetime-local"
                {...form.register("startDate", {
                  required: t("event.date-mandatory") ?? true,
                })}
              />
              {form.formState.errors?.startDate?.message && (
                <FieldError className="col-span-2">
                  {form.formState.errors.startDate.message}
                </FieldError>
              )}
            </Field>
            <Field orientation="horizontal" className="grid grid-cols-2">
              <FieldLabel htmlFor="event-end-date" className="required">
                {t("event.end-date")}
              </FieldLabel>
              <Input
                id="event-end-date"
                type="datetime-local"
                {...form.register("endDate", {
                  required: t("event.date-mandatory") ?? true,
                })}
              />
              {form.formState.errors?.endDate?.message && (
                <FieldError className="col-span-2">
                  {form.formState.errors.endDate.message}
                </FieldError>
              )}
            </Field>
            <Field orientation="horizontal" className="grid grid-cols-2">
              <FieldLabel htmlFor="event-start-display" className="required">
                {t("event.start-display")}
              </FieldLabel>
              <Input
                id="event-start-display"
                type="datetime-local"
                {...form.register("startDisplay", {
                  required: t("event.date-mandatory") ?? true,
                })}
              />
              {form.formState.errors?.startDisplay?.message && (
                <FieldError className="col-span-2">
                  {form.formState.errors.startDisplay.message}
                </FieldError>
              )}
            </Field>
            <Field orientation="horizontal" className="grid grid-cols-2">
              <FieldLabel htmlFor="event-end-display" className="required">
                {t("event.end-display")}
              </FieldLabel>
              <Input
                id="event-end-display"
                type="datetime-local"
                {...form.register("endDisplay", {
                  required: t("event.date-mandatory") ?? true,
                })}
              />
              {form.formState.errors?.endDisplay?.message && (
                <FieldError className="col-span-2">
                  {form.formState.errors.endDisplay.message}
                </FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="event-banner">
                {t("event.banner")}
              </FieldLabel>
              <Input id="event-banner" {...form.register("bannerText")} />
            </Field>
            <div className="grid grid-cols-2">
              <Field orientation="horizontal">
                <Checkbox
                  id="event-cancelled"
                  {...form.register("cancelled")}
                  defaultChecked={false}
                />
                <FieldLabel htmlFor="event-cancelled">
                  {t("event.cancelled")}
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="event-free"
                  {...form.register("free")}
                  defaultChecked={false}
                />
                <FieldLabel htmlFor="event-free">{t("event.free")}</FieldLabel>
              </Field>
            </div>
            {free ? null : (
              <Field orientation="horizontal">
                <FieldLabel htmlFor="event-price">
                  {t("event.price")}
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="event-price"
                    type="number"
                    {...form.register("price")}
                  />
                  <InputGroupAddon align="inline-end">€</InputGroupAddon>
                </InputGroup>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="event-address">
                {t("event.address")}
              </FieldLabel>
              <Input id="event-address" {...form.register("address")} />
            </Field>
            <Field>
              <FieldLabel>{t("event.location")}</FieldLabel>
              <AddressSearch
                defaultAddress={initialValues?.searchAddress ?? ""}
                iconSearch
                onSearch={(adr) => setAddress(adr)}
              />
            </Field>
          </FieldGroup>
        </FieldSet>
        <DisplayEventCard />
        <FieldSeparator />
        <Field orientation="horizontal" className="justify-end">
          <Button
            size="xl"
            type="button"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              form.reset();
              onCancel();
            }}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" size="xl">
            {tCommon("save")}
          </Button>
        </Field>
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
      className="relative col-span-full aspect-4/1 w-full rounded border border-primary p-2 text-center text-white"
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
            <ButtonIcon
              iconComponent={showMap ? <X /> : <Map />}
              title={t("event.view-map")}
              size="icon"
              variant="outlines"
              onClick={() => setShowMap((prev) => !prev)}
            />
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
              <MapPin className="text-secondary" />
            </Marker>
          </MapComponent>
        </div>
      </div>
    </div>
  );
}

export function ShowEventCard({ eventId }: { eventId: string }) {
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
  }, [event.data, form]);
  const t = useTranslations("club");

  return (
    <Modal
      title={t("event.show")}
      className="w-11/12 max-w-4xl"
      variant="default"
      buttonSize="icon"
      buttonIcon={<Eye />}
    >
      {event.isLoading ? (
        <Spinner />
      ) : event.data ? (
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
