"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

import { useRouter } from "next/navigation";

import Modal, { getButtonSize, TModalVariant } from "../ui/modal";
import ButtonIcon, { ButtonSize } from "../ui/buttonIcon";
import { formatDateAsYYYYMMDD } from "@/lib/formatDate";
import Confirmation from "../ui/confirmation";
import { UploadButton } from "../uploadthing";
import { LayoutPage } from "../layoutPage";
import createLink from "@/lib/createLink";
import SimpleForm from "../ui/simpleform";
import { trpc } from "@/lib/trpc/client";
import Spinner from "../ui/spinner";
import { toast } from "@/lib/toast";

type CertificationFormValues = {
  name: string;
  certificationOrganismId: string;
  obtainedIn: Date;
  activityGroups: string[];
  modules: string[];
  manualModule: string;
};

type CreateCertificationProps = {
  userId: string;
};

type OptionItem = {
  id: string;
  selected: boolean;
};

export const CreateCertification = ({ userId }: CreateCertificationProps) => {
  const [organismId, setOrganismId] = useState("");
  const [moduleIds, setModuleIds] = useState<Map<string, OptionItem>>(
    new Map(),
  );
  const [activityIds, setActivityIds] = useState<Map<string, OptionItem>>(
    new Map(),
  );
  const [obtentionDate, setObtentionDate] = useState<Date>(
    new Date(Date.now()),
  );
  const [documentUrl, setDocumentUrl] = useState("");
  const utils = trpc.useUtils();
  const router = useRouter();

  const queryOrganisms = trpc.coachs.getCertificationOrganisms.useQuery();

  useEffect(() => {
    if (queryOrganisms.data) {
      console.log("queryOrganisms.data", queryOrganisms.data);
      if (organismId === "" && queryOrganisms.data.length > 0) {
        const grpId = queryOrganisms.data[0]?.id || "";
        setOrganismId(grpId);
        const mIds = new Map<string, OptionItem>();
        for (const m of queryOrganisms.data?.find((g) => g.id === grpId)
          ?.modules ?? []) {
          mIds.set(m.id, { id: m.id, selected: false });
        }
        setModuleIds(mIds);
      }
    }
  }, [queryOrganisms.data, organismId]);

  const t = useTranslations("coach");
  const addCertification = trpc.coachs.createCertification.useMutation({
    onSuccess() {
      toast.success(t("certification-created"));
      utils.coachs.getCertificationsForCoach.invalidate(userId);
      router.push(createLink({ userId, tab: "certifications" }));
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

  console.log("selectedActivities", Array.from(selectedActivities.values()));

  const onSubmit = async () => {
    addCertification.mutate({
      userId,
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
      buttonIcon={<i className="bx bx-plus bx-sm" />}
      className="w-11/12 max-w-5xl"
    >
      <LayoutPage title={t("create-certification")} variant="section">
        <LayoutPage.Main>
          <LayoutPage.List
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
        </LayoutPage.Main>
      </LayoutPage>
      <hr />
      <form className={`mt-2 grid grid-cols-2 gap-2`}>
        <div className="flex flex-col">
          <label className="required">{t("obtention-date")}</label>
          <input
            type="date"
            value={formatDateAsYYYYMMDD(obtentionDate)}
            onChange={(e) =>
              setObtentionDate(e.target.valueAsDate ?? new Date(Date.now()))
            }
            required
            className="input-bordered input w-full"
          />
        </div>
        <div className="flex flex-col">
          <UploadButton
            endpoint="document"
            onClientUploadComplete={(result) =>
              setDocumentUrl(result[0].ufsUrl)
            }
            className="ut-button:btn-primary ut-button:btn"
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
      <div className="flex flex-wrap gap-2 rounded border border-secondary bg-base-100 p-2">
        {modules?.map((mod) => (
          <button
            key={mod.id}
            className={`btn btn-primary normal-case ${
              moduleIds.get(mod.id)?.selected ? "" : "btn-outline"
            }`}
            onClick={() => onToggle(mod.id)}
          >
            {mod.name}
          </button>
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
      <div className="flex flex-wrap gap-2 rounded border border-secondary bg-base-100 p-2">
        {activities.map((act) => (
          <button
            key={act.id}
            className={`btn btn-primary normal-case ${
              activityIds.get(act.id)?.selected ? "" : "btn-outline"
            }`}
            onClick={() => onToggle(act.id)}
          >
            {act.name}
          </button>
        ))}
      </div>
    </div>
  );
}

type UpdateCertificationProps = {
  userId: string;
  certificationId: string;
  variant?: TModalVariant;
  buttonSize?: ButtonSize;
};

export const UpdateCertification = ({
  certificationId,
  userId,
  variant = "Icon-Outlined-Primary",
  buttonSize = "sm",
}: UpdateCertificationProps) => {
  const utils = trpc.useUtils();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CertificationFormValues>();
  const t = useTranslations("coach");
  const queryCertification =
    trpc.coachs.getCertificationById.useQuery(certificationId);

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
      utils.coachs.getCertificationsForCoach.invalidate(userId);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<CertificationFormValues> = (data) => {
    updateCertification.mutate({ id: certificationId, ...data });
  };

  const onError: SubmitErrorHandler<CertificationFormValues> = (errors) => {
    console.error("errors", errors);
  };

  return (
    <Modal
      title={t("update-certification")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      errors={errors}
      buttonIcon={<i className={`bx bx-edit ${getButtonSize(buttonSize)}`} />}
      variant={variant}
      buttonSize={buttonSize}
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
  userId,
  certificationId,
  variant = "Icon-Outlined-Secondary",
  buttonSize = "sm",
}: UpdateCertificationProps) => {
  const utils = trpc.useUtils();
  const t = useTranslations("coach");

  const deleteCertification = trpc.coachs.deleteCertification.useMutation({
    onSuccess: () => {
      utils.coachs.getCertificationsForCoach.invalidate(userId);
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
      buttonIcon={<i className={`bx bx-trash ${getButtonSize(buttonSize)}`} />}
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
  variant?: TModalVariant;
};

const emptyData: CertificationGroupForm = { name: "", modules: [] };

export const CreateCertificationOrganism = ({
  variant = "Primary",
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
      buttonIcon={<i className="bx bx-plus bx-sm" />}
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
  groupId: string;
  variant?: TModalVariant;
};

export function UpdateCertificationGroup({
  groupId,
  variant = "Icon-Outlined-Primary",
}: UpdateGroupProps) {
  const t = useTranslations("admin");
  const utils = trpc.useUtils();
  const [data, setData] = useState<CertificationGroupForm>(emptyData);
  const queryGroup = trpc.coachs.getCertificationOrganismById.useQuery(groupId);

  useEffect(() => {
    if (queryGroup.data) {
      setData({
        name: queryGroup.data?.name ?? "",
        modules:
          queryGroup.data?.modules.map((m) => ({
            dbId: m.id,
            name: m.name,
            activityIds: m.activities.map((g) => g.id),
          })) ?? [],
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
      id: groupId,
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
      buttonIcon={<i className="bx bx-edit bx-sm" />}
      variant={variant}
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
          groupId={groupId}
        />
      )}
    </Modal>
  );
}

type DeleteGroupProps = {
  groupId: string;
};

export function DeleteCertificationGroup({ groupId }: DeleteGroupProps) {
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
      onConfirm={() => deleteGroup.mutate(groupId)}
      buttonIcon={<i className="bx bx-trash bx-xs" />}
      variant={"Icon-Outlined-Secondary"}
      textConfirmation={t("group-deletion-confirmation")}
      buttonSize="sm"
    />
  );
}

type CertificationGroupFormProps = {
  data: CertificationGroupForm;
  setData: Dispatch<SetStateAction<CertificationGroupForm>>;
  groupId?: string;
};

function CertificationGroupForm({
  data,
  setData,
  groupId,
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
      if (groupId)
        utils.coachs.getCertificationOrganismById.invalidate(groupId);
    },
  });

  function handleDeleteModule(id: number) {
    const mod = data.modules[id];
    if (!mod?.dbId?.startsWith("MOD-") && groupId)
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
    const mods = data.modules;
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
    if (groupId && mod.dbId) {
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
    if (groupId && mod.dbId) {
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
    <div className="flex flex-col gap-2">
      <form className={`grid grid-cols-[auto_1fr] gap-2`}>
        <label htmlFor="name">{t("certification.group-name")}</label>
        <input
          id="name"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.currentTarget.value })}
          type={"text"}
          className="input-bordered input w-full"
        />
        {data.name === "" ? (
          <p className="col-span-2 text-sm text-error">
            {t("certification.name-mandatory")}
          </p>
        ) : null}
      </form>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-2 rounded-md border border-primary p-2">
            <input
              type={"text"}
              ref={refOpt}
              value={moduleName}
              onChange={(e) => {
                setModuleName(e.currentTarget.value);
              }}
              onKeyDown={(e) => handleKeyboard(e.key, e.currentTarget.value)}
              className="input-bordered input w-full"
            />
            <h3>{t("certification.linked-activities")}</h3>
            {agQuery.isLoading ? (
              <Spinner />
            ) : (
              <div className="flex flex-wrap gap-2">
                {agQuery.data?.map((ag) => (
                  <button
                    className={`btn btn-primary btn-sm normal-case ${
                      selectedModule?.activityIds.includes(ag.id) ||
                      activityIds.has(ag.id)
                        ? ""
                        : "btn-outline"
                    }`}
                    key={ag.id}
                    onClick={() => toggleActivityGroup(ag.id)}
                  >
                    {ag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              if (!refOpt.current) return;
              addModule({
                name: refOpt.current.value,
                activityIds:
                  selectedModule?.activityIds ?? Array.from(activityIds),
              });
              handleKeyboard("Escape", "");
            }}
            onKeyDown={(e) =>
              handleKeyboard(e.key, refOpt.current?.value ?? "")
            }
          >
            <ButtonIcon
              iconComponent={
                <i
                  className={`bx ${selectedModule ? "bx-edit" : "bx-plus"} bx-sm`}
                />
              }
              title={t("pricing.add-option")}
              buttonVariant="Icon-Outlined-Primary"
              buttonSize="md"
            />
          </button>
        </div>
        <div>
          <label>{t("certification.modules")}</label>
          {data.modules.length > 0 ? (
            <ul className="menu overflow-hidden rounded border border-base-300">
              {data.modules.map((mod, idx) => (
                <li key={mod.dbId ?? mod.name}>
                  <div
                    className={twMerge(
                      "flex w-full items-center justify-between text-center",
                      moduleId === mod.dbId && "badge badge-primary",
                    )}
                    onClick={() => selectModule(mod.dbId)}
                  >
                    <div className="flex grow items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{mod.name}</span>
                        {mod.activityIds.map((id) => (
                          <span key={id} className="badge badge-primary">
                            {agQuery.data?.find((g) => g.id === id)?.name ??
                              "???"}
                          </span>
                        ))}
                      </div>
                      <button onClick={() => handleDeleteModule(idx)}>
                        <ButtonIcon
                          iconComponent={<i className="bx bx-trash bx-xs" />}
                          title={t("certification.delete-module")}
                          buttonVariant="Icon-Outlined-Secondary"
                          buttonSize="sm"
                        />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
