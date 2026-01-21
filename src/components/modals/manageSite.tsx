"use client";

import { MapPin, Pencil, Plus, Trash } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import MapComponent, { Marker } from "react-map-gl/mapbox";

import { toast } from "sonner";

import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { env } from "@/env";
import { useUser } from "@/lib/auth/client";
import createLink from "@/lib/createLink";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { trpc } from "@/lib/trpc/client";
import AddressSearch from "../ui/addressSearch";
import Confirmation from "../ui/confirmation";
import Modal from "../ui/modal";

import type { ButtonSize, ButtonVariant } from "@/components/ui/shadcn/button";

type SiteFormValues = {
  name: string;
  address: string;
  searchAddress: string;
  longitude: number;
  latitude: number;
};

type CreateSiteProps = {
  clubId: string;
};

export const CreateSite = ({ clubId }: CreateSiteProps) => {
  const utils = trpc.useUtils();
  const t = useTranslations("club");
  const router = useRouter();
  const { data: user } = useUser();
  const userId = user?.id ?? "";
  const [closeModal, setCloseModal] = useState(false);

  const createSite = trpc.sites.createSite.useMutation({
    onSuccess: (data) => {
      utils.clubs.getClubById.invalidate({ clubId, userId });
      utils.sites.getSitesForClub.invalidate(clubId);
      toast.success(t("site.created"));
      router.push(createLink({ siteId: data[0].id }));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const onSubmit = (data: SiteFormValues) => {
    createSite.mutate({ clubId, ...data });
  };

  return (
    <Modal
      title={t("site.create")}
      buttonIcon={<Plus />}
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
    >
      <h3>{t("site.create")}</h3>
      <p className="py-4 text-base-content/70">
        {t("site.enter-info-new-site")}
      </p>
      <SiteForm onSubmit={onSubmit} onCancel={() => setCloseModal(true)} />
    </Modal>
  );
};

type UpdateSiteProps = {
  siteId: string;
  clubId: string;
};

export const UpdateSite = ({ siteId, clubId }: UpdateSiteProps) => {
  const utils = trpc.useUtils();
  const [initialData, setInitialData] = useState<SiteFormValues | undefined>();
  const [closeModal, setCloseModal] = useState(false);
  const querySite = trpc.sites.getSiteById.useQuery(siteId);
  const t = useTranslations("club");

  useEffect(() => {
    if (querySite.data) {
      const data = querySite.data;
      startTransition(() => {
        setInitialData({
          name: data.name,
          address: data.address,
          latitude: data.latitude ?? LATITUDE,
          longitude: data.longitude ?? LONGITUDE,
          searchAddress: data.searchAddress ?? "",
        });
      });
    }
  }, [querySite.data]);

  const updateSite = trpc.sites.updateSite.useMutation({
    onSuccess: () => {
      utils.sites.getSiteById.invalidate(siteId);
      utils.sites.getSitesForClub.invalidate(clubId);
      toast.success(t("site.updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: SiteFormValues) => {
    updateSite.mutate({ id: siteId, ...data });
  };

  return (
    <Modal
      title={t("site.update", { siteName: querySite.data?.name ?? "" })}
      buttonIcon={<Pencil />}
      variant="outline"
      buttonSize="icon"
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-4">
          {t("site.update")}
          <span className="text-primary">{querySite?.data?.name}</span>
        </h3>
      </div>
      <SiteForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={() => setCloseModal(true)}
      />
    </Modal>
  );
};

type PropsUpdateDelete = {
  clubId: string;
  siteId: string;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export const DeleteSite = ({
  clubId,
  siteId,
  variant = "destructive",
  buttonSize = "icon",
}: PropsUpdateDelete) => {
  const utils = trpc.useUtils();
  const t = useTranslations("club");
  const user = useUser();

  const deleteSite = trpc.sites.deleteSite.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(user?.data?.id ?? "");
      utils.clubs.getClubById.invalidate({
        clubId,
        userId: user.data?.id ?? "",
      });
      toast.success(t("site.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("site.deletion-message")}
      title={t("site.deletion")}
      buttonIcon={<Trash />}
      onConfirm={() => {
        deleteSite.mutate(siteId);
      }}
      variant={variant}
      buttonSize={buttonSize}
    />
  );
};

type SiteFormProps = {
  onSubmit: (data: SiteFormValues) => void;
  onCancel: () => void;
  initialData?: SiteFormValues;
};

function SiteForm({ onSubmit, onCancel, initialData }: SiteFormProps) {
  const t = useTranslations();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm<SiteFormValues>();
  const fields = useWatch({ control });

  useEffect(() => {
    reset(initialData);
  }, [initialData, reset]);

  const onSubmitForm: SubmitHandler<SiteFormValues> = (data) => {
    onSubmit(data);
    reset();
  };

  const onError: SubmitErrorHandler<SiteFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm, onError)}
      className="grid grid-cols-2 items-start gap-4"
    >
      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label className="after:content-['*'] after:text-error after:ml-0.5">
            {t("club.club.name")}
          </Label>
          <Input
            {...register("name", {
              required: t("club.name-mandatory") ?? true,
            })}
            type="text"
          />
          {errors.name && (
            <p className="text-sm text-error">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="after:content-['*'] after:text-error after:ml-0.5">
            {t("club.club.address")}
          </Label>
          <Input
            {...register("address", {
              required: t("club.address-mandatory") ?? true,
            })}
            type="text"
          />
          {errors.address && (
            <p className="text-sm text-error">{errors.address.message}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <AddressSearch
          label={t("club.club.search-address")}
          defaultAddress={fields.searchAddress}
          onSearch={(adr) => {
            setValue("searchAddress", adr.address);
            setValue("latitude", adr.lat);
            setValue("longitude", adr.lng);
          }}
          required
        />
        <MapComponent
          initialViewState={{ zoom: 8 }}
          style={{ width: "100%", height: "20rem" }}
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
            <MapPin className="h-6 w-6 text-primary" />
          </Marker>
        </MapComponent>
      </div>

      <div className="col-span-2 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
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
