import { getTranslations } from "next-intl/server";

import { getAllUsers } from "@/server/api/routers/users";
import { LayoutPage } from "@/components/layoutPage";
import Pagination from "@/components/ui/pagination";
import { getActualUser } from "@/lib/auth/server";
import { TUserFilter } from "./userFilter";
import UserContent from "./userContent";
import UserFilter from "./userFilter";

const PER_PAGE = 20;

export default async function UserManagement({
  searchParams,
}: {
  searchParams: Promise<{ filter: string; page: number; userId: string }>;
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
    badgeColor:
      user.internalRole === "MEMBER" ? "badge-secondary" : "badge-accent",
    badgeText: tCommon(`roles.${user.internalRole ?? "MEMBER"}`),
  }));

  return (
    <LayoutPage title={t("user.manage-users")}>
      <LayoutPage.Main>
        <LayoutPage.List
          list={userList}
          itemId={userId}
          noItemsText={t("user.no-users")}
        >
          <div className="collapse-arrow rounded-box collapse border border-base-300 bg-base-100">
            <input type="checkbox" className="hidden" />
            <div className="collapse-title text-xl font-medium">
              <span className="flex items-center gap-4">
                {t("user.filter")}
                <span className="badge-info badge">
                  {Object.keys(parsedFilter).length}
                </span>
              </span>
            </div>
            <div className="collapse-content">
              <UserFilter filter={parsedFilter} />
            </div>
          </div>
          <Pagination
            actualPage={page}
            count={userQuery.userCount ?? 0}
            perPage={PER_PAGE}
          />
        </LayoutPage.List>

        <LayoutPage.Content>
          {userId === "" ? null : <UserContent userId={userId} />}
        </LayoutPage.Content>
      </LayoutPage.Main>
    </LayoutPage>
  );
}
