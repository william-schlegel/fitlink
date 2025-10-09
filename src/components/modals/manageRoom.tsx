"use client";

import {
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useFormContext,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { roomReservationEnum } from "@/db/schema/enums";
import Modal, { TModalVariant } from "../ui/modal";
import Confirmation from "../ui/confirmation";
import SimpleForm from "../ui/simpleform";
import { RESERVATIONS } from "@/lib/data";
import { trpc } from "@/lib/trpc/client";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";

type RoomFormValues = {
  name: string;
  reservation: (typeof roomReservationEnum.enumValues)[number];
  capacity: number;
  unavailable: boolean;
};

type CreateRoomProps = {
  siteId?: string;
  variant?: TModalVariant;
};

export const CreateRoom = ({
  siteId,
  variant = "Icon-Outlined-Primary",
}: CreateRoomProps) => {
  const t = useTranslations("club");
  const utils = trpc.useUtils();
  const createRoom = trpc.sites.createRoom.useMutation({
    onSuccess: () => {
      utils.sites.getRoomsForSite.invalidate(siteId);
      form.reset();
      toast.success(t("room.created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const form = useForm<RoomFormValues>();

  const onSubmit: SubmitHandler<RoomFormValues> = (data) => {
    if (siteId)
      createRoom.mutate({
        siteId,
        name: data.name,
        reservation: data.reservation,
        capacity: data.capacity,
        unavailable: false,
        openWithClub: true,
      });
  };

  const onError: SubmitErrorHandler<RoomFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <>
      <Modal
        title={t("room.new")}
        handleSubmit={form.handleSubmit(onSubmit, onError)}
        buttonIcon={<i className="bx bx-plus bx-sm" />}
        variant={variant}
      >
        <h3>{t("room.new")}</h3>
        <FormProvider {...form}>
          <RoomForm />
        </FormProvider>
      </Modal>
    </>
  );
};

type PropsUpdateDelete = {
  siteId: string;
  roomId: string;
  variant?: TModalVariant;
};

export const UpdateRoom = ({
  siteId,
  roomId,
  variant = "Icon-Outlined-Primary",
}: PropsUpdateDelete) => {
  const utils = trpc.useUtils();
  const queryRoom = trpc.sites.getRoomById.useQuery(roomId);
  const form = useForm<RoomFormValues>();

  useEffect(() => {
    if (queryRoom.data)
      form.reset({
        name: queryRoom.data.name,
        capacity: queryRoom.data.capacity,
        reservation: queryRoom.data.reservation ?? "NONE",
        unavailable: queryRoom.data.unavailable ?? false,
      });
  }, [queryRoom.data, form]);
  const updateRoom = trpc.sites.updateRoom.useMutation({
    onSuccess: () => {
      utils.sites.getRoomsForSite.invalidate(siteId);
      utils.sites.getRoomById.invalidate(roomId);
      form.reset();
      toast.success(t("room.updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const t = useTranslations("club");

  const onSubmit: SubmitHandler<RoomFormValues> = (data) => {
    if (siteId)
      updateRoom.mutate({
        id: roomId,
        ...data,
        capacity: data.capacity,
      });
  };

  const onError: SubmitErrorHandler<RoomFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <>
      <Modal
        title={t("room.update")}
        handleSubmit={form.handleSubmit(onSubmit, onError)}
        buttonIcon={<i className="bx bx-edit bx-sm" />}
        variant={variant}
      >
        <h3>{t("room.update")}</h3>
        {queryRoom.isLoading ? (
          <Spinner />
        ) : (
          <FormProvider {...form}>
            <RoomForm />
          </FormProvider>
        )}
      </Modal>
    </>
  );
};

export const DeleteRoom = ({
  roomId,
  siteId,
  variant = "Icon-Outlined-Secondary",
}: PropsUpdateDelete) => {
  const utils = trpc.useUtils();
  const t = useTranslations("club");

  const deleteRoom = trpc.sites.deleteRoom.useMutation({
    onSuccess: () => {
      utils.sites.getRoomsForSite.invalidate(siteId);
      toast.success(t("room.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("room.deletion-message")}
      title={t("room.deletion")}
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      onConfirm={() => {
        deleteRoom.mutate(roomId);
      }}
      variant={variant}
    />
  );
};

function RoomForm() {
  const t = useTranslations("club");

  const {
    formState: { errors },
    register,
    getValues,
  } = useFormContext<RoomFormValues>();
  return (
    <SimpleForm
      errors={errors}
      register={register}
      fields={[
        {
          label: t("room.name"),
          name: "name",
          required: t("name-mandatory"),
        },
        {
          label: t("room.capacity"),
          name: "capacity",
          type: "number",
        },
        {
          name: "reservation",
          component: (
            <select
              defaultValue={getValues("reservation")}
              {...register("reservation")}
            >
              {RESERVATIONS.map((reservation) => (
                <option key={reservation.value} value={reservation.value}>
                  {t(reservation.label)}
                </option>
              ))}
            </select>
          ),
        },
        {
          name: "unavailable",
          component: (
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox-primary checkbox"
                  {...register("unavailable")}
                  defaultChecked={false}
                />
                <span className="label-text">{t("room.unavailable")}</span>
              </label>
            </div>
          ),
        },
      ]}
    />
  );
}
