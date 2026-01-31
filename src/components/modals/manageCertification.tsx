"use client";

import { Edit, Pencil, Plus, Trash } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react";
import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";

import { toast } from "sonner";

import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Spinner } from "@/components/ui/shadcn/spinner";
import createLink from "@/lib/createLink";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { LayoutPage, LayoutPageList, LayoutPageMain } from "../layoutPage";
import Confirmation from "../ui/confirmation";
import Modal from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import { UploadButton } from "../uploadthing";

import { Field, FieldError, FieldLabel } from "../ui/shadcn";

import type { ButtonSize, ButtonVariant } from "@/components/ui/shadcn/button";
import { UserId } from "@/db/types";

type CertificationFormValues = {
  name: string;
  certificationOrganismId: string;
  obtainedIn: Date;
  activityGroups: string[];
  modules: string[];
  manualModule: string;
};

type CreateCertificationProps = {
  coachUserId: string;
};

type OptionItem = {
  id: string;
  selected: boolean;
};

export const CreateCertification = ({
  coachUserId,
}: CreateCertificationProps) => {
  const [organismId, setOrganismId] = useState("");
  const [moduleIds, setModuleIds] = useState<Map<string, OptionItem>>(
    new Map(),
  );
  const [activityIds, setActivityIds] = useState<Map<string, OptionItem>>(
    new Map(),
  );
  const [obtentionDate, setObtentionDate] = useState<Date>(new Date());
  const [documentUrl, setDocumentUrl] = useState("");
  const utils = trpc.useUtils();
  const router = useRouter();

  const queryOrganisms = trpc.coachs.getCertificationOrganisms.useQuery();

  useEffect(() => {
    if (queryOrganisms.data) {
      if (organismId === "" && queryOrganisms.data.length > 0) {
        const grpId = queryOrganisms.data[0]?.id || "";
        const mIds = new Map<string, OptionItem>();
        for (const m of queryOrganisms.data?.find((g) => g.id === grpId)
          ?.modules ?? []) {
          mIds.set(m.id, { id: m.id, selected: false });
        }
        startTransition(() => {
          setOrganismId(grpId);
          setModuleIds(mIds);
        });
      }
    }
  }, [queryOrganisms.data, organismId]);

  const t = useTranslations("coach");
  const addCertification = trpc.coachs.createCertification.useMutation({
    onSuccess() {
      toast.success(t("certification-created"));
      utils.coachs.getCertificationsForCoach.invalidate({
        coachUserId,
      });
      router.push(createLink({ userId: coachUserId, tab: "certifications" }));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const selectedGroup = queryOrganisms.data?.find((g) => g.id === organismId);
  const selectedActivities = new Map();

  for (const a of selectedGroup?.modules
    .filter((m) => moduleIds.get(m.id)?.selected)
    .flatMap((m) => m.activities.map((a) => ({ ...a }))) ?? []) {
    selectedActivities.set(a.id, a);
  }

  const onSubmit = async () => {
    addCertification.mutate({
      coachUserId,
      name: selectedGroup?.name ?? "?",
      obtainedIn: obtentionDate,
      activityGroups: Array.from(activityIds.values())
        .filter((a) => a.selected)
        .map((a) => a.id),
      modules: Array.from(moduleIds.values())
        .filter((m) => m.selected)
        .map((m) => m.id),
      documentUrl,
    });
  };

  const selectGroup = (grpId: string) => {
    setOrganismId(grpId);
    const mIds = new Map<string, OptionItem>();
    for (const m of queryOrganisms.data?.find((g) => g.id === grpId)?.modules ??
      []) {
      mIds.set(m.id, { id: m.id, selected: false });
    }
    setModuleIds(mIds);
  };

  const toggleModule = (moduleId: string) => {
    const mods = moduleIds;
    const mod = mods.get(moduleId);
    if (mod) {
      mod.selected = !mod.selected;
      setModuleIds(new Map(mods));
      const selectedModules =
        selectedGroup?.modules.filter((m) => mods.get(m.id)?.selected) ?? [];
      const activities = Array.from(
        new Set(
          selectedModules.map((m) => m.activities.map((a) => a.id)).flat(2),
        ) ?? [],
      );
      const aIds = new Map<string, OptionItem>();
      for (const a of activities) {
        aIds.set(a, { id: a, selected: false });
      }
      setActivityIds(aIds);
    }
  };

  const toggleActivity = (activityId: string) => {
    const act = activityIds.get(activityId);
    if (act) {
      act.selected = !act.selected;
      setActivityIds(new Map(activityIds));
    }
  };

  const organismList =
    queryOrganisms.data?.map((group) => ({
      id: group.id,
      name: group.name,
      onClick: () => selectGroup(group.id),
    })) ?? [];

  return (
    <Modal
      title={t("create-certification")}
      handleSubmit={onSubmit}
      submitButtonText={t("save-certifications")}
      buttonIcon={<Plus className="h-5 w-5" />}
      className="w-11/12 max-w-5xl"
    >
      <LayoutPage title={t("create-certification")} variant="section">
        <LayoutPageMain>
          <LayoutPageList
            list={organismList}
            itemId={organismId}
            noItemsText={t("no-organisms")}
          />

          <div>
            <ModuleSelector
              modules={selectedGroup?.modules}
              moduleIds={moduleIds}
              onToggle={toggleModule}
              title={t("modules")}
            />
            <ActivitySelector
              activities={Array.from(selectedActivities.values())}
              activityIds={activityIds}
              onToggle={toggleActivity}
              title={t("activities")}
            />
          </div>
        </LayoutPageMain>
      </LayoutPage>
      <hr className="my-4" />
      <form className="mt-2 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label className="after:content-['*'] after:text-error after:ml-0.5">
            {t("obtention-date")}
          </Label>
          <Input
            type="date"
            value={formatDateAsYYYYMMDD(obtentionDate)}
            onChange={(e) =>
              setObtentionDate(e.target.valueAsDate ?? new Date(Date.now()))
            }
            required
          />
        </div>
        <div className="flex flex-col">
          <UploadButton
            endpoint="document"
            onClientUploadComplete={(result) =>
              setDocumentUrl(result[0].ufsUrl)
            }
            buttonText={t("document")}
          />
        </div>
      </form>
    </Modal>
  );
};

type ModuleSelectorProps = {
  modules?: Array<{ id: string; name: string }>;
  moduleIds: Map<string, OptionItem>;
  onToggle: (moduleId: string) => void;
  title: string;
};

function ModuleSelector({
  modules,
  moduleIds,
  onToggle,
  title,
}: ModuleSelectorProps) {
  return (
    <div>
      <h4>{title}</h4>
      <div className="flex flex-wrap gap-2 rounded-md border border-secondary bg-card p-2">
        {modules?.map((mod) => (
          <Button
            key={mod.id}
            variant={moduleIds.get(mod.id)?.selected ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(mod.id)}
          >
            {mod.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

type ActivitySelectorProps = {
  activities: Array<{ id: string; name: string }>;
  activityIds: Map<string, OptionItem>;
  onToggle: (activityId: string) => void;
  title: string;
};

function ActivitySelector({
  activities,
  activityIds,
  onToggle,
  title,
}: ActivitySelectorProps) {
  return (
    <div>
      <h4>{title}</h4>
      <div className="flex flex-wrap gap-2 rounded-md border border-secondary bg-card p-2">
        {activities.map((act) => (
          <Button
            key={act.id}
            variant={activityIds.get(act.id)?.selected ? "default" : "outline"}
            size="sm"
            onClick={() => onToggle(act.id)}
          >
            {act.name}
          </Button>
        ))}
      </div>
    </div>
  );
}

type UpdateCertificationProps = {
  coachUserId: UserId;
  certificationId: string;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export const UpdateCertification = ({
  certificationId,
  coachUserId,
  variant = "outline",
  buttonSize = "icon",
}: UpdateCertificationProps) => {
  const utils = trpc.useUtils();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CertificationFormValues>();
  const t = useTranslations("coach");
  const queryCertification = trpc.coachs.getCertificationById.useQuery({
    certificationId,
  });

  useEffect(() => {
    if (queryCertification.data) {
      if (queryCertification.data) {
        reset({ name: queryCertification.data?.name });
      }
    }
  }, [queryCertification.data, reset]);
  const updateCertification = trpc.coachs.updateCertification.useMutation({
    onSuccess: () => {
      toast.success(t("certification-updated"));
      utils.coachs.getCertificationsForCoach.invalidate({
        coachUserId,
      });
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<CertificationFormValues> = (data) => {
    updateCertification.mutate({
      coachUserId,
      id: certificationId,
      ...data,
    });
  };

  const onError: SubmitErrorHandler<CertificationFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <Modal
      title={t("update-certification")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      errors={errors}
      buttonIcon={<Pencil />}
      variant={variant}
      buttonSize={buttonSize}
      size="sm"
    >
      <h3>
        {t("update-certification")} {queryCertification.data?.name}
      </h3>
      <SimpleForm
        errors={errors}
        register={register}
        isLoading={queryCertification.isLoading}
        fields={[
          {
            label: t("certification-name"),
            name: "name",
            required: t("name-mandatory"),
          },
        ]}
      />
    </Modal>
  );
};

export const DeleteCertification = ({
  coachUserId,
  certificationId,
  variant = "destructive",
  buttonSize = "icon",
}: UpdateCertificationProps) => {
  const utils = trpc.useUtils();
  const t = useTranslations("coach");

  const deleteCertification = trpc.coachs.deleteCertification.useMutation({
    onSuccess: () => {
      utils.coachs.getCertificationsForCoach.invalidate({ coachUserId });
      toast.success(t("certification-deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("certification-deletion-message")}
      title={t("certification-deletion")}
      onConfirm={() => {
        deleteCertification.mutate(certificationId);
      }}
      buttonIcon={<Trash />}
      variant={variant}
      buttonSize={buttonSize}
      textConfirmation={t("certification-confirmation")}
    />
  );
};

type CertificationModuleForm = {
  dbId?: string;
  name: string;
  activityIds: string[];
};

type CertificationGroupForm = {
  name: string;
  modules: CertificationModuleForm[];
};

type CreateCertificationGroupProps = {
  variant?: ButtonVariant;
};

const emptyData: CertificationGroupForm = { name: "", modules: [] };

export const CreateCertificationOrganism = ({
  variant = "default",
}: CreateCertificationGroupProps) => {
  const t = useTranslations("admin");
  const utils = trpc.useUtils();
  const [data, setData] = useState<CertificationGroupForm>(emptyData);
  const router = useRouter();
  const createGroup = trpc.coachs.createOrganism.useMutation({
    onSuccess: (data) => {
      utils.coachs.getCertificationOrganisms.invalidate();
      setData(emptyData);
      toast.success(t("certification.group-created"));
      router.push(createLink({ cgId: data[0].id }));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit = () => {
    if (!data) return;
    createGroup.mutate({
      name: data.name,
      modules: data.modules.map((m) => ({
        name: m.name,
        activityIds: m.activityIds,
      })),
    });
  };

  return (
    <Modal
      title={t("certification.new-group")}
      buttonIcon={<Plus />}
      variant={variant}
      className="w-10/12 max-w-3xl"
      handleSubmit={onSubmit}
    >
      <h3>{t("certification.new-group")}</h3>
      <CertificationGroupForm data={data} setData={setData} />
    </Modal>
  );
};

type UpdateGroupProps = {
  certificationOrganismId: string;
  variant?: ButtonVariant;
  buttonSize?: ButtonSize;
};

export function UpdateCertificationGroup({
  certificationOrganismId,
  variant = "outline",
  buttonSize = "icon",
}: UpdateGroupProps) {
  const t = useTranslations("admin");
  const utils = trpc.useUtils();
  const [data, setData] = useState<CertificationGroupForm>(emptyData);
  const queryGroup = trpc.coachs.getCertificationOrganismById.useQuery({
    certificationOrganismId,
  });

  useEffect(() => {
    if (queryGroup.data) {
      const groupData = queryGroup.data;
      startTransition(() => {
        setData({
          name: groupData.name ?? "",
          modules:
            groupData.modules.map((m) => ({
              dbId: m.id,
              name: m.name,
              activityIds: m.activities.map((g) => g.id),
            })) ?? [],
        });
      });
    }
  }, [queryGroup.data]);

  const updateGroup = trpc.coachs.updateOrganism.useMutation({
    onSuccess: () => {
      utils.coachs.getCertificationOrganisms.invalidate();
      setData(emptyData);
      toast.success(t("certification.group-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit = () => {
    updateGroup.mutate({
      id: certificationOrganismId,
      name: data?.name ?? "",
      modules: data?.modules.map((m) => ({
        name: m.name,
        activityIds: m.activityIds,
      })),
    });
  };

  return (
    <Modal
      title={t("certification.update-group")}
      buttonIcon={<Pencil />}
      variant={variant}
      buttonSize={buttonSize}
      className="w-10/12 max-w-3xl"
      handleSubmit={onSubmit}
    >
      <h3>{t("certification.update-group")}</h3>
      {queryGroup.isLoading ? (
        <Spinner />
      ) : (
        <CertificationGroupForm
          data={data}
          setData={setData}
          organismId={certificationOrganismId}
        />
      )}
    </Modal>
  );
}

type DeleteGroupProps = {
  certificationOrganismId: string;
};

export function DeleteCertificationGroup({
  certificationOrganismId,
}: DeleteGroupProps) {
  const utils = trpc.useUtils();
  const deleteGroup = trpc.coachs.deleteOrganism.useMutation({
    onSuccess() {
      utils.coachs.getCertificationOrganisms.invalidate();
      toast.success(t("certification.group-deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const t = useTranslations("coach");

  return (
    <Confirmation
      title={t("group-deletion")}
      message={t("group-deletion-message")}
      onConfirm={() =>
        deleteGroup.mutate({ organismId: certificationOrganismId })
      }
      buttonIcon={<Trash />}
      variant="destructive"
      textConfirmation={t("group-deletion-confirmation")}
      buttonSize="icon"
    />
  );
}

type CertificationGroupFormProps = {
  data: CertificationGroupForm;
  setData: Dispatch<SetStateAction<CertificationGroupForm>>;
  organismId?: string;
};

function CertificationGroupForm({
  data,
  setData,
  organismId,
}: CertificationGroupFormProps) {
  const t = useTranslations("admin");
  const refOpt = useRef<HTMLInputElement>(null);
  const deleteModule = trpc.coachs.deleteModule.useMutation();
  const agQuery = trpc.activities.getAllActivityGroups.useQuery();
  const [moduleId, setModuleId] = useState("");
  const [activityIds, setActivityIds] = useState(new Set<string>());
  const [moduleName, setModuleName] = useState("");
  const utils = trpc.useUtils();

  const selectedModule = data.modules.find((m) => m.dbId === moduleId);
  const addActivities = trpc.coachs.updateActivitiesForModule.useMutation({
    onSuccess() {
      if (organismId)
        utils.coachs.getCertificationOrganismById.invalidate({
          certificationOrganismId: organismId,
        });
    },
  });

  function handleDeleteModule(id: number) {
    const mod = data.modules[id];
    if (!mod?.dbId?.startsWith("MOD-") && organismId)
      deleteModule.mutate(mod?.dbId ?? "");

    const mods = data.modules.filter((_, idx) => idx !== id);
    setData({ ...data, modules: mods });
  }

  function selectModule(dbId?: string) {
    setModuleId(dbId ?? "");
    const mod = data.modules.find((m) => m.dbId === dbId);
    setActivityIds(new Set(mod?.activityIds));
    setModuleName(mod?.name ?? "");
  }

  function addModule(mod?: CertificationModuleForm) {
    if (!mod) return;
    const mods = [...data.modules];
    if (!selectedModule) {
      mod.dbId = `MOD-${data.modules.length + 1}`;
      mods.push(mod);
    } else {
      const modIdx = mods.findIndex((m) => m.dbId === selectedModule.dbId);
      if (modIdx >= 0) mods[modIdx] = mod;
    }
    setData({ ...data, modules: mods });
    setActivityIds(new Set());
    setModuleName("");
    setModuleId("");
  }

  function addActivityId(activityId: string) {
    const mod = data.modules.find((m) => m.dbId === moduleId);
    if (!mod) {
      activityIds.add(activityId);
      setActivityIds(new Set(activityIds));
      return;
    }
    mod.activityIds.push(activityId);
    setData({ ...data });
    if (organismId && mod.dbId) {
      addActivities.mutate({
        moduleId: mod.dbId,
        activityIds: mod.activityIds,
      });
    }
  }

  function removeActivityId(activityId: string) {
    const mod = data.modules.find((m) => m.dbId === moduleId);
    if (!mod) {
      activityIds.delete(activityId);
      setActivityIds(new Set(activityIds));
      return;
    }
    mod.activityIds = mod.activityIds.filter((a) => a !== activityId);
    setData({ ...data });
    if (organismId && mod.dbId) {
      addActivities.mutate({
        moduleId: mod.dbId,
        activityIds: mod.activityIds,
      });
    }
  }

  function handleKeyboard(key: string, name: string) {
    if (key === "Enter") {
      addModule({
        name,
        activityIds: selectedModule?.activityIds ?? Array.from(activityIds),
      });
      if (refOpt.current) refOpt.current.value = "";
    }
    if (key === "Escape") {
      if (refOpt.current) refOpt.current.value = "";
      setActivityIds(new Set());
    }
  }

  const toggleActivityGroup = (id: string) => {
    if (selectedModule?.activityIds) {
      const ids = selectedModule?.activityIds ?? [];
      if (ids.includes(id)) removeActivityId(id);
      else addActivityId(id);
    } else {
      const ids = activityIds;
      if (ids.has(id)) removeActivityId(id);
      else addActivityId(id);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <div className="flex flex-row items-center gap-2">
          <FieldLabel htmlFor="name">
            {t("certification.group-name")}
          </FieldLabel>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.currentTarget.value })}
            type="text"
            required
          />
        </div>

        {data.name === "" && (
          <FieldError>{t("certification.name-mandatory")}</FieldError>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-col gap-2 rounded-md border border-primary p-4 w-full">
            <Input
              type="text"
              ref={refOpt}
              value={moduleName}
              onChange={(e) => {
                setModuleName(e.currentTarget.value);
              }}
              onKeyDown={(e) => handleKeyboard(e.key, e.currentTarget.value)}
            />
            <h4 className="text-sm font-medium">
              {t("certification.linked-activities")}
            </h4>
            {agQuery.isLoading ? (
              <Spinner />
            ) : (
              <div className="flex flex-wrap gap-2">
                {agQuery.data?.map((ag) => (
                  <Button
                    key={ag.id}
                    variant={
                      selectedModule?.activityIds.includes(ag.id) ||
                      activityIds.has(ag.id)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => toggleActivityGroup(ag.id)}
                  >
                    {ag.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (!refOpt.current) return;
              addModule({
                name: refOpt.current.value,
                activityIds:
                  selectedModule?.activityIds ?? Array.from(activityIds),
              });
              handleKeyboard("Escape", "");
            }}
            className="gap-2"
          >
            {selectedModule ? (
              <Edit className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {t("pricing.add-option")}
          </Button>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">
            {t("certification.modules")}
          </h4>
          {data.modules.length > 0 && (
            <ul className="overflow-hidden rounded-md border border-border w-full">
              {data.modules.map((mod, idx) => (
                <li key={mod.dbId ?? mod.name}>
                  <div
                    className={cn(
                      "flex w-full items-center justify-between p-3 cursor-pointer hover:bg-muted",
                      moduleId === mod.dbId &&
                        "border border-primary bg-primary/10",
                    )}
                    onClick={() => selectModule(mod.dbId)}
                  >
                    <div className="flex grow items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{mod.name}</span>
                        {mod.activityIds.map((id) => (
                          <Badge key={id} variant="default">
                            {agQuery.data?.find((g) => g.id === id)?.name ??
                              "???"}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteModule(idx);
                        }}
                      >
                        <Trash className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
