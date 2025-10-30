"use client";

import {
  FormProvider,
  SubmitHandler,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useTranslations } from "next-intl";

import { inferProcedureOutput } from "@trpc/server";

import { useRouter } from "next/navigation";

import { UploadButton } from "@/components/uploadthing";
import ButtonIcon from "@/components/ui/buttonIcon";
import { AppRouter } from "@/server/api/root";
import { trpc } from "@/lib/trpc/client";
import { toast } from "@/lib/toast";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  imageUrl?: string;
  deleteImage: boolean;
};

export default function FormProfile({
  userData,
}: {
  userData: inferProcedureOutput<AppRouter["users"]["getUserById"]>;
}) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone ?? "",
      address: userData.address ?? "",
      imageUrl: userData.profileImageUrl ?? "",
    },
  });
  const t = useTranslations("auth");
  const router = useRouter();
  const utils = trpc.useUtils();
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess() {
      utils.users.getUserById.invalidate({ id: userData.id });
      toast.success(t("user-updated"));
      router.refresh();
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    updateUser.mutate({
      id: userData.id!,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      profileImageUrl: data.imageUrl,
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
          <textarea
            {...form.register("address")}
            className="field-sizing-content"
            rows={4}
          />
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
        <ProfileImage />
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

function ProfileImage() {
  const { control, setValue } = useFormContext();
  const t = useTranslations("auth");

  const imageUrl = useWatch({ control: control, name: "imageUrl" });

  const handleDeleteImage = () => {
    setValue("deleteImage", true);
    setValue("image", undefined);
  };

  return (
    <section>
      <div className="col-span-2 flex items-center justify-start gap-4">
        <div>
          <UploadButton
            endpoint="profilePicture"
            onClientUploadComplete={(result) =>
              setValue("imageUrl", result[0].ufsUrl)
            }
            className="ut-button:btn-primary ut-button:btn"
            buttonText={t("profile.profile-image")}
          />
        </div>
        {imageUrl ? (
          <div className="relative w-30 max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element*/}
            <img
              src={imageUrl}
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
