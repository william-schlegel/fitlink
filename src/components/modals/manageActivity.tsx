"use client";

import { useTranslations } from "next-intl";
import { startTransition, useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";

import { useRouter } from "next/navigation";

import { CalendarX, Pencil, Plus, Trash } from "lucide-react";

import { toast } from "sonner";

import { Spinner } from "@/components/ui/shadcn/spinner";
import createLink from "@/lib/createLink";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Confirmation from "../ui/confirmation";
import Modal from "../ui/modal";
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
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/shadcn/button";
import { Separator } from "@/components/ui/shadcn/separator";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/shadcn/input-group";

type AddActivityProps = {
  userId: string;
  clubId: string;
  withAdd?: boolean;
  withUpdate?: boolean;
  onSuccess: () => void;
};

const AddActivity = ({
  userId,
  clubId,
  onSuccess,
  withAdd = false,
  withUpdate = false,
}: AddActivityProps) => {
  const [groupId, setGroupId] = useState("");
  const queryGroups = trpc.activities.getActivityGroupsForUser.useQuery(
    userId,
    { enabled: Boolean(userId) },
  );

  useEffect(() => {
    if (groupId === "" && queryGroups?.data && queryGroups.data.length > 0) {
      startTransition(() => {
        setGroupId(queryGroups.data[0].id || "");
      });
    }
  }, [queryGroups.data, groupId]);

  const queryClubActivities = trpc.activities.getActivitiesForClub.useQuery(
    {
      clubId,
      userId,
    },
    {
      enabled: isCUID(clubId) && Boolean(userId),
    },
  );
  const updateClubActivities = trpc.clubs.updateClubActivities.useMutation({
    onSuccess() {
      onSuccess();
    },
  });
  const t = useTranslations("club");

  const onSubmit = () => {
    updateClubActivities.mutate({
      id: clubId,
      activities: queryClubActivities.data?.activities.map((a) => a.id) || [],
    });
  };

  return (
    <Modal
      title={t("activity.select-activities")}
      handleSubmit={onSubmit}
      submitButtonText={t("activity.save-activity")}
      buttonIcon={<Plus />}
    >
      <h3>{t("activity.select-club-activities")}</h3>
      <div className="flex gap-4">
        <aside className="space-y-4">
          <h4>{t("group.group")}</h4>
          <div className="flex max-h-[70vh] flex-col flex-wrap rounded border border-border bg-card p-1">
            {queryGroups.data?.map((group) => (
              <div key={group.id} className="flex items-center gap-2">
                <Button
                  asChild
                  onClick={() => setGroupId(group.id)}
                  className="w-full flex-1"
                  variant={groupId === group.id ? "default" : "outline"}
                  size="xl"
                >
                  <span>{group.name}</span>
                </Button>
                {withUpdate && !group.default && (
                  <>
                    <UpdateGroup groupId={group.id} userId={userId} />
                    <DeleteGroup groupId={group.id} userId={userId} />
                  </>
                )}
              </div>
            ))}
          </div>
          {withAdd ? <NewGroup userId={userId} /> : null}
        </aside>
        <div className="flex-1 space-y-4">
          <h4>{t("activity.activities")}</h4>
          <div className="flex flex-wrap gap-2">
            {queryClubActivities.data?.activities
              .filter((a) => a.groupId === groupId)
              .map((activity) => (
                <div key={activity.id} className="flex items-center gap-2">
                  <span className="flex items-center gap-2 rounded-full border border-primary px-4 py-2 text-primary-content">
                    <span>{activity.name}</span>
                    {activity.noCalendar ? (
                      <CalendarX className="text-accent" size={12} />
                    ) : null}
                    {withUpdate && (
                      <>
                        <UpdateActivity
                          clubId={clubId}
                          groupId={groupId}
                          id={activity.id}
                        />
                        <DeleteActivity
                          clubId={clubId}
                          activityId={activity.id}
                        />
                      </>
                    )}
                  </span>
                </div>
              ))}
          </div>
          {withAdd ? <NewActivity clubId={clubId} groupId={groupId} /> : null}
        </div>
      </div>
    </Modal>
  );
};

export default AddActivity;

type NewActivityProps = {
  clubId: string;
  groupId: string;
};

type ActivityFormValues = {
  name: string;
  noCalendar: boolean;
  reservationDuration: number;
};

type ActivityFormProps = {
  onSubmit: (data: ActivityFormValues) => void;
  initialValues?: ActivityFormValues;
  onCancel: () => void;
};

function ActivityForm({
  onSubmit,
  initialValues,
  onCancel,
}: ActivityFormProps) {
  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
    reset,
  } = useForm<ActivityFormValues>();
  const noCalendar = useWatch({ control, name: "noCalendar" });
  const t = useTranslations();

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const onSuccess: SubmitHandler<ActivityFormValues> = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSuccess)}>
      <FieldSet>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="activity-name">
              {t("club.activity.name")}
            </FieldLabel>
            <Input
              id="activity-name"
              {...register("name", {
                required: t("club.name-mandatory") ?? true,
              })}
            />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>
          <Field orientation="horizontal">
            <Controller
              control={control}
              name="noCalendar"
              render={({ field }) => (
                <>
                  <Checkbox
                    id="activity-no-calendar"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(Boolean(checked))
                    }
                  />
                  <FieldLabel
                    htmlFor="activity-no-calendar"
                    className="font-normal"
                  >
                    {t("club.activity.no-calendar")}
                  </FieldLabel>
                </>
              )}
            />
          </Field>
          {!noCalendar ? (
            <Field>
              <FieldLabel htmlFor="activity-duration">
                {t("club.activity.duration")}
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="activity-duration"
                  type="number"
                  {...register("reservationDuration", { valueAsNumber: true })}
                  className="w-auto flex-1"
                />
                <InputGroupAddon align="inline-end">
                  {" "}
                  {t("club.activity.minutes")}
                </InputGroupAddon>
              </InputGroup>
            </Field>
          ) : null}
        </FieldGroup>
      </FieldSet>
      <Separator className="my-4" />
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            reset();
            onCancel();
          }}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit">{t("common.save")}</Button>
      </div>
    </form>
  );
}

const NewActivity = ({ clubId, groupId }: NewActivityProps) => {
  const utils = trpc.useUtils();
  const groupQuery = trpc.activities.getActivityGroupById.useQuery(groupId, {
    enabled: isCUID(groupId),
  });
  const [close, setClose] = useState(false);
  const createActivity = trpc.activities.createActivity.useMutation({
    onSuccess: () => {
      utils.activities.getActivitiesForClub.invalidate();
      toast.success(t("activity.created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const t = useTranslations("club");

  function handleSubmit(data: ActivityFormValues) {
    createActivity.mutate({ clubId, groupId, ...data });
    setClose(true);
  }

  return (
    <Modal
      title={t("activity.new")}
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      size="sm"
    >
      <h3>
        <span>{t("activity.create-group")}</span>
        <span className="text-primary">{groupQuery.data?.name}</span>
      </h3>
      <ActivityForm
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
      />
    </Modal>
  );
};

type UpdateActivityProps = {
  clubId: string;
  groupId: string;
  id: string;
};

function UpdateActivity({ clubId, groupId, id }: UpdateActivityProps) {
  const [close, setClose] = useState(false);
  const utils = trpc.useContext();
  const queryActivity = trpc.activities.getActivityById.useQuery(id, {
    enabled: isCUID(id),
  });
  const updateActivity = trpc.activities.updateActivity.useMutation({
    onSuccess: () => {
      utils.activities.getActivitiesForClub.invalidate();
      toast.success(t("activity.updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const t = useTranslations("club");

  function handleSubmit(data: ActivityFormValues) {
    updateActivity.mutate({
      id,
      clubId,
      groupId,
      ...data,
    });
    setClose(true);
  }

  return (
    <Modal
      title={t("activity.update")}
      buttonIcon={<Pencil />}
      variant="ghost"
      buttonSize="icon"
      onCloseModal={() => setClose(false)}
      closeModal={close}
      cancelButtonText=""
      size="sm"
    >
      <h3>
        <span>{t("activity.update")}</span>
        <span className="text-primary">{queryActivity.data?.name}</span>
      </h3>
      <ActivityForm
        initialValues={{
          name: queryActivity.data?.name ?? "",
          noCalendar: !!queryActivity.data?.noCalendar,
          reservationDuration: queryActivity.data?.reservationDuration ?? 0,
        }}
        onSubmit={(data) => handleSubmit(data)}
        onCancel={() => setClose(true)}
      />
    </Modal>
  );
}

type DeleteActivityProps = {
  clubId: string;
  activityId: string;
};

function DeleteActivity({ clubId, activityId }: DeleteActivityProps) {
  const utils = trpc.useContext();
  const deleteActivity = trpc.activities.deleteActivity.useMutation({
    onSuccess: () => {
      utils.activities.getActivitiesForClub.invalidate();
      toast.success(t("activity.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const t = useTranslations("club");

  return (
    <Confirmation
      title={t("activity.deletion")}
      message={t("activity.deletion-message")}
      onConfirm={() => deleteActivity.mutate({ clubId, activityId })}
      buttonIcon={<Trash className="stroke-destructive" />}
      variant="ghost"
      textConfirmation={t("activity.deletion-confirmation")}
      buttonSize="icon"
    />
  );
}

type NewGroupProps = {
  userId?: string;
  variant?: ButtonVariant;
};

export const NewGroup = ({ userId, variant = "default" }: NewGroupProps) => {
  const utils = trpc.useUtils();
  const router = useRouter();
  const createGroup = trpc.activities.createGroup.useMutation({
    onSuccess: (data) => {
      if (userId) utils.activities.getActivityGroupsForUser.invalidate(userId);
      else utils.activities.getAllActivityGroups.invalidate();
      toast.success(t("group.created"));
      router.push(createLink({ agId: data[0].id }));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const t = useTranslations("club");

  function addNewGroup() {
    if (name === "") {
      setError(true);
      return;
    }
    setError(false);
    createGroup.mutate({
      name,
      userId,
      default: userId ? false : true,
    });
  }

  return (
    <Modal
      title={t("group.new")}
      variant={variant}
      handleSubmit={addNewGroup}
      size="sm"
    >
      <h3>{t("group.create-group")}</h3>
      <Field>
        <FieldLabel htmlFor="group-name">
          {t("club.activity-group.name")}
        </FieldLabel>
        <Input
          id="group-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Field>
      {error && <FieldError>{t("name-mandatory")}</FieldError>}
    </Modal>
  );
};

type UpdateGroupProps = {
  userId?: string;
  groupId: string;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export function UpdateGroup({
  userId,
  groupId,
  variant = "outline",
  buttonSize = "icon",
}: UpdateGroupProps) {
  const utils = trpc.useContext();
  const groupQuery = trpc.activities.getActivityGroupById.useQuery(groupId, {
    enabled: isCUID(groupId),
  });
  const [name, setName] = useState("");
  const [defaultGroup, setDefaultGroup] = useState(false);
  const [error, setError] = useState(false);
  const t = useTranslations("club");

  useEffect(() => {
    if (!groupQuery.data) return;
    const data = groupQuery.data;
    startTransition(() => {
      setName(data.name ?? "");
      setDefaultGroup(data.default ?? false);
    });
  }, [groupQuery.data]);

  const updateGroup = trpc.activities.updateGroup.useMutation({
    onSuccess: () => {
      if (userId) utils.activities.getActivityGroupsForUser.invalidate(userId);
      else utils.activities.getAllActivityGroups.invalidate();
      toast.success(t("group.updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  function update() {
    if (name === "") {
      setError(true);
      return;
    }
    setError(false);
    updateGroup.mutate({
      id: groupId,
      name,
      default: userId ? false : (defaultGroup ?? false),
    });
  }

  return (
    <Modal
      title={t("group.update")}
      handleSubmit={update}
      buttonIcon={<Pencil />}
      variant={variant}
      buttonSize={buttonSize}
      size="sm"
    >
      <h3>
        {t("group.update")}&nbsp;
        <span className="text-accent-foreground">{groupQuery.data?.name}</span>
      </h3>
      {groupQuery.isLoading ? (
        <Spinner />
      ) : (
        <>
          <Field>
            <FieldLabel htmlFor="update-group-name">
              {t("club.activity-group.name")}
            </FieldLabel>
            <Input
              id="update-group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {error && <FieldError>{t("name-mandatory")}</FieldError>}
          </Field>
          {userId ? null : (
            <Field orientation="horizontal">
              <Checkbox
                checked={defaultGroup}
                onCheckedChange={(checked) => setDefaultGroup(Boolean(checked))}
                disabled={!groupQuery.data?.coachUserId}
              />
              <FieldLabel>{t("group.default")}</FieldLabel>
            </Field>
          )}
        </>
      )}
    </Modal>
  );
}

type DeleteGroupProps = {
  userId?: string;
  groupId: string;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export function DeleteGroup({
  groupId,
  userId,
  buttonSize = "icon",
  variant = "destructive",
}: DeleteGroupProps) {
  const utils = trpc.useUtils();
  const deleteGroup = trpc.activities.deleteGroup.useMutation({
    onSuccess: () => {
      if (userId) utils.activities.getActivityGroupsForUser.invalidate(userId);
      else utils.activities.getAllActivityGroups.invalidate();
      toast.success(t("group.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const t = useTranslations("club");

  return (
    <Confirmation
      title={t("group.deletion")}
      message={t("group.deletion-message")}
      onConfirm={() => deleteGroup.mutate({ groupId })}
      buttonIcon={<Trash />}
      variant={variant}
      textConfirmation={t("group.deletion-confirmation")}
      buttonSize={buttonSize}
    />
  );
}
