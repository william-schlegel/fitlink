import { useDebounceValue } from "usehooks-ts";
import { useTranslations } from "next-intl";

import { ChannelTypeEnum, ReactionTypeEnum } from "@/db/schema/enums";
import Confirmation from "@/components/ui/confirmation";
import ButtonIcon from "@/components/ui/buttonIcon";
import Spinner from "@/components/ui/spinner";
import Modal from "@/components/ui/modal";
import { toast } from "@/lib/toast";

import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { useEffect, useState } from "react";
import Image from "next/image";

import { UploadButton } from "../uploadthing";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";

type CreateGroupProps = {
  userId: string;
};

export function CreateGroup({ userId }: CreateGroupProps) {
  const t = useTranslations("message");
  const [closeModal, setCloseModal] = useState(false);
  const utils = trpc.useUtils();
  const createGroup = trpc.chat.createChannel.useMutation({
    onSuccess() {
      utils.chat.getChannelsForUser.invalidate({ userId });
      toast.success(t("group-created"));
    },
  });

  const onSubmit = async (data: GroupFormValues) => {
    createGroup.mutate({
      name: data.name,
      createdByUserId: userId,
      type: "GROUP",
      imageUrls: data.groupImageUrl ? [data.groupImageUrl] : undefined,
      users: data.users.filter((u) => Boolean(u.id)).map((u) => u.id!),
    });
    setCloseModal(true);
  };

  return (
    <Modal
      title={t("new-group")}
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
      variant="Primary"
      className="overflow-visible"
    >
      <GroupForm onSubmit={onSubmit} onCancel={() => setCloseModal(true)} />
    </Modal>
  );
}

type UserForGroup = {
  id?: string;
  name?: string | null;
};

type GroupUserProps = {
  users: UserForGroup[];
  setUsers: (users: UserForGroup[]) => void;
};

function GroupUser({ users, setUsers }: GroupUserProps) {
  const t = useTranslations("message");
  const [searchUser, setSearchUser] = useState<string>("");
  const [userList, setUserList] = useState<UserForGroup[]>([]);
  const [nbUser] = useState(0);
  const [debouncedUser] = useDebounceValue<string>(searchUser, 500);
  const getUsers = trpc.users.getAllUsers.useQuery(
    {
      filter: {
        name: searchUser,
      },
      skip: 0,
      take: 10,
    },
    {
      enabled: debouncedUser !== "",
      // onSuccess(data) {
      //   setNbUser(data[0]);
      //   setUserList(data[1] ?? []);
      // },
    },
  );

  function deleteUser(id: string | undefined) {
    if (!id) return;
    setUsers(users.filter((u) => u.id !== id));
  }

  function addUser(user: UserForGroup) {
    users.push(user);
    setUsers([...users]);
    setUserList([]);
  }

  return (
    <>
      <div className="dropdown-bottom dropdown w-full">
        <div className="input-group">
          <span>{t("group-users")}</span>
          <input
            className="input-bordered input w-full"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
          />
        </div>
        {userList.length > 0 ? (
          <ul className="dropdown-content menu rounded-box z-20 w-full bg-base-100 p-2 shadow">
            {getUsers.isLoading ? <Spinner /> : null}
            {userList.map((user) => (
              <li key={user.id}>
                <button
                  className=""
                  onClick={() => addUser(user)}
                  type="button"
                >
                  {user.name}
                </button>
              </li>
            ))}
            {nbUser > userList.length ? (
              <div>{t("and-n-more", { count: nbUser - userList.length })}</div>
            ) : (
              ""
            )}
          </ul>
        ) : null}
      </div>
      <div className="flex w-full flex-wrap gap-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-1 text-primary-content"
          >
            <span>{user.name}</span>
            <button type="button" onClick={() => deleteUser(user.id)}>
              <div className="tooltip" data-tip={t("delete-user")}>
                <i className="bx bx-trash bx-xs text-red-500" />
              </div>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

type UpdateGroupProps = {
  userId: string;
  groupId: string;
};

export const UpdateGroup = ({ userId, groupId }: UpdateGroupProps) => {
  const utils = trpc.useUtils();
  const t = useTranslations("message");
  const [initialData, setInitialData] = useState<GroupFormValues | undefined>();
  const [closeModal, setCloseModal] = useState(false);
  const queryGroup = trpc.chat.getChannelById.useQuery(
    {
      channelId: groupId,
    },
    {
      // onSuccess(data) {
      //   if (data)
      //     setInitialData({
      //       name: data?.name ?? "",
      //       users: data.users,
      //       deleteImage: false,
      //     });
      // },
      enabled: isCUID(groupId),
    },
  );
  const updateGroup = trpc.chat.updateChannel.useMutation({
    onSuccess: () => {
      utils.chat.getChannelsForUser.invalidate({ userId });
      toast.success(t("group-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit = async (data: GroupFormValues) => {
    updateGroup.mutate({
      id: groupId,
      name: data.name,
      imageUrls: data.groupImageUrl ? [data.groupImageUrl] : undefined,
    });
    setInitialData(undefined);
    setCloseModal(true);
  };

  return (
    <Modal
      title={t("update-group")}
      buttonIcon={<i className="bx bx-edit bx-sm" />}
      variant={"Icon-Outlined-Primary"}
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
    >
      <h3>
        {t("update-group")} {queryGroup.data?.name}
      </h3>
      {initialData ? (
        <GroupForm
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

type GroupFormProps = {
  onSubmit: (data: GroupFormValues) => void;
  onCancel: () => void;
  update?: boolean;
  initialData?: GroupFormValues;
};

type GroupFormValues = {
  name: string;
  groupImageUrl?: string;
  users: UserForGroup[];
  deleteImage: boolean;
};

function GroupForm({
  onSubmit,
  onCancel,
  update,
  initialData,
}: GroupFormProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("message");
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm<GroupFormValues>();
  const fields = useWatch({ control });

  useEffect(() => {
    reset(initialData);
  }, [initialData, reset]);

  const handleDeleteImage = () => {
    setValue("deleteImage", true);
    setValue("groupImageUrl", undefined);
  };

  const onSubmitForm: SubmitHandler<GroupFormValues> = (data) => {
    onSubmit(data);
    reset();
  };

  const onError: SubmitErrorHandler<GroupFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm, onError)}>
      <label className="required w-fit">{t("group-name")}</label>
      <div>
        <input
          {...register("name", {
            required: t("name-mandatory") ?? true,
          })}
          type={"text"}
          className="input-bordered input w-full"
        />
        {errors.name ? (
          <p className="text-sm text-error">{errors.name.message}</p>
        ) : null}
      </div>
      <div className="col-span-2 flex flex-col items-center justify-start gap-4">
        <div className="w-full ">
          <UploadButton
            endpoint="imageAttachment"
            onClientUploadComplete={(result) =>
              setValue("groupImageUrl", result[0].ufsUrl)
            }
            className="col-span-2"
            buttonText={t("image")}
          />
        </div>
        {fields.groupImageUrl ? (
          <div className="flex items-center gap-4">
            <Image
              src={fields.groupImageUrl}
              alt=""
              className="aspect-square w-32 rounded-full"
            />
            <button onClick={handleDeleteImage}>
              <ButtonIcon
                iconComponent={<i className="bx bx-trash" />}
                title={t("delete-groupImage")}
                buttonVariant="Icon-Secondary"
                buttonSize="sm"
              />
            </button>
          </div>
        ) : null}
        {update ? null : (
          <GroupUser
            users={fields.users ?? []}
            setUsers={(users) => setValue("users", users)}
          />
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="btn-outline btn-secondary btn"
            onClick={(e) => {
              e.preventDefault();
              onCancel();
            }}
          >
            {tCommon("cancel")}
          </button>
          <button className="btn-primary btn">{tCommon("save")}</button>
        </div>
      </div>
    </form>
  );
}

export const DeleteGroup = ({ userId, groupId }: UpdateGroupProps) => {
  const utils = trpc.useUtils();
  const t = useTranslations("message");

  const deleteGroup = trpc.chat.deleteChannel.useMutation({
    onSuccess: () => {
      utils.chat.getChannelsForUser.invalidate({ userId });
      toast.success(t("group-deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("deletion-message")}
      title={t("group-deletion")}
      onConfirm={() => {
        deleteGroup.mutate({ id: groupId });
      }}
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      variant={"Icon-Outlined-Secondary"}
    />
  );
};

const CHANNEL_TYPE: readonly {
  value: ChannelTypeEnum;
  label: string;
}[] = [
  { value: "CLUB", label: "channel.club" },
  { value: "COACH", label: "channel.coach" },
  { value: "GROUP", label: "channel.group" },
  { value: "PRIVATE", label: "channel.private" },
] as const;

export const REACTIONS: readonly {
  value: ReactionTypeEnum;
  label: string;
}[] = [
  { value: "LIKE", label: "👍" },
  { value: "LOVE", label: "❤" },
  { value: "LOL", label: "😂" },
  { value: "SAD", label: "😥" },
  { value: "GRRR", label: "😡" },
  { value: "WOAH", label: "😯" },
  { value: "CHECK", label: "🙏" },
  { value: "STRENGTH", label: "💪" },
  { value: "FIST", label: "👊" },
] as const;

export function useChannel() {
  const t = useTranslations("message");
  function getChannelName(type: ChannelTypeEnum) {
    const ct = CHANNEL_TYPE.find((ct) => ct.value === type);
    if (ct) return t(ct.label);
    return "?";
  }

  function getReaction(reaction: ReactionTypeEnum) {
    const r = REACTIONS.find((r) => r.value === reaction);
    if (r) return r.label;
    return "❓";
  }

  return { getChannelName, getReaction };
}
