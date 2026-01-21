"use client";

import {
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash,
} from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import MapComponent, { Marker } from "react-map-gl/mapbox";

import { useMutation } from "convex/react";

import { toast } from "sonner";

import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { Checkbox } from "@/components/ui/shadcn/checkbox";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Spinner } from "@/components/ui/shadcn/spinner";
import { Textarea } from "@/components/ui/shadcn/textarea";
import { env } from "@/env";
import { useUser } from "@/lib/auth/client";
import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import { trpc } from "@/lib/trpc/client";
import { cn, isCUID } from "@/lib/utils";
import { api } from "../../../convex/_generated/api";
import FindCoach from "../sections/findCoach";
import AddressSearch from "../ui/addressSearch";
import CollapsableGroup from "../ui/collapsableGroup";
import Confirmation from "../ui/confirmation";
import DeleteButton from "../ui/deleteButton";
import Modal from "../ui/modal";
import Rating from "../ui/rating";
import { Field, FieldError, FieldLabel } from "../ui/shadcn";
import { UploadButton } from "../uploadthing";

export const CreateClub = () => {
  const { data: user } = useUser();
  const utils = trpc.useUtils();
  const t = useTranslations("club");
  const [closeModal, setCloseModal] = useState(false);
  const router = useRouter();

  const createClub = trpc.clubs.createClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(user?.id ?? "");
      router.refresh();
      toast.success(t("club.created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const onSubmit = async (data: ClubFormValues) => {
    createClub.mutate({
      userId: user?.id ?? "",
      name: data.name,
      address: data.address,
      isSite: data.isSite ?? true,
      latitude: data.latitude ?? LATITUDE,
      longitude: data.longitude ?? LONGITUDE,
      searchAddress: data.searchAddress ?? "",
      logoUrl: data.logoUrl ?? undefined,
    });
    setCloseModal(true);
  };

  return (
    <Modal
      title={t("club.create-new")}
      buttonIcon={<Plus className="h-5 w-5" />}
      className="w-11/12 max-w-4xl"
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
    >
      <h3>{t("club.create-new")}</h3>
      <p className="py-4 text-base-content/70">
        {t("club.enter-new-club-info")}
      </p>
      <ClubForm onSubmit={onSubmit} onCancel={() => setCloseModal(true)} />
    </Modal>
  );
};

type PropsUpdateDelete = {
  clubId: string;
};

export const UpdateClub = ({ clubId }: PropsUpdateDelete) => {
  const { data: user } = useUser();
  const userId = user?.id ?? "";
  const utils = trpc.useUtils();
  const t = useTranslations("club");
  const [initialData, setInitialData] = useState<ClubFormValues | undefined>();
  const [closeModal, setCloseModal] = useState(false);
  const queryClub = trpc.clubs.getClubById.useQuery(
    { clubId, userId },
    {
      enabled: isCUID(clubId) && userId !== "",
    },
  );
  useEffect(() => {
    if (queryClub.data) {
      const data = queryClub.data;
      startTransition(() => {
        setInitialData({
          address: data.address ?? "",
          name: data.name ?? "",
          logoUrl: data.logoUrl ?? undefined,
          deleteLogo: false,
        });
      });
    }
  }, [queryClub.data]);

  const updateClub = trpc.clubs.updateClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(user?.id ?? "");
      utils.clubs.getClubById.invalidate({ clubId, userId });
      toast.success(t("club.updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit = async (data: ClubFormValues) => {
    updateClub.mutate({
      id: clubId,
      name: data.name,
      address: data.address,
      logoUrl: data.logoUrl ?? null,
    });
    setInitialData(undefined);
    setCloseModal(true);
  };

  return (
    <Modal
      title={t("club.update")}
      buttonIcon={<Pencil />}
      variant="outline"
      buttonSize="icon"
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
    >
      <h3>
        {t("club.update")} {queryClub.data?.name}
      </h3>
      {initialData ? (
        <ClubForm
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

type ClubFormValues = {
  name: string;
  address: string;
  isSite?: boolean;
  searchAddress?: string;
  longitude?: number;
  latitude?: number;
  logoUrl?: string;
  deleteLogo: boolean;
};

type ClubFormProps = {
  onSubmit: (data: ClubFormValues) => void;
  onCancel: () => void;
  update?: boolean;
  initialData?: ClubFormValues;
};

function ClubForm({ onSubmit, onCancel, update, initialData }: ClubFormProps) {
  const t2 = useTranslations("common");
  const t = useTranslations("club");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm<ClubFormValues>({
    defaultValues: {
      logoUrl: initialData?.logoUrl ?? undefined,
      address: initialData?.address ?? "",
      name: initialData?.name ?? "",
      isSite: initialData?.isSite ?? true,
      searchAddress: initialData?.searchAddress ?? "",
      longitude: initialData?.longitude ?? LONGITUDE,
      latitude: initialData?.latitude ?? LATITUDE,
      deleteLogo: initialData?.deleteLogo ?? false,
    },
  });
  const fields = useWatch({ control });

  useEffect(() => {
    reset(initialData);
  }, [initialData, reset]);

  const handleDeleteImage = () => {
    setValue("deleteLogo", true);
    setValue("logoUrl", undefined);
  };

  const onSubmitForm: SubmitHandler<ClubFormValues> = (data) => {
    onSubmit(data);
    reset();
  };

  const onError: SubmitErrorHandler<ClubFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm, onError)}
      className={cn(
        "items-start gap-4",
        update || !fields.isSite ? "" : "grid grid-cols-2",
      )}
    >
      <div className="space-y-4">
        <Field>
          <FieldLabel htmlFor="name">{t("club.name")}</FieldLabel>
          <Input
            id="name"
            {...register("name", {
              required: t("name-mandatory") ?? true,
            })}
            type="text"
          />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>
        {!update && (
          <Field orientation="horizontal">
            <Checkbox
              id="isSite"
              checked={fields.isSite}
              onCheckedChange={(checked) => setValue("isSite", !!checked)}
            />
            <FieldLabel htmlFor="isSite">{t("club.is-site")}</FieldLabel>
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="address">{t("club.address")}</FieldLabel>
          <Input
            id="address"
            {...register("address", {
              required: t("address-mandatory") ?? true,
            })}
            type="text"
          />
          {errors.address && <FieldError>{errors.address.message}</FieldError>}
        </Field>

        <div className="col-span-2 flex flex-col items-center justify-start gap-4">
          <div className="w-full">
            <UploadButton
              endpoint="imageAttachment"
              onClientUploadComplete={(result) =>
                setValue("logoUrl", result[0].ufsUrl)
              }
              buttonText={t("club.logo")}
            />
          </div>
          {fields.logoUrl && (
            <div className="relative w-40 max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fields.logoUrl} alt="" className="rounded-md" />
              <DeleteButton
                onClick={handleDeleteImage}
                className="absolute right-2 bottom-2"
              />
            </div>
          )}
        </div>
      </div>
      {!update && fields.isSite && (
        <div className="flex flex-col gap-4">
          <AddressSearch
            label={t("club.search-address")}
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
              <MapPin className="h-6 w-6 text-secondary" />
            </Marker>
          </MapComponent>
        </div>
      )}
      <div className="col-span-2 flex items-center justify-end gap-2 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            onCancel();
          }}
        >
          {t2("cancel")}
        </Button>
        <Button type="submit">{t2("save")}</Button>
      </div>
    </form>
  );
}

export const DeleteClub = ({ clubId }: PropsUpdateDelete) => {
  const utils = trpc.useUtils();
  const { data: user } = useUser();
  const t2 = useTranslations("common");
  const t = useTranslations("club");

  const deleteClub = trpc.clubs.deleteClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(user?.id ?? "");
      utils.clubs.getClubById.invalidate({ clubId, userId: user?.id ?? "" });
      toast.success(t2("deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("club.deletion-message")}
      title={t("club.deletion")}
      onConfirm={() => {
        deleteClub.mutate(clubId);
      }}
      buttonIcon={<Trash />}
      variant="destructive"
      buttonSize="icon"
    />
  );
};

export default CreateClub;

const AddCoachToClubSteps = [
  { content: <Search />, label: "coach.search" },
  { content: <Mail />, label: "coach.write" },
];

type AddCoachToClubProps = { clubId: string; userId: string };

export const AddCoachToClub = ({ clubId, userId }: AddCoachToClubProps) => {
  const createNotifications = useMutation(
    api.notifications.createNotifications,
  );
  const [closeModal, setCloseModal] = useState(false);
  const t = useTranslations("club");
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [coachIds, setCoachIds] = useState<string[]>([]);

  async function handleSendMessage() {
    if (coachIds.length > 0 && message) {
      try {
        await createNotifications({
          notifications: coachIds.map((coachId) => ({
            userId: coachId,
            userFromId: userId,
            type: "SEARCH_COACH",
            message: message,
            data: { clubId },
          })),
        });
        toast.success(t("coach.notification-success"));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to send notification",
        );
      }
    }
    setCloseModal(true);
    setStep(0);
  }

  return (
    <Modal
      title={t("coach.add")}
      closeModal={closeModal}
      buttonIcon={<Plus />}
      variant="default"
      onCloseModal={() => {
        setCloseModal(false);
        setStep(0);
      }}
    >
      <h3>{t("coach.find")}</h3>
      <div className="grid grid-cols-[auto_1fr] gap-4">
        <div className="flex flex-col gap-2">
          {AddCoachToClubSteps.map((s, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 p-4 rounded-md",
                idx <= step ? "bg-primary/10" : "bg-muted",
              )}
            >
              {s.content}
              <span
                className={cn(
                  "text-sm",
                  idx === step && "font-bold text-primary",
                )}
              >
                {t(s.label)}
              </span>
            </div>
          ))}
        </div>
        {step === 0 && (
          <FindCoach
            onSelectMultiple={(ids) => {
              setCoachIds(ids);
              setStep((prev) => prev + 1);
            }}
          />
        )}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="after:content-['*'] after:text-error after:ml-0.5">
                {t("coach.message")}
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder={t("coach.message-placeholder") ?? ""}
                required
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit">{t("coach.write")}</Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

type IdName = {
  id: string;
  name: string;
};

type CoachDataPresentationProps = {
  url?: string;
  activityGroups: IdName[];
  certifications: { id: string; name: string; modules: IdName[] }[];
  rating: number;
  id: string;
  pageId?: string;
};

export function CoachDataPresentation({
  url,
  activityGroups,
  certifications,
  rating,
  id,
  pageId,
}: CoachDataPresentationProps) {
  const t = useTranslations("club");
  return (
    <>
      {url && (
        <Image
          src={url}
          width={300}
          height={300}
          alt=""
          style={{ objectFit: "contain" }}
          className="rounded-md shadow"
        />
      )}

      <div className="flex flex-col gap-3">
        <div>
          <h3>{t("activity.activities")}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {activityGroups.map((ag) => (
              <Badge key={ag.id} variant="outline">
                {ag.name}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <h3>{t("coach.certifications")}</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {certifications.map((cert) => (
              <CollapsableGroup
                key={cert.id}
                groupName={cert.name}
                className="bg-card"
              >
                {cert.modules.map((mod) => (
                  <Badge key={mod.id} variant="secondary" className="text-xs">
                    {mod.name}
                  </Badge>
                ))}
              </CollapsableGroup>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <h3>{t("coach.rating")}</h3>
          <Rating note={rating} />
        </div>
        {pageId && (
          <Button asChild className="w-fit gap-2">
            <Link
              href={`/presentation-page/coach/${id}/${pageId}`}
              target="_blank"
              rel="noreferrer"
            >
              {t("coach.view-page")}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </>
  );
}
