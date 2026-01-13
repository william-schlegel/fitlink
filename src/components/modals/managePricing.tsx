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
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../ui/shadcn/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/shadcn/select";
import { Textarea } from "../ui/shadcn/textarea";
import { Checkbox } from "../ui/shadcn/checkbox";
import { Input } from "../ui/shadcn/input";

import { Pencil, PlusCircle, Trash, Undo } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/shadcn/input-group";
import { FeatureEnum, RoleEnum } from "@/db/schema/enums";
import Confirmation from "../ui/confirmation";
import ButtonIcon from "../ui/buttonIcon";
import { CSS } from "@dnd-kit/utilities";
import { trpc } from "@/lib/trpc/client";
import { ROLE_LIST } from "@/lib/data";
import Spinner from "../ui/spinner";
import { cn } from "@/lib/utils";
import Modal from "../ui/modal";
import { toast } from "sonner";

import type { ButtonVariant } from "@/components/ui/shadcn/button";

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
  variant?: ButtonVariant;
};

export const CreatePricing = ({ variant = "default" }: CreatePricingProps) => {
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
  variant?: ButtonVariant;
};

export const UpdatePricing = ({
  pricingId,
  variant = "default",
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
        buttonIcon={<Pencil />}
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
  variant = "destructive",
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
      buttonIcon={<Trash />}
      onConfirm={() => {
        deletePricing.mutate(pricingId);
      }}
      variant={variant}
    />
  );
};

export const UndeletePricing = ({
  pricingId,
  variant = "outline",
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
      buttonIcon={<Undo />}
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
      <form>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="pricing-title" className="required">
                {t("pricing.name")}
              </FieldLabel>
              <Input
                id="pricing-title"
                {...register("title", {
                  required: t("pricing.name-mandatory") ?? true,
                })}
                type="text"
              />
              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="pricing-description" className="required">
                {t("pricing.description")}
              </FieldLabel>
              <Textarea
                id="pricing-description"
                {...register("description", {
                  required: t("pricing.description-mandatory") ?? true,
                })}
                rows={4}
              />
              {errors.description && (
                <FieldError>{errors.description.message}</FieldError>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="pricing-role">
                {t("pricing.internalRole")}
              </FieldLabel>
              <Controller
                name="roleTarget"
                control={control}
                defaultValue="MANAGER"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="pricing-role" className="max-w-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_LIST.filter((rl) => rl.value !== "ADMIN").map(
                        (rl) => (
                          <SelectItem key={rl.value} value={rl.value}>
                            {tAuth(`${rl.label}`)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Controller
              name="free"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="pricing-free"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel htmlFor="pricing-free" className="font-normal">
                    {t("pricing.free")}
                  </FieldLabel>
                </Field>
              )}
            />
            {fields.free ? null : (
              <>
                <Field>
                  <FieldLabel htmlFor="pricing-monthly">
                    {t("pricing.monthly")}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="pricing-monthly"
                      {...register("monthly", { valueAsNumber: true })}
                      type="number"
                    />
                    <InputGroupAddon align="inline-end">
                      {t("pricing.euro-per-month")}
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
                <Field>
                  <FieldLabel htmlFor="pricing-yearly">
                    {t("pricing.yearly")}
                  </FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      id="pricing-yearly"
                      {...register("yearly", { valueAsNumber: true })}
                      type="number"
                    />
                    <InputGroupAddon align="inline-end">
                      {t("pricing.euro-per-year")}
                    </InputGroupAddon>
                  </InputGroup>
                </Field>
              </>
            )}
            <Controller
              name="highlighted"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="pricing-highlighted"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldLabel
                    htmlFor="pricing-highlighted"
                    className="font-normal"
                  >
                    {t("pricing.highlighted")}
                  </FieldLabel>
                </Field>
              )}
            />
          </FieldGroup>
        </FieldSet>
      </form>
      <FieldSet className="border border-border p-2">
        <FieldLegend>{t("pricing.options")}</FieldLegend>
        <FieldGroup>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fields.options ?? []}
              strategy={verticalListSortingStrategy}
            >
              <ul>
                {fields.options?.map((option, idx) => (
                  <Option key={idx} option={option} />
                ))}
                <DeleteZone
                  notifyIsOver={(isOver) => (deleteIsOver.current = isOver)}
                />
              </ul>
            </SortableContext>
          </DndContext>
        </FieldGroup>
        <div className="flex items-center gap-2">
          <Field>
            <FieldLabel htmlFor="pricing-option">
              {t("pricing.option")}
            </FieldLabel>
            <FieldContent>
              <InputGroup>
                <InputGroupInput
                  type="text"
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
                  className="flex-1"
                />
                <InputGroupButton
                  title={t("pricing.add-option")}
                  onClick={() => {
                    if (!refOpt.current) return;
                    addOption(refOpt.current.value);
                    refOpt.current.value = "";
                  }}
                >
                  <PlusCircle className="size-4 stroke-foreground" />
                </InputGroupButton>
              </InputGroup>
            </FieldContent>
          </Field>
        </div>
      </FieldSet>
      <FieldSet className="border border-border p-2">
        <FieldLegend>{t("pricing.features")}</FieldLegend>
        <FieldGroup>
          {getListForRole(fields.roleTarget ?? "MEMBER").map((f, idx) => (
            <Field orientation="horizontal" key={f.value}>
              <Checkbox
                id={f.value}
                {...register(`features.${idx}`)}
                defaultChecked={false}
              />
              <FieldLabel htmlFor={f.value} className="font-normal">
                {t(f.label)}
              </FieldLabel>
            </Field>
          ))}
        </FieldGroup>
      </FieldSet>
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
      className={cn(
        "flex items-center justify-center rounded border border-destructive py-2 text-destructive bg-card",
        isOver && "bg-destructive/10",
      )}
    >
      <Trash className="size-8 stroke-destructive" />
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
      className="my-2 flex items-center justify-between gap-4 border border-border bg-card p-2"
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
