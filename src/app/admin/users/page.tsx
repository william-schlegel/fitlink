import { getTranslations } from "next-intl/server";

import {
  LayoutPage,
  LayoutPageContent,
  LayoutPageList,
  LayoutPageMain,
} from "@/components/layoutPage";
import Pagination from "@/components/ui/pagination";
import { BadgeVariant } from "@/components/ui/shadcn";
import { UserId } from "@/db/types";
import { getActualUser } from "@/lib/auth/server";
import { getAllUsers } from "@/server/api/routers/users";
import UserContent from "./userContent";
import UserFilter, { TUserFilter } from "./userFilter";

const PER_PAGE = 20;

export default async function UserManagement({
  searchParams,
}: {
  searchParams: Promise<{ filter: string; page: number; userId: UserId }>;
}) {
  const { filter = "{}", page = 0, userId = "" } = await searchParams;
  const tCommon = await getTranslations("common");
  const t = await getTranslations("admin");
  const user = await getActualUser();
  if (user?.internalRole !== "ADMIN") return <div>{t("admin-only")}</div>;
  const parsedFilter = JSON.parse(filter) as TUserFilter;

  const userQuery = await getAllUsers({
    filter: parsedFilter,
    skip: page * PER_PAGE,
    take: PER_PAGE,
  });

  const userList = userQuery.users.map((user) => ({
    id: user.id,
    name: user.name,
    link: `/admin/users?userId=${user.id}`,
    badgeVariant:
      user.internalRole === "MEMBER" ? "info" : ("warning" as BadgeVariant),
    badgeText: tCommon(`roles.${user.internalRole ?? "MEMBER"}`),
  }));

  return (
    <LayoutPage title={t("user.manage-users")}>
      <LayoutPageMain>
        <LayoutPageList
          list={userList}
          itemId={userId}
          noItemsText={t("user.no-users")}
        >
          <UserFilter filter={parsedFilter} />

          <Pagination
            actualPage={page}
            count={userQuery.userCount ?? 0}
            perPage={PER_PAGE}
          />
        </LayoutPageList>

        <LayoutPageContent>
          {userId === "" ? null : <UserContent userId={userId} />}
        </LayoutPageContent>
      </LayoutPageMain>
    </LayoutPage>
  );
}
