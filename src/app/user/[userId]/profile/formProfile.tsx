"use client";

import { useTranslations } from "next-intl";
import {
  FormProvider,
  SubmitHandler,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { inferProcedureOutput } from "@trpc/server";

import { useRouter } from "next/navigation";

import { Trash } from "lucide-react";

import { toast } from "sonner";

import ButtonIcon from "@/components/ui/buttonIcon";
import { Button } from "@/components/ui/shadcn";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/shadcn/field";
import { Input } from "@/components/ui/shadcn/input";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { UploadButton } from "@/components/uploadthing";
import { trpc } from "@/lib/trpc/client";
import { AppRouter } from "@/server/api/root";

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
      internalRole: userData.internalRole ?? "MEMBER",
    });
    form.reset();
  };

  return (
    <FormProvider {...form}>
      <form
        className={`flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:items-start`}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldSet className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">{t("profile.change-name")}</FieldLabel>
              <Input
                id="name"
                {...form.register("name", {
                  required: t("profile.name-mandatory") ?? true,
                })}
                type="text"
              />
              {form.formState.errors.name ? (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="email">{t("profile.my-email")}</FieldLabel>
              <Input id="email" {...form.register("email")} type="email" />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone">{t("profile.phone")}</FieldLabel>
              <Input id="phone" {...form.register("phone")} type="tel" />
            </Field>
            <Field>
              <FieldLabel htmlFor="address">{t("profile.address")}</FieldLabel>
              <Textarea id="address" {...form.register("address")} rows={4} />
            </Field>
            <Field>
              <FieldLabel>{t("profile.account-provider")}</FieldLabel>
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
            </Field>
          </FieldGroup>
        </FieldSet>
        <ProfileImage />
        <Button disabled={updateUser.isPending}>
          {t("profile.save-profile")}
        </Button>
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
            <ButtonIcon
              iconComponent={
                <Trash className="fill-destructive stroke-destructive" />
              }
              title={t("delete-image")}
              size="icon"
              variant="default"
              onClick={handleDeleteImage}
              className="absolute right-2 bottom-2 z-10"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
