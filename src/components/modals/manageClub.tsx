"use client";

import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import MapComponent, { Marker } from "react-map-gl/mapbox";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import Image from "next/image";
import Link from "next/link";

import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";
import CollapsableGroup from "../ui/collapsableGroup";
import AddressSearch from "../ui/addressSearch";
import FindCoach from "../sections/findCoach";
import Confirmation from "../ui/confirmation";
import { UploadButton } from "../uploadthing";
import { useUser } from "@/lib/auth/client";
import ButtonIcon from "../ui/buttonIcon";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";
import Rating from "../ui/rating";
import Modal from "../ui/modal";
import { env } from "@/env";

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
      buttonIcon={<i className="bx bx-plus bx-sm" />}
      className="w-11/12 max-w-4xl"
      cancelButtonText=""
      closeModal={closeModal}
      onCloseModal={() => setCloseModal(false)}
    >
      <h3>{t("club.create-new")}</h3>
      <p className="py-4">{t("club.enter-new-club-info")}</p>
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
      setInitialData({
        address: queryClub.data.address ?? "",
        name: queryClub.data.name ?? "",
        logoUrl: queryClub.data.logoUrl ?? undefined,
        deleteLogo: false,
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
      buttonIcon={<i className="bx bx-edit bx-sm" />}
      variant={"Icon-Outlined-Primary"}
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
      className={`${
        update || !fields.isSite ? "" : "grid grid-cols-2"
      } items-start gap-4`}
    >
      <div className="grid grid-cols-[auto_1fr] items-center gap-2">
        <label className="required">{t("club.name")}</label>
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
        {update ? null : (
          <div className="form-control col-span-2">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="checkbox-primary checkbox"
                {...register("isSite")}
                defaultChecked={true}
              />
              <span className="label-text">{t("club.is-site")}</span>
            </label>
          </div>
        )}

        <label className="required">{t("club.address")}</label>
        <div>
          <input
            {...register("address", {
              required: t("address-mandatory") ?? true,
            })}
            type={"text"}
            className="input-bordered input w-full"
          />
          {errors.address ? (
            <p className="text-sm text-error">{errors.address.message}</p>
          ) : null}
        </div>
        <div className="col-span-2 flex flex-col items-center justify-start gap-4">
          <div className="w-full ">
            <UploadButton
              endpoint="imageAttachment"
              onClientUploadComplete={(result) =>
                setValue("logoUrl", result[0].ufsUrl)
              }
              buttonText={t("club.logo")}
            />
          </div>
          {fields.logoUrl ? (
            <div className="relative w-40 max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fields.logoUrl} alt="" />
              <button
                onClick={handleDeleteImage}
                className="absolute right-2 bottom-2 z-10"
              >
                <ButtonIcon
                  iconComponent={<i className="bx bx-trash" />}
                  title={t("club.delete-logo")}
                  buttonVariant="Icon-Secondary"
                  buttonSize="sm"
                />
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {!update && fields.isSite ? (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <AddressSearch
              label={t("club.search-address")}
              defaultAddress={fields.searchAddress}
              onSearch={(adr) => {
                setValue("searchAddress", adr.address);
                setValue("latitude", adr.lat);
                setValue("longitude", adr.lng);
              }}
              className="col-span-2"
              required
            />
          </div>
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
              <i className="bx bx-pin bx-sm text-secondary" />
            </Marker>
          </MapComponent>
        </div>
      ) : null}
      <div className="col-span-2 flex items-center justify-end gap-2">
        <button
          className="btn btn-outline btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            onCancel();
          }}
        >
          {t2("cancel")}
        </button>
        <button className="btn btn-primary" type="submit">
          {t2("save")}
        </button>
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
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      variant={"Icon-Outlined-Secondary"}
    />
  );
};

export default CreateClub;

const AddCoachToClubSteps = [
  { content: String.fromCodePoint(0x1f50d), label: "coach.search" },
  { content: String.fromCodePoint(0x2709), label: "coach.write" },
];

type AddCoachToClubProps = { clubId: string; userId: string };

export const AddCoachToClub = ({ clubId, userId }: AddCoachToClubProps) => {
  const createNotifications =
    trpc.notifications.createNotificationToUsers.useMutation({
      onSuccess() {
        toast.success(t("coach.notification-success"));
      },
      onError(error) {
        toast.error(error.message);
      },
    });
  const [closeModal, setCloseModal] = useState(false);
  const t = useTranslations("club");
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [coachIds, setCoachIds] = useState<string[]>([]);

  function handleSendMessage() {
    if (coachIds.length > 0 && message)
      createNotifications.mutate({
        type: "SEARCH_COACH",
        from: userId,
        to: coachIds,
        message: message,
        data: JSON.stringify({ clubId }),
      });
    setCloseModal(true);
    setStep(0);
  }

  return (
    <Modal
      title={t("coach.add")}
      closeModal={closeModal}
      buttonIcon={<i className="bx bx-plus bx-sm" />}
      variant={"Primary"}
      className="w-11/12 max-w-4xl @container"
      onCloseModal={() => {
        setCloseModal(false);
        setStep(0);
      }}
    >
      <h3>{t("coach.find")}</h3>
      <div className="grid grid-cols-[auto,1fr] gap-2">
        <ul className="steps steps-vertical">
          {AddCoachToClubSteps.map((s, idx) => (
            <li
              key={idx}
              data-content={s.content}
              className={`step ${idx <= step ? "step-primary" : ""}`}
            >
              <span className={idx === step ? "font-bold text-primary" : ""}>
                {t(s.label)}
              </span>
            </li>
          ))}
        </ul>
        {step === 0 ? (
          <FindCoach
            onSelectMultiple={(ids) => {
              setCoachIds(ids);
              setStep((prev) => prev + 1);
            }}
          />
        ) : null}
        {step === 1 ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <label className="required w-fit">{t("coach.message")}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="field-sizing-content"
              rows={4}
              placeholder={t("coach.message-placeholder") ?? ""}
              required
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-primary" type="submit">
                {t("coach.write")}
              </button>
            </div>
          </form>
        ) : null}
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
      {url ? (
        <Image
          src={url}
          width={300}
          height={300}
          alt=""
          style={{ objectFit: "contain" }}
          className="rounded-md shadow"
        />
      ) : null}

      <div className="flex flex-col gap-2">
        <label>{t("activity.activities")}</label>
        <div className="flex flex-wrap gap-2">
          {activityGroups.map((ag) => (
            <span key={ag.id} className="pill bg-base-100">
              {ag.name}
            </span>
          ))}
        </div>
        <label>{t("coach.certifications")}</label>
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <CollapsableGroup
              key={cert.id}
              groupName={cert.name}
              className="bg-base-100 normal-case"
            >
              {cert.modules.map((mod) => (
                <span key={mod.id} className="pill pill-xs">
                  {mod.name}
                </span>
              ))}
            </CollapsableGroup>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <label>{t("coach.rating")}</label>
          <Rating note={rating} />
        </div>
        {pageId ? (
          <Link
            href={`/presentation-page/coach/${id}/${pageId}`}
            target="_blank"
            rel="noreferrer"
          >
            <button className="btn btn-primary flex items-center gap-4">
              <span>{t("coach.view-page")}</span>
              <i className="bx bx-link-external bx-xs" />
            </button>
          </Link>
        ) : null}
      </div>
    </>
  );
}
