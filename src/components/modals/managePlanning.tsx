"use client";

import {
  SubmitErrorHandler,
  SubmitHandler,
  Controller,
  useForm,
  useWatch,
} from "react-hook-form";
import { startTransition, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { isDate } from "date-fns";

import { useRouter } from "next/navigation";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "../ui/shadcn/field";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import { Checkbox } from "../ui/shadcn/checkbox";
import Confirmation from "../ui/confirmation";
import { useUser } from "@/lib/auth/client";
import { Input } from "../ui/shadcn/input";
import createLink from "@/lib/createLink";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";
import Modal from "../ui/modal";

import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/shadcn";

import { Copy, Pencil, Trash } from "lucide-react";

import type { ButtonSize, ButtonVariant } from "@/components/ui/shadcn/button";

type CreatePlanningProps = {
  clubId: string;
  variant?: ButtonVariant;
};

type CreatePlanningFormValues = {
  name: string;
  startDate: Date;
  endDate: Date;
  forSite: boolean;
  siteId: string;
  forRoom: boolean;
  roomId: string;
};

export const CreatePlanning = ({
  clubId,
  variant = "default",
}: CreatePlanningProps) => {
  const utils = trpc.useUtils();
  const t = useTranslations("planning");
  const { data: user } = useUser();
  const router = useRouter();
  const userId = user?.id ?? "";
  const createPlanning = trpc.plannings.createPlanningForClub.useMutation({
    onSuccess: (data) => {
      utils.plannings.getPlanningsForClub.invalidate(clubId);
      toast.success(t("planning-created"));
      router.push(createLink({ clubId, planningId: data[0].id }));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const queryClub = trpc.clubs.getClubById.useQuery(
    { clubId, userId },
    {
      enabled: isCUID(clubId),
    },
  );
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<CreatePlanningFormValues>({
    defaultValues: {
      forSite: false,
      forRoom: false,
    },
  });

  const forSite = useWatch({ control, name: "forSite" });
  const siteId = useWatch({ control, name: "siteId" });
  const forRoom = useWatch({ control, name: "forRoom" });

  const onSubmit: SubmitHandler<CreatePlanningFormValues> = (data) => {
    createPlanning.mutate({
      clubId,
      name: data.name ? data.name : undefined,
      startDate: data.startDate,
      endDate: isDate(data.endDate) ? data.endDate : undefined,
      siteId: data.forSite && data.siteId ? data.siteId : undefined,
      roomId:
        data.forSite && data.siteId && data.forRoom && data.roomId
          ? data.roomId
          : undefined,
    });
  };

  const onError: SubmitErrorHandler<CreatePlanningFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <Modal
      title={t("create-new-planning")}
      variant={variant}
      handleSubmit={handleSubmit(onSubmit, onError)}
    >
      <h3>{t("create-new-planning")}</h3>
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="planning-name">{t("name")}</FieldLabel>
              <Input id="planning-name" {...register("name")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="planning-start-date" className="required">
                {t("start-date")}
              </FieldLabel>
              <Input
                id="planning-start-date"
                {...register("startDate", {
                  valueAsDate: true,
                  required: t("date-mandatory") ?? true,
                })}
                type="date"
                defaultValue={formatDateAsYYYYMMDD()}
              />
              {errors.startDate && (
                <FieldError>{t("date-mandatory")}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="planning-end-date">
                {t("end-date")}
              </FieldLabel>
              <Input
                id="planning-end-date"
                {...register("endDate", { valueAsDate: true })}
                type="date"
              />
            </Field>
            <Field orientation="horizontal">
              <Controller
                control={control}
                name="forSite"
                render={({ field }) => (
                  <Checkbox
                    id="planning-for-site"
                    className="checkbox-primary checkbox"
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                )}
              />
              <FieldLabel htmlFor="planning-for-site">
                {t("for-site")}
              </FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
        {forSite ? (
          <>
            <Field orientation="horizontal">
              <FieldLabel htmlFor="planning-site">{t("site")}</FieldLabel>
              <Controller
                control={control}
                name="siteId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {queryClub.data?.sites?.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field orientation="horizontal">
              <Controller
                control={control}
                name="forRoom"
                render={({ field }) => (
                  <Checkbox
                    id="planning-for-room"
                    className="checkbox-primary checkbox"
                    checked={Boolean(field.value)}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                )}
              />
              <FieldLabel htmlFor="planning-for-room">
                {t("for-room")}
              </FieldLabel>
            </Field>
            {forRoom && siteId ? (
              <Field orientation="horizontal">
                <FieldLabel htmlFor="planning-room">{t("room")}</FieldLabel>
                <Controller
                  control={control}
                  name="roomId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {queryClub.data?.sites
                          ?.find((s) => s.id === siteId)
                          ?.rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            ) : null}
          </>
        ) : null}
      </form>
    </Modal>
  );
};

type UpdatePlanningProps = {
  clubId: string;
  planningId: string;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
  duplicate?: boolean;
};

type UpdatePlanningFormValues = {
  name: string | null;
  startDate: Date;
  endDate?: Date | null;
  siteId?: string | null;
  roomId?: string | null;
};

export function UpdatePlanning({
  clubId,
  planningId,
  variant = "outline",
  buttonSize = "icon",
  duplicate = false,
}: UpdatePlanningProps) {
  const [siteName, setSiteName] = useState("");
  const [roomName, setRoomName] = useState("");
  const utils = trpc.useUtils();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdatePlanningFormValues>();

  const queryPlanning = trpc.plannings.getPlanningById.useQuery(planningId, {
    enabled: isCUID(planningId),
  });

  useEffect(() => {
    reset({
      name: queryPlanning.data?.name,
      startDate: queryPlanning.data?.startDate ?? new Date(Date.now()),
      endDate: queryPlanning.data?.endDate,
      siteId: queryPlanning.data?.siteId,
      roomId: queryPlanning.data?.roomId,
    });
    startTransition(() => {
      setSiteName(queryPlanning.data?.site?.name ?? "");
      setRoomName(queryPlanning.data?.room?.name ?? "");
    });
  }, [queryPlanning.data, reset]);

  const updatePlanning = trpc.plannings.updatePlanningForClub.useMutation({
    onSuccess: () => {
      utils.plannings.getPlanningsForClub.invalidate(clubId);
      toast.success(t("planning-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const duplicatePlanning = trpc.plannings.duplicatePlanningForClub.useMutation(
    {
      onSuccess: () => {
        utils.plannings.getPlanningsForClub.invalidate(clubId);
        toast.success(t("planning-created"));
      },
      onError(error) {
        toast.error(error.message);
      },
    },
  );

  const t = useTranslations("planning");

  const onSubmit: SubmitHandler<UpdatePlanningFormValues> = (data) => {
    if (duplicate) {
      duplicatePlanning.mutate({
        id: planningId,
        name: data.name ? data.name : undefined,
        startDate: data.startDate,
        endDate:
          data.endDate && isDate(data.endDate) ? data.endDate : undefined,
      });
    } else {
      updatePlanning.mutate({
        name: data.name ? data.name : undefined,
        startDate: data.startDate,
        endDate:
          data.endDate && isDate(data.endDate) ? data.endDate : undefined,
      });
    }
  };

  const onError: SubmitErrorHandler<UpdatePlanningFormValues> = (errors) => {
    console.error("errors", errors);
  };

  if (queryPlanning.isLoading) return <Spinner />;
  return (
    <Modal
      title={t(duplicate ? "duplicate-planning" : "update-planning")}
      buttonIcon={duplicate ? <Copy /> : <Pencil />}
      handleSubmit={handleSubmit(onSubmit, onError)}
      variant={variant}
      buttonSize={buttonSize}
    >
      <h3 className="flex gap-2">
        {t(duplicate ? "duplicate-planning" : "update-planning")}
      </h3>
      {siteName ? (
        <div className="mb-2 flex gap-2">
          <Badge>
            <span>{t("site")}:</span>
            <span>{siteName}</span>
          </Badge>
          {roomName ? (
            <Badge>
              <span>{t("room")}:</span>
              <span>{roomName}</span>
            </Badge>
          ) : null}
        </div>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="update-planning-name">
                {t("name")}
              </FieldLabel>
              <Input id="update-planning-name" {...register("name")} />
            </Field>
            <Field>
              <FieldLabel
                htmlFor="update-planning-start-date"
                className="required"
              >
                {t("start-date")}
              </FieldLabel>
              <Input
                id="update-planning-start-date"
                {...register("startDate", {
                  valueAsDate: true,
                  required: t("date-mandatory") ?? true,
                })}
                type="date"
                defaultValue={formatDateAsYYYYMMDD()}
              />
              {errors.startDate && (
                <FieldError>{t("date-mandatory")}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="update-planning-end-date">
                {t("end-date")}
              </FieldLabel>
              <Input
                id="update-planning-end-date"
                {...register("endDate", { valueAsDate: true })}
                type="date"
              />
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </Modal>
  );
}

export function DeletePlanning({
  clubId,
  planningId,
  variant = "destructive",
  buttonSize = "icon",
}: UpdatePlanningProps) {
  const utils = trpc.useUtils();
  const t = useTranslations("planning");

  const deletePlanning = trpc.plannings.deletePlanning.useMutation({
    onSuccess: () => {
      utils.plannings.getPlanningsForClub.invalidate(clubId);
      toast.success(t("planning-deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("planning-deletion-message")}
      title={t("planning-deletion")}
      onConfirm={() => {
        deletePlanning.mutate(planningId);
      }}
      buttonIcon={<Trash />}
      variant={variant}
      buttonSize={buttonSize}
    />
  );
}
