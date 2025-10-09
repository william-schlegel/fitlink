"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import {
  DeleteSubscription,
  UpdateSubscription,
  useSubscriptionMode,
  useSubscriptionRestriction,
} from "@/components/modals/manageSubscription";
import {
  SubscriptionModeEnum,
  SubscriptionRestrictionEnum,
} from "@/db/schema/enums";
import { useDisplaySubscriptionInfo } from "@/lib/useDisplaySubscription";
import { formatDateLocalized } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatNumber";
import Spinner from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc/client";
import { isCUID } from "@/lib/utils";
import { toast } from "@/lib/toast";

type SubscriptionContentProps = {
  clubId: string;
  subscriptionId: string;
  userId: string;
};

export function SubscriptionContent({
  clubId,
  userId,
  subscriptionId,
}: SubscriptionContentProps) {
  const t = useTranslations("club");

  const { getModeName } = useSubscriptionMode();
  const { getRestrictionName } = useSubscriptionRestriction();
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedActivityGroups, setSelectedActivityGroups] = useState<
    string[]
  >([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const subQuery = trpc.subscriptions.getSubscriptionById.useQuery(
    subscriptionId,
    {
      enabled: isCUID(subscriptionId),
    },
  );
  useEffect(() => {
    if (subQuery.data) {
      setSelectedSites(subQuery.data?.sites.map((s) => s.siteId) ?? []);
      setSelectedRooms(subQuery.data?.rooms.map((s) => s.roomId) ?? []);
      setSelectedActivityGroups(
        subQuery.data?.activitieGroups.map((s) => s.activityGroupId) ?? [],
      );
      setSelectedActivities(
        subQuery.data?.activities.map((s) => s.activityId) ?? [],
      );
    }
  }, [subQuery.data]);

  const { info } = useDisplaySubscriptionInfo(
    subQuery.data?.mode ?? "ALL_INCLUSIVE",
    subQuery.data?.restriction ?? "CLUB",
    selectedActivityGroups,
    selectedActivities,
    selectedSites,
    selectedRooms,
  );

  const userCount = subQuery.data?.users.length ?? 0;

  const undateSelection =
    trpc.subscriptions.updateSubscriptionSelection.useMutation({
      onSuccess() {
        toast.success(t("subscription.selection-success"));
      },
      onError(error) {
        toast.error(error.message);
      },
    });

  function handleSaveSelection() {
    undateSelection.mutate({
      subscriptionId,
      activities: selectedActivities,
      activityGroups: selectedActivityGroups,
      sites: selectedSites,
      rooms: selectedRooms,
    });
  }

  function handleSelectSite(id: string) {
    if (selectedSites.includes(id))
      setSelectedSites((sel) => sel.filter((s) => s !== id));
    else setSelectedSites((sel) => sel.concat(id));
  }
  function handleSelectRoom(id: string) {
    if (selectedRooms.includes(id))
      setSelectedRooms((sel) => sel.filter((s) => s !== id));
    else setSelectedRooms((sel) => sel.concat(id));
  }
  function handleSelectActivityGroup(id: string) {
    if (selectedActivityGroups.includes(id))
      setSelectedActivityGroups((sel) => sel.filter((s) => s !== id));
    else setSelectedActivityGroups((sel) => sel.concat(id));
  }
  function handleSelectActivity(id: string) {
    if (selectedActivities.includes(id))
      setSelectedActivities((sel) => sel.filter((s) => s !== id));
    else setSelectedActivities((sel) => sel.concat(id));
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2>{subQuery.data?.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <UpdateSubscription clubId={clubId} subscriptionId={subscriptionId} />
          <DeleteSubscription clubId={clubId} subscriptionId={subscriptionId} />
        </div>
      </div>
      <section className="flex items-start gap-2">
        <div className="stats w-fit shadow">
          <div className="stat w-fit">
            <div className="stat-figure text-primary">
              <i className="bx bx-user bx-lg" />
            </div>
            <div className="stat-title">
              {t("subscription.users", { count: userCount })}
            </div>
            <div className="stat-value text-primary">{userCount}</div>
          </div>
        </div>
        <div className="grid flex-1 self-stretch rounded border border-primary p-2 md:grid-cols-2 lg:grid-cols-4">
          <DataCell
            label={t("subscription.start-date")}
            value={formatDateLocalized(subQuery.data?.startDate)}
          />
          <DataCell
            label={t("subscription.description")}
            value={subQuery.data?.description}
          />
          <DataCell
            label={t("subscription.selected-mode")}
            value={getModeName(subQuery.data?.mode)}
          />
          <DataCell
            label={t("subscription.selected-restriction")}
            value={getRestrictionName(subQuery.data?.restriction)}
          />
          <DataCell
            label={t("subscription.monthly")}
            value={formatMoney(subQuery.data?.monthly)}
          />
          <DataCell
            label={t("subscription.yearly")}
            value={formatMoney(subQuery.data?.yearly)}
          />
          <DataCell
            label={t("subscription.inscription-fee")}
            value={formatMoney(subQuery.data?.inscriptionFee)}
          />
          <DataCell
            label={t("subscription.cancelation-fee")}
            value={formatMoney(subQuery.data?.cancelationFee)}
          />
        </div>
      </section>
      <section className="flex-1">
        <h3>{t("subscription.subscription-content")}</h3>
        <div className="flex gap-2">
          <div className="rounded border border-secondary pb-2">
            <SelectRestriction
              clubId={clubId}
              userId={userId}
              restriction={subQuery.data?.restriction ?? "CLUB"}
              siteIds={selectedSites}
              roomIds={selectedRooms}
              onSelectSite={(id) => handleSelectSite(id)}
              onSelectRoom={(id) => handleSelectRoom(id)}
            />
          </div>
          <div className="rounded border border-secondary pb-2">
            <SelectDataForMode
              clubId={clubId}
              restriction={subQuery.data?.restriction ?? "CLUB"}
              mode={subQuery.data?.mode ?? "ALL_INCLUSIVE"}
              siteIds={selectedSites}
              roomIds={selectedRooms}
              activityGroupIds={selectedActivityGroups}
              activityIds={selectedActivities}
              onSelectActivityGroup={(id) => handleSelectActivityGroup(id)}
              onSelectActivity={(id) => handleSelectActivity(id)}
            />
          </div>
          <div className="flex-1 rounded border border-primary p-4">
            <div className="alert alert-info justify-center font-bold">
              {info}
            </div>
            <button
              className="btn btn-primary btn-block mt-4"
              onClick={handleSaveSelection}
            >
              {t("subscription.validate-selection")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

type SelectRestrictionProps = {
  clubId: string;
  userId: string;
  restriction: SubscriptionRestrictionEnum;
  siteIds: string[];
  roomIds: string[];
  onSelectSite: (siteId: string) => void;
  onSelectRoom: (roomId: string) => void;
};
function SelectRestriction({
  clubId,
  userId,
  restriction,
  siteIds,
  roomIds,
  onSelectSite,
  onSelectRoom,
}: SelectRestrictionProps) {
  const club = trpc.clubs.getClubById.useQuery({ clubId, userId });
  const t = useTranslations("club");

  if (club.isLoading) return <Spinner />;
  console.log("clubId :>> ", clubId);
  console.log("club?.data :>> ", club?.data);
  return (
    <div className="flex flex-col gap-1">
      <span className="bg-secondary p-2 text-center text-secondary-content">
        {t("subscription.club")}&nbsp;{club.data?.name}
      </span>
      {restriction === "SITE"
        ? club.data?.sites?.map((site) => (
            <SelectableItem
              key={site.id}
              state={siteIds.includes(site.id)}
              item={{ id: site.id, name: site.name }}
              onClick={(id) => onSelectSite(id)}
            />
          ))
        : null}
      {restriction === "ROOM"
        ? club.data?.sites?.map((site) => (
            <div
              key={site.id}
              className="mx-1 flex flex-col gap-1 rounded border border-primary pb-2"
            >
              <span className="bg-primary p-2 text-center text-primary-content">
                {site.name}
              </span>

              {site.rooms.map((room) => (
                <SelectableItem
                  key={room.id}
                  state={roomIds.includes(room.id)}
                  item={{ id: room.id, name: room.name }}
                  onClick={(id) => onSelectRoom(id)}
                />
              ))}
            </div>
          ))
        : null}
    </div>
  );
}

type SelectableItemProps = {
  state: boolean;
  item: { id: string; name: string };
  onClick: (id: string) => void;
};

function SelectableItem({ state, item, onClick }: SelectableItemProps) {
  return (
    <button
      className="btn-outline btn mx-1 mt-1 flex items-center gap-4"
      onClick={() => onClick(item.id)}
    >
      <i className={`bx ${state ? "bx-check-square" : "bx-checkbox"} bx-sm`} />
      <span className="flex-1">{item.name}</span>
    </button>
  );
}

type SelectDataForModeProps = {
  clubId: string;
  siteIds: string[];
  roomIds: string[];
  activityGroupIds: string[];
  activityIds: string[];
  restriction: SubscriptionRestrictionEnum;
  mode: SubscriptionModeEnum;
  onSelectActivityGroup: (id: string) => void;
  onSelectActivity: (id: string) => void;
};

function SelectDataForMode({
  clubId,
  siteIds,
  roomIds,
  activityGroupIds,
  activityIds,
  restriction,
  mode,
  onSelectActivity,
  onSelectActivityGroup,
}: SelectDataForModeProps) {
  const t = useTranslations("club");
  const choices = trpc.subscriptions.getPossibleChoice.useQuery({
    clubId,
    mode,
    restriction,
    roomIds,
    siteIds,
  });

  if (choices.isLoading) return <Spinner />;
  if (!choices.data?.activityGroups && !choices.data?.activities) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="bg-secondary p-2 text-center text-secondary-content">
        {t(
          mode === "ACTIVITY_GROUP"
            ? "subscription.mode.activity-group"
            : "subscription.mode.activity",
        )}
      </span>
      {choices.data?.activityGroups
        ? choices.data.activityGroups.map((ag) => (
            <SelectableItem
              key={ag.id}
              state={activityGroupIds.includes(ag.id)}
              item={{ id: ag.id, name: ag.name }}
              onClick={(id) => onSelectActivityGroup(id)}
            />
          ))
        : null}
      {choices.data?.activities
        ? choices.data.activities.map((ag) => (
            <SelectableItem
              key={ag.id}
              state={activityIds.includes(ag.id!)}
              item={{ id: ag.id!, name: ag.name! }}
              onClick={(id) => onSelectActivity(id)}
            />
          ))
        : null}
    </div>
  );
}

function DataCell({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-x-2">
      <span className="font-semibold text-primary">{label}</span>
      <span>{value ?? ""}</span>
    </div>
  );
}
