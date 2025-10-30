"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  FormProvider,
  useWatch,
  useFormContext,
} from "react-hook-form";
import { useEffect, useRef, type PropsWithoutRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { FeatureEnum, RoleEnum } from "@/db/schema/enums";
import Modal, { type TModalVariant } from "../ui/modal";
import Confirmation from "../ui/confirmation";
import ButtonIcon from "../ui/buttonIcon";
import { CSS } from "@dnd-kit/utilities";
import { trpc } from "@/lib/trpc/client";
import { ROLE_LIST } from "@/lib/data";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";

type PricingFormValues = {
  title: string;
  description: string;
  roleTarget: RoleEnum;
  free?: boolean;
  highlighted?: boolean;
  monthly?: number;
  yearly?: number;
  options: string[];
  features: boolean[];
};

type CreatePricingProps = {
  variant?: TModalVariant;
};

export const CreatePricing = ({ variant = "Primary" }: CreatePricingProps) => {
  const t = useTranslations("admin");
  const utils = trpc.useUtils();
  const router = useRouter();

  const createPricing = trpc.pricings.createPricing.useMutation({
    onSuccess: () => {
      utils.pricings.getAllPricing.invalidate();
      form.reset();
      toast.success(t("pricing.created"));
      router.refresh();
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const form = useForm<PricingFormValues>();
  const { getListForRole } = useFeature();

  const onSubmit: SubmitHandler<PricingFormValues> = (data) => {
    const featureList = getListForRole(data.roleTarget ?? "MEMBER");
    const features: FeatureEnum[] = [];
    for (let f = 0; f < featureList.length; f++) {
      if (data.features[f]) {
        const feature = featureList[f]?.value;
        if (feature) features.push(feature);
      }
    }
    createPricing.mutate({
      base: {
        title: data.title,
        description: data.description,
        roleTarget: data.roleTarget,
        free: data.free,
        highlighted: data.highlighted,
        monthly: Number(data.monthly),
        yearly: Number(data.yearly),
      },
      options: data.options ?? [],
      features: features ?? [],
    });
  };

  const onError: SubmitErrorHandler<PricingFormValues> = (errors) => {
    console.error("errors :>> ", errors);
  };

  return (
    <Modal
      title={t("pricing.new")}
      buttonIcon={<i className="bx bx-plus bx-sm" />}
      variant={variant}
      className="w-10/12 max-w-[90vw]"
      handleSubmit={form.handleSubmit(onSubmit, onError)}
    >
      <h3>{t("pricing.new")}</h3>
      <FormProvider {...form}>
        <PricingForm />
      </FormProvider>
    </Modal>
  );
};

type PropsUpdateDelete = {
  pricingId: string;
  variant?: TModalVariant;
};

export const UpdatePricing = ({
  pricingId,
  variant = "Primary",
}: PropsUpdateDelete) => {
  const t = useTranslations("admin");
  const utils = trpc.useUtils();
  const { getListForRole } = useFeature();
  const queryPricing = trpc.pricings.getPricingById.useQuery(pricingId);
  const router = useRouter();

  useEffect(() => {
    if (!queryPricing?.data) return;

    const featureList = getListForRole(
      queryPricing.data?.roleTarget ?? "MEMBER",
    );

    form.reset({
      title: queryPricing.data?.title,
      description: queryPricing.data?.description,
      free: queryPricing.data?.free ?? false,
      highlighted: queryPricing.data?.highlighted ?? false,
      monthly: Number(queryPricing.data?.monthly?.toFixed(2) ?? 0),
      yearly: Number(queryPricing.data?.yearly?.toFixed(2) ?? 0),
      roleTarget: queryPricing.data?.roleTarget,
      options: queryPricing.data?.options?.map((o) => o.name) ?? [],
      features:
        featureList.map((f) =>
          queryPricing.data?.features.map((f) => f.feature).includes(f.value),
        ) ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryPricing.data]);

  const updatePricing = trpc.pricings.updatePricing.useMutation({
    onSuccess: () => {
      utils.pricings.getPricingById.invalidate(pricingId);
      form.reset();
      toast.success(t("pricing.updated"));
      router.refresh();
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const form = useForm<PricingFormValues>();

  const onSubmit: SubmitHandler<PricingFormValues> = (data) => {
    const featureList = getListForRole(data.roleTarget ?? "MEMBER");
    const features: FeatureEnum[] = [];
    for (let f = 0; f < featureList.length; f++) {
      if (data.features[f]) {
        const feature = featureList[f]?.value;
        if (feature) features.push(feature);
      }
    }
    updatePricing.mutate({
      base: {
        id: pricingId,
        title: data.title,
        description: data.description,
        roleTarget: data.roleTarget,
        free: data.free,
        highlighted: data.highlighted,
        monthly: Number(data.monthly),
        yearly: Number(data.yearly),
      },
      options: data.options,
      features,
    });
  };

  const onError: SubmitErrorHandler<PricingFormValues> = (errors) => {
    console.error("errors :>> ", errors);
  };

  return (
    <>
      <Modal
        title={t("pricing.update")}
        handleSubmit={form.handleSubmit(onSubmit, onError)}
        buttonIcon={<i className="bx bx-edit bx-sm" />}
        variant={variant}
        className="w-10/12 max-w-[90vw]"
      >
        <h3>{t("pricing.update")}</h3>
        {queryPricing.isLoading ? (
          <Spinner />
        ) : (
          <FormProvider {...form}>
            <PricingForm />
          </FormProvider>
        )}
      </Modal>
    </>
  );
};

export const DeletePricing = ({
  pricingId,
  variant = "Outlined-Secondary",
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useUtils();
  const t = useTranslations("admin");

  const deletePricing = trpc.pricings.deletePricing.useMutation({
    onSuccess: () => {
      utils.pricings.getPricingById.invalidate(pricingId);
      utils.pricings.getAllPricing.invalidate();
      toast.success(t("pricing.deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("pricing.deletion-message")}
      title={t("pricing.deletion")}
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      onConfirm={() => {
        deletePricing.mutate(pricingId);
      }}
      variant={variant}
    />
  );
};

export const UndeletePricing = ({
  pricingId,
  variant = "Outlined-Secondary",
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useUtils();
  const t = useTranslations("admin");

  const undeletePricing = trpc.pricings.undeletePricing.useMutation({
    onSuccess: () => {
      utils.pricings.getPricingById.invalidate(pricingId);
      utils.pricings.getAllPricing.invalidate();
      toast.success(t("pricing.restored"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("pricing.undelete-message")}
      title={t("pricing.undelete")}
      buttonIcon={<i className="bx bx-undo bx-sm" />}
      onConfirm={() => {
        undeletePricing.mutate(pricingId);
      }}
      variant={variant}
    />
  );
};

function PricingForm() {
  const tAuth = useTranslations("auth");
  const t = useTranslations("admin");
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<PricingFormValues>();
  const refOpt = useRef<HTMLInputElement>(null);
  const deleteIsOver = useRef(false);
  const deletePricingOption = trpc.pricings.deletePricingOption.useMutation();
  const fields = useWatch({
    control,
    defaultValue: { free: false, features: [], options: [] },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const { getListForRole } = useFeature();

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over?.id === "delete-zone" || deleteIsOver.current) {
      const idx = active.data.current?.sortable?.index;
      if (!isNaN(idx)) {
        deletePricingOption.mutate(fields.options?.[idx] ?? "");
        const opts = fields.options?.filter((_, i) => i !== idx) ?? [];
        setValue("options", opts);
      }
      return;
    }
    if (active.id !== over?.id) {
      const oldIndex = fields.options?.indexOf(active.id.toString()) ?? 0;
      const newIndex = fields.options?.indexOf(over?.id?.toString() ?? "") ?? 0;

      const newOpt = arrayMove(fields.options ?? [], oldIndex, newIndex);
      setValue("options", newOpt);
    }
  }

  function addOption(option?: string) {
    if (!option) return;
    const opts = fields.options ?? [];
    opts.push(option);
    setValue("options", opts);
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      <form className={`grid grid-cols-[auto_1fr] items-center gap-2`}>
        <label>{t("pricing.name")}</label>
        <div className="flex flex-col gap-2">
          <input
            {...register("title", {
              required: t("pricing.name-mandatory") ?? true,
            })}
            type={"text"}
            className="input-bordered input w-full"
          />
          {errors.title ? (
            <p className="text-sm text-error">{errors.title.message}</p>
          ) : null}
        </div>
        <label className="self-start">{t("pricing.description")}</label>
        <div className="flex flex-col gap-2">
          <textarea
            {...register("description", {
              required: t("pricing.description-mandatory") ?? true,
            })}
            className="field-sizing-content"
          />
          {errors.description ? (
            <p className="text-sm text-error">{errors.description.message}</p>
          ) : null}
        </div>
        <label>{t("pricing.internalRole")}</label>
        <select
          className="max-w-xs"
          {...register("roleTarget")}
          defaultValue="MANAGER"
        >
          {ROLE_LIST.filter((rl) => rl.value !== "ADMIN").map((rl) => (
            <option key={rl.value} value={rl.value}>
              {tAuth(`${rl.label}`)}
            </option>
          ))}
        </select>
        <div className="form-control col-span-2">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="checkbox-primary checkbox"
              {...register("free")}
              defaultChecked={false}
            />
            <span className="label-text">{t("pricing.free")}</span>
          </label>
        </div>
        {fields.free ? null : (
          <>
            <label>{t("pricing.monthly")}</label>
            <div className="input-group">
              <input
                {...register("monthly")}
                type={"number"}
                className="input-bordered input w-full"
              />
              <span>{t("pricing.euro-per-month")}</span>
            </div>
            <label>{t("pricing.yearly")}</label>
            <div className="input-group">
              <input
                {...register("yearly")}
                type={"number"}
                className="input-bordered input w-full"
              />
              <span>{t("pricing.euro-per-year")}</span>
            </div>
          </>
        )}

        <div className="form-control col-span-2">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="checkbox-primary checkbox"
              {...register("highlighted")}
              defaultChecked={false}
            />
            <span className="label-text">{t("pricing.highlighted")}</span>
          </label>
        </div>
      </form>
      <div className="flex flex-col gap-4">
        <label>{t("pricing.options")}</label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.options ?? []}
            strategy={verticalListSortingStrategy}
          >
            <ul className="rounded border border-base-content/20  p-2">
              {fields.options?.map((option, idx) => (
                <Option key={idx} option={option} />
              ))}
              <DeleteZone
                notifyIsOver={(isOver) => (deleteIsOver.current = isOver)}
              />
            </ul>
          </SortableContext>
        </DndContext>
        <div className="flex items-center gap-2">
          <input
            type={"text"}
            ref={refOpt}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addOption(e.currentTarget.value);
                e.currentTarget.value = "";
              }
              if (e.key === "Escape") {
                e.currentTarget.value = "";
              }
            }}
            className="input-bordered input w-full"
          />
          <button
            onClick={() => {
              if (!refOpt.current) return;
              addOption(refOpt.current.value);
              refOpt.current.value = "";
            }}
          >
            <ButtonIcon
              iconComponent={<i className="bx bx-plus bx-sm" />}
              title={t("pricing.add-option")}
              buttonVariant="Icon-Outlined-Primary"
              buttonSize="md"
            />
          </button>
        </div>
      </div>
      <div>
        <label>{t("pricing.features")}</label>
        <div className="border border-primary p-2 flex flex-wrap gap-2">
          {getListForRole(fields.roleTarget ?? "MEMBER").map((f, idx) => (
            <label
              key={f.value}
              className="label cursor-pointer justify-start gap-4 hover:bg-primary/10"
              htmlFor={f.value}
            >
              <input
                id={f.value}
                type="checkbox"
                className="checkbox-primary checkbox"
                {...register(`features.${idx}`)}
                defaultChecked={false}
              />
              <span className="text-wrap">{t(f.label)}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeleteZone({
  notifyIsOver,
}: {
  notifyIsOver: (isOver: boolean) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: "delete-zone",
  });

  notifyIsOver(isOver);

  return (
    <li
      ref={setNodeRef}
      className={`grid place-items-center rounded border border-secondary py-2 text-secondary ${
        isOver ? "bg-secondary/10" : "bg-base-100"
      }`}
    >
      <i className="bx bx-trash bx-sm" />
    </li>
  );
}

type OptionProps = {
  option: string;
};

const Option = ({ option }: OptionProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: option });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="my-2 flex items-center justify-between gap-4 border border-base-300 bg-base-100 p-2"
    >
      <div className="flex items-center gap-2">
        <i className="bx bx-menu bx-sm text-base-300" />
        <span>{option}</span>
      </div>
    </li>
  );
};

type TFeature = Readonly<{
  value: FeatureEnum;
  label: string;
  internalRole: RoleEnum[];
}>;

const PRICING_FEATURES: TFeature[] = [
  {
    value: "COACH_CERTIFICATION",
    label: "feature.coach-certification",
    internalRole: ["COACH", "MANAGER_COACH"],
  },
  {
    value: "COACH_OFFER",
    label: "feature.coach-offer",
    internalRole: ["COACH", "MANAGER_COACH"],
  },
  {
    value: "COACH_OFFER_COMPANY",
    label: "feature.coach-offer-company",
    internalRole: ["COACH", "MANAGER_COACH"],
  },
  {
    value: "COACH_MEETING",
    label: "feature.coach-meeting",
    internalRole: ["COACH", "MANAGER_COACH"],
  },
  {
    value: "COACH_MARKET_PLACE",
    label: "feature.coach-market-place",
    internalRole: ["COACH", "MANAGER_COACH"],
  },
  {
    value: "MANAGER_MULTI_CLUB",
    label: "feature.manager-multi-club",
    internalRole: ["MANAGER", "MANAGER_COACH"],
  },
  {
    value: "MANAGER_MULTI_SITE",
    label: "feature.manager-multi-site",
    internalRole: ["MANAGER", "MANAGER_COACH"],
  },
  {
    value: "MANAGER_COACH",
    label: "feature.manager-coach",
    internalRole: ["MANAGER", "MANAGER_COACH"],
  },
  {
    value: "MANAGER_EVENT",
    label: "feature.manager-event",
    internalRole: ["MANAGER", "MANAGER_COACH"],
  },
  {
    value: "MANAGER_PLANNING",
    label: "feature.manager-planning",
    internalRole: ["MANAGER", "MANAGER_COACH"],
  },
  {
    value: "MANAGER_ROOM",
    label: "feature.manager-room",
    internalRole: ["MANAGER", "MANAGER_COACH"],
  },
  {
    value: "MANAGER_MARKET_PLACE",
    label: "feature.manager-market-place",
    internalRole: ["MANAGER", "MANAGER_COACH"],
  },
  {
    value: "MANAGER_SHOP",
    label: "feature.manager-shop",
    internalRole: ["MANAGER", "MANAGER_COACH"],
  },
  {
    value: "MANAGER_EMPLOYEES",
    label: "feature.manager-employees",
    internalRole: ["MANAGER", "MANAGER_COACH"],
  },
] as const;

export function useFeature() {
  const t = useTranslations("admin");
  function getLabel(value?: FeatureEnum | null) {
    return (
      PRICING_FEATURES.find((d) => d.value === value)?.label ??
      PRICING_FEATURES?.[0]?.label ??
      ""
    );
  }

  function getName(value?: FeatureEnum | null) {
    return t(getLabel(value));
  }

  function getListForRole(internalRole: RoleEnum) {
    return PRICING_FEATURES.filter((f) =>
      f.internalRole.includes(internalRole),
    );
  }

  return { getName, getListForRole };
}
