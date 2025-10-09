"use client";

import {
  FormProvider,
  SubmitHandler,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Image from "next/image";

import { getUserById } from "@/server/api/routers/users";
import ButtonIcon from "@/components/ui/buttonIcon";
import { formatSize } from "@/lib/formatNumber";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/lib/toast";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  image?: FileList;
  imageUrl?: string;
  deleteImage: boolean;
};
const MAX_SIZE_IMAGE = 512 * 1024;

export default function FormProfile({
  userData,
}: {
  userData: NonNullable<Awaited<ReturnType<typeof getUserById>>>;
}) {
  const form = useForm<FormValues>();
  const t = useTranslations("auth");

  const utils = trpc.useUtils();
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess() {
      utils.users.getUserById.invalidate({ id: userData.id });
      toast.success(t("user-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  // const saveImage = useWriteFileDirect(userData.id, MAX_SIZE_IMAGE);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // let imageId: string | undefined = undefined;
    // if (data.image?.[0])
    //   imageId = (await saveImage(data.image[0])) ?? undefined;
    updateUser.mutate({
      id: userData.id!,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      // profileImageId: imageId,
    });
    form.reset();
  };

  return (
    <FormProvider {...form}>
      <form
        className={`flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:items-start`}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <section className={`grid grid-cols-[auto_1fr] gap-2`}>
          <label>{t("profile.change-name")}</label>
          <div>
            <input
              {...form.register("name", {
                required: t("profile.name-mandatory") ?? true,
              })}
              type={"text"}
              className="input-bordered input w-full"
            />
            {form.formState.errors.name ? (
              <p className="text-sm text-error">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>
          <label>{t("profile.my-email")}</label>
          <input
            {...form.register("email")}
            type={"email"}
            className="input-bordered input w-full"
          />
          <label>{t("profile.phone")}</label>
          <input
            {...form.register("phone")}
            type="tel"
            className="input-bordered input w-full"
          />
          <label className="place-self-start">{t("profile.address")}</label>
          <textarea {...form.register("address")} rows={2} />
          <label>{t("profile.account-provider")}</label>
          <div className="flex gap-2">
            {!userData?.accounts?.length ? (
              <span className="rounded border border-primary px-4 py-2">
                email
              </span>
            ) : (
              userData.accounts?.map((account) => (
                <span
                  key={account.id}
                  className="rounded border border-primary px-4 py-2"
                >
                  {account.provider}
                </span>
              ))
            )}
          </div>
        </section>
        <ProfileImage imageUrl={userData.profileImageUrl} />
        <button
          className="btn-primary btn col-span-2 w-fit"
          disabled={updateUser.isPending}
        >
          {t("profile.save-profile")}
        </button>
      </form>
    </FormProvider>
  );
}

function ProfileImage({ imageUrl }: { imageUrl: string | null }) {
  const [imagePreview, setImagePreview] = useState(imageUrl);
  const { register, control, setValue } = useFormContext();
  const t = useTranslations("auth");

  const fields = useWatch({ control: control });
  useEffect(() => {
    if (fields.image?.[0]) {
      if (fields.image[0].size > MAX_SIZE_IMAGE) {
        toast.error(
          t("image-size-error", { size: formatSize(MAX_SIZE_IMAGE) }),
        );
        setValue("image", undefined);
        return;
      }

      const src = URL.createObjectURL(fields.image[0]);
      setImagePreview(src);
    }
  }, [fields.image, t, setValue]);

  const handleDeleteImage = () => {
    setImagePreview("");
    setValue("deleteImage", true);
    setValue("image", undefined);
  };

  return (
    <section>
      <div className="col-span-2 flex flex-col items-center justify-start gap-4">
        <div className="w-full ">
          <label>{t("profile.profile-image")}</label>
          <input
            type="file"
            className="file-input-bordered file-input-primary file-input w-full"
            {...register("image")}
            accept="image/*"
          />
          <p className="col-span-2 text-sm text-gray-500">
            {t("image-size", { size: formatSize(MAX_SIZE_IMAGE) })}
          </p>
        </div>
        {imagePreview ? (
          <div className="relative w-60 max-w-full">
            <Image
              src={imagePreview}
              alt="profile image"
              className="aspect-square rounded-full object-cover"
              width={100}
              height={100}
            />
            <button
              onClick={handleDeleteImage}
              className="absolute right-2 bottom-2 z-10"
            >
              <ButtonIcon
                iconComponent={<i className="bx bx-trash" />}
                title={t("delete-image")}
                buttonVariant="Icon-Secondary"
                buttonSize="sm"
              />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
