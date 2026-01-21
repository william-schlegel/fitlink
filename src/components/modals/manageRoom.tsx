"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import {
  Controller,
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useFormContext,
} from "react-hook-form";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Spinner } from "@/components/ui/shadcn/spinner";
import { roomReservationEnum } from "@/db/schema/enums";
import createLink from "@/lib/createLink";
import { RESERVATIONS } from "@/lib/data";
import { trpc } from "@/lib/trpc/client";
import Confirmation from "../ui/confirmation";
import Modal from "../ui/modal";
import SimpleForm from "../ui/simpleform";

import { Pencil, Plus, Trash } from "lucide-react";

import {
  Checkbox,
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/shadcn";

import type { ButtonSize, ButtonVariant } from "@/components/ui/shadcn/button";

type RoomFormValues = {
  name: string;
  reservation: (typeof roomReservationEnum.enumValues)[number];
  capacity: number;
  unavailable: boolean;
};

type CreateRoomProps = {
  siteId?: string;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export const CreateRoom = ({
  siteId,
  variant = "outline",
  buttonSize = "icon",
}: CreateRoomProps) => {
  const t = useTranslations("club");
  const utils = trpc.useUtils();
  const router = useRouter();
  const createRoom = trpc.sites.createRoom.useMutation({
    onSuccess: (data) => {
      utils.sites.getRoomsForSite.invalidate(siteId);
      router.push(createLink({ roomId: data[0].id }));
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
        buttonIcon={<Plus />}
        variant={variant}
        buttonSize={buttonSize}
        size="sm"
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
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export const UpdateRoom = ({
  siteId,
  roomId,
  variant = "outline",
  buttonSize = "icon",
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
        buttonIcon={<Pencil />}
        variant={variant}
        buttonSize={buttonSize}
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
  variant = "destructive",
  buttonSize = "icon",
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
      buttonIcon={<Trash />}
      onConfirm={() => {
        deleteRoom.mutate(roomId);
      }}
      variant={variant}
      buttonSize={buttonSize}
    />
  );
};

function RoomForm() {
  const t = useTranslations("club");

  const {
    formState: { errors },
    register,
    getValues,
    control,
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
          label: t("room.reservation"),
          component: (
            <Controller
              control={control}
              name="reservation"
              render={({ field }) => (
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESERVATIONS.map((reservation) => (
                      <SelectItem
                        key={reservation.value}
                        value={reservation.value}
                      >
                        {t(reservation.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          ),
        },
        {
          name: "unavailable",
          component: (
            <Controller
              control={control}
              name="unavailable"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="unavailable">
                    {t("room.unavailable")}
                  </FieldLabel>
                </Field>
              )}
            />
          ),
        },
      ]}
    />
  );
}
