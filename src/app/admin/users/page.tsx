import { getActualUser } from "@/lib/auth/server";
import { getTranslations } from "next-intl/server";
import UserFilter from "./userFilter";
import { getAllUsers } from "@/server/api/routers/users";
import { TUserFilter } from "./userFilter";
import { redirect } from "next/navigation";
import { getRoleName } from "@/server/lib/userTools";
import Pagination from "@/components/ui/pagination";
import UserContent from "./userContent";
import Link from "next/link";
import Title from "@/components/title";
import { twMerge } from "tailwind-merge";

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

  return (
    <div className="container mx-auto my-2 space-y-2 p-2">
      <Title title={t("user.manage-users")} />
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("user.manage-users")}</h1>
      </div>
      <div className="flex gap-4">
        <div className="flex w-1/4 flex-col gap-4">
          <div className="collapse-arrow rounded-box collapse border border-base-300 bg-base-100">
            <input type="checkbox" />
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
          {userQuery.users.length === 0 ? (
            <div className="text-center">
              <p>{t("user.no-users")}</p>
            </div>
          ) : (
            <ul className="menu overflow-hidden rounded bg-base-100">
              {userQuery.users.map((user) => (
                <li key={user.id}>
                  <Link
                    className={twMerge(
                      "flex w-full items-center justify-between text-center",
                      userId === user.id && "badge badge-primary"
                    )}
                    href={`/admin/users?userId=${user.id}`}
                  >
                    <span>{user.name}</span>
                    <span
                      className={`${
                        user.internalRole === "MEMBER"
                          ? "badge-secondary"
                          : "badge-accent"
                      } badge`}
                    >
                      {tCommon(`roles.${user.internalRole ?? "MEMBER"}`)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Pagination
            actualPage={page}
            count={userQuery.userCount ?? 0}
            // onPageClick={(page) =>
            //   redirect(
            //     `/admin/users?page=${page}&filter=${JSON.stringify(filter)}`
            //   )
            // }
            perPage={PER_PAGE}
          />
        </div>

        {userId === "" ? null : <UserContent userId={userId} />}
      </div>
    </div>
  );
}
