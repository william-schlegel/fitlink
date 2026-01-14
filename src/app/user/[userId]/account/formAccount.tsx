"use client";
import MapComponent, { Layer, Marker, Source } from "react-map-gl/mapbox";

import { LATITUDE, LONGITUDE } from "@/lib/defaultValues";

import { SubmitHandler, useForm, useWatch, Controller } from "react-hook-form";
import { isDate, startOfToday } from "date-fns";
import { useLocalStorage } from "usehooks-ts";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

import { inferProcedureOutput } from "@trpc/server";

import { AlertCircle, MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSet,
  FieldLegend,
} from "@/components/ui/shadcn/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/shadcn/input-group";
import { Badge, Button, Card, CardContent } from "@/components/ui/shadcn";
import { SubscriptionForm } from "@/components/modals/manageUser";
import { Textarea } from "@/components/ui/shadcn/textarea";
import AddressSearch from "@/components/ui/addressSearch";
import generateCircle from "@/components/sections/utils";
import DeleteButton from "@/components/ui/deleteButton";
import Confirmation from "@/components/ui/confirmation";
import { Input } from "@/components/ui/shadcn/input";
import { TThemes } from "@/components/themeSelector";
import { remainingDays } from "@/lib/formatDate";
import { AppRouter } from "@/server/api/root";
import { RoleEnum } from "@/db/schema/enums";
import { trpc } from "@/lib/trpc/client";
import PlanDetails from "./planDetails";
import { ROLE_LIST } from "@/lib/data";
import hslToHex from "@/lib/hslToHex";
import { isCUID } from "@/lib/utils";
import { env } from "@/env";

type FormValues = {
  searchAddress: string;
  longitude: number;
  latitude: number;
  internalRole: RoleEnum;
  range: number;
  description: string;
  aboutMe: string;
  coachingActivities: string[];
  publicName: string;
  pricingId: string;
  monthlyPayment: boolean;
  cancelationDate: Date | null;
};

export default function FormAccount({
  userData,
}: {
  userData: inferProcedureOutput<AppRouter["users"]["getUserById"]>;
}) {
  const [newActivity, setNewActivity] = useState("");
  const [theme] = useLocalStorage<TThemes>("theme", "cupcake");

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    setError,
    clearErrors,
  } = useForm<FormValues>({
    defaultValues: {
      longitude: LONGITUDE,
      latitude: LATITUDE,
      internalRole: userData?.internalRole ?? "MEMBER",
      coachingActivities: userData?.coachData?.coachingActivities ?? [],
      pricingId: userData?.pricingId ?? "",
      monthlyPayment: userData?.monthlyPayment ?? true,
      searchAddress: userData?.coachData?.searchAddress ?? "",
      publicName: userData?.coachData?.publicName ?? "",
      description: userData?.coachData?.description ?? "",
      aboutMe: userData?.coachData?.aboutMe ?? "",
      range: userData?.coachData?.range ?? 10,
    },
  });

  const fields = useWatch({
    control,
  });

  const t = useTranslations("auth");
  const router = useRouter();
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess() {
      toast.success(t("account.user-updated"));
      router.refresh();
    },
    onError(error) {
      toast.error(t("account.user-updated-error", { error: error.message }));
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (!isCUID(data.pricingId) && !isCUID(userData?.pricingId)) {
      setError("pricingId", {
        type: "required",
        message: t("account.pricing-mandatory") ?? "",
      });
      return;
    } else clearErrors("pricingId");
    updateUser.mutate({
      id: userData.id,
      searchAddress: data.searchAddress,
      longitude: data.longitude,
      latitude: data.latitude,
      internalRole: data.internalRole,
      range: Number(data.range ?? 0),
      description: data.description,
      aboutMe: data.aboutMe,
      coachingActivities: data.coachingActivities,
      publicName: data.publicName,
      pricingId: data.pricingId || (userData?.pricingId ?? ""),
      monthlyPayment: data.monthlyPayment,
      cancelationDate: data.cancelationDate ?? undefined,
    });
  };

  const circle = useMemo(() => {
    return generateCircle(
      fields.longitude ?? LONGITUDE,
      fields.latitude ?? LATITUDE,
      fields.range ?? 10,
    );
  }, [fields.latitude, fields.longitude, fields.range]);

  function handleAddActivity() {
    if (newActivity.trim()) {
      const currentActivities = fields.coachingActivities ?? [];
      setValue("coachingActivities", [
        ...currentActivities,
        newActivity.trim(),
      ]);
      setNewActivity("");
    }
  }
  function handleDeleteActivity(idx: number) {
    const currentActivities = fields.coachingActivities ?? [];
    setValue(
      "coachingActivities",
      currentActivities.filter((_, i) => i !== idx),
    );
  }

  const newPricing = trpc.pricings.getPricingById.useQuery(
    fields?.pricingId ?? "",
    {
      enabled: isCUID(fields.pricingId),
    },
  );

  return (
    <form
      className={`flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:items-start`}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FieldSet className="space-y-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="select-internalRole">
              {t("account.my-internalRole")}
            </FieldLabel>
            {userData?.internalRole === "ADMIN" ? (
              <div id="select-internalRole">{t("account.admin")}</div>
            ) : (
              <Controller
                name="internalRole"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as RoleEnum)}
                  >
                    <SelectTrigger
                      id="select-internalRole"
                      className="max-w-xs"
                    >
                      <SelectValue placeholder={t("account.my-internalRole")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_LIST.filter((rl) => rl.value !== "ADMIN").map(
                        (rl) => (
                          <SelectItem key={rl.value} value={rl.value}>
                            {t(rl.label)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </Field>
          {fields?.internalRole === "COACH" ||
          fields.internalRole === "MANAGER_COACH" ? (
            <>
              <Field>
                <FieldLabel htmlFor="publicName">
                  {t("account.public-name")}
                </FieldLabel>
                <Input id="publicName" {...register("publicName")} />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">
                  {t("account.short-presentation")}
                </FieldLabel>
                <Textarea
                  id="description"
                  {...register("description")}
                  rows={4}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="aboutMe">
                  {t("account.about-me")}
                </FieldLabel>
                <Textarea id="aboutMe" {...register("aboutMe")} rows={4} />
              </Field>
              <Field>
                <FieldLabel htmlFor="publicActivities">
                  {t("account.public-activities")}
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="publicActivities"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddActivity();
                      }
                    }}
                  />
                  <InputGroupButton
                    type="button"
                    onClick={handleAddActivity}
                    size="icon-sm"
                  >
                    <Plus />
                  </InputGroupButton>
                </InputGroup>
                <div className="mt-4 flex flex-wrap gap-2">
                  {fields.coachingActivities?.map((activity, idx) => (
                    <Card key={`activity-${idx}`} size="sm">
                      <CardContent className="flex items-center gap-2">
                        <span>{activity}</span>

                        <DeleteButton
                          label={t("account.delete-activity")}
                          icon
                          onClick={() => handleDeleteActivity(idx)}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </Field>
            </>
          ) : null}
        </FieldGroup>
      </FieldSet>

      <section>
        {fields?.internalRole === "COACH" ||
        fields.internalRole === "MANAGER_COACH" ? (
          <FieldSet className="mb-2">
            <FieldGroup>
              <AddressSearch
                label={t("account.google-address")}
                defaultAddress={fields.searchAddress ?? ""}
                onSearch={(adr) => {
                  setValue("searchAddress", adr.address);
                  setValue("latitude", adr.lat);
                  setValue("longitude", adr.lng);
                }}
              />
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="longitude">
                    {t("account.longitude")}
                  </FieldLabel>
                  <Input
                    id="longitude"
                    {...register("longitude", { valueAsNumber: true })}
                    disabled
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="latitude">
                    {t("account.latitude")}
                  </FieldLabel>
                  <Input
                    id="latitude"
                    {...register("latitude", { valueAsNumber: true })}
                    disabled
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="range">{t("account.range")}</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    id="range"
                    type="number"
                    {...register("range", { valueAsNumber: true })}
                    min={0}
                    max={100}
                    className="w-auto flex-1"
                  />
                  <span className="text-sm text-base-content/70">km</span>
                </div>
              </Field>
              <div className="border-2 border-primary">
                <MapComponent
                  initialViewState={{
                    longitude: LONGITUDE,
                    latitude: LATITUDE,
                    zoom: 8,
                  }}
                  style={{ width: "100%", height: "20rem" }}
                  mapStyle="mapbox://styles/mapbox/streets-v9"
                  mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
                  attributionControl={false}
                  longitude={fields.longitude ?? LONGITUDE}
                  latitude={fields.latitude ?? LATITUDE}
                >
                  <Source type="geojson" data={circle}>
                    <Layer
                      type="fill"
                      paint={{
                        "fill-color": hslToHex(theme, "--p"),
                        "fill-opacity": 0.2,
                      }}
                    />
                    <Layer
                      type="line"
                      paint={{
                        "line-color": hslToHex(theme, "--p"),
                        "line-opacity": 1,
                        "line-width": 2,
                      }}
                    />
                  </Source>
                  <Marker
                    anchor="bottom"
                    longitude={fields.longitude ?? LONGITUDE}
                    latitude={fields.latitude ?? LATITUDE}
                  >
                    <MapPin className="text-accent size-4" />
                  </Marker>
                </MapComponent>
              </div>
            </FieldGroup>
          </FieldSet>
        ) : null}

        <div className="rounded border border-primary p-4">
          <div className="flex flex-col gap-2">
            <h2>{t("account.plan")}</h2>
            {userData?.pricingId &&
            userData.pricing?.roleTarget === fields?.internalRole ? (
              <>
                <label className="self-start">{t("account.actual-plan")}</label>
                <div className="flex gap-2">
                  <div className="rounded bg-primary/10 px-4 py-2 text-primary">
                    <PlanDetails
                      // Actual pricing
                      monthlyPayment={userData.monthlyPayment ?? true}
                      name={userData.pricing?.title ?? null}
                      monthly={userData.pricing?.monthly ?? null}
                      yearly={userData.pricing?.yearly ?? null}
                      free={userData.pricing?.free ?? null}
                    />
                  </div>
                  {userData.trialUntil && !userData.pricing?.free ? (
                    <div className="rounded bg-accent/10 px-4 py-2 text-accent">
                      {t("account.trial-remaining", {
                        count: remainingDays(userData.trialUntil),
                      })}
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div>{t("account.no-plan-yet")}</div>
            )}
            {fields.pricingId !== userData?.pricingId ? ( // new pricing
              <div className="flex flex-1 flex-col border-2 border-warning p-2">
                <h4>{t("account.new-plan")}</h4>
                <div className="rounded bg-accent/10 px-4 py-2 text-center text-accent">
                  {newPricing.data ? (
                    <PlanDetails
                      monthlyPayment={fields.monthlyPayment ?? true}
                      name={newPricing.data?.title}
                      monthly={newPricing.data?.monthly}
                      yearly={newPricing.data?.yearly}
                      free={newPricing.data?.free}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            <SubscriptionForm
              internalRole={
                fields.internalRole ?? userData?.internalRole ?? "MEMBER"
              }
              subscriptionId={userData?.pricingId ?? fields.pricingId}
              onNewPlan={(newPId, monthly) => {
                setValue("pricingId", newPId);
                setValue("monthlyPayment", monthly);
                clearErrors("pricingId");
              }}
            />
            {errors.pricingId ? (
              <FieldError>{errors.pricingId.message}</FieldError>
            ) : null}
          </div>
        </div>
        <div className="mt-4 rounded border border-destructive p-4 text-center">
          <Confirmation
            message={t("account.cancel-plan-message")}
            title={t("account.cancel-plan")}
            variant="destructive"
            buttonIcon={<X />}
            textConfirmation={t("account.cancel-plan-confirm")}
            onConfirm={() => setValue("cancelationDate", startOfToday())}
          />
          {isDate(fields.cancelationDate) ? (
            <div className="alert alert-error mt-4">
              <div>
                <AlertCircle className="text-destructive size-4" />
                <span>{t("account.cancelation-requested")}</span>
              </div>
              <div className="flex-none">
                <Button
                  variant="outline"
                  className="bg-warning/10"
                  size="icon"
                  type="button"
                  onClick={() => setValue("cancelationDate", null)}
                >
                  <X />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
      <Button
        type="submit"
        size="xl"
        className="col-span-2 w-fit"
        disabled={updateUser.isPending}
      >
        {t("account.save-account")}
      </Button>
    </form>
  );
}
