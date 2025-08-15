import Link from "next/link";
import { env } from "@/env";
import { RoleEnum } from "@/db/schema/enums";
import ThemeButton from "./themeButton";
import { getTranslations } from "next-intl/server";
import Menu from "./menu";
import UserButton from "./userButton";

const BETA = env.NEXT_PUBLIC_BETA === "true";

export default async function Navbar({
  userId,
  role,
}: {
  userId: string | undefined;
  role: RoleEnum | undefined | null;
}) {
  const t = await getTranslations("common");
  const tAuth = await getTranslations("auth");

  // const { notifications, unread, formatMessage } = useNotifications(userId);
  // const user = trpc.users.getUserById.useQuery(userId ?? "", {
  //   enabled: isCUID(userId),
  // });

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <p className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </p>
          <ul className="menu-compact menu dropdown-content mt-3 w-52 rounded-box bg-base-100 p-2 shadow">
            <Menu />
          </ul>
        </div>
        <Logo />
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal p-0">
          <li>
            <Link href={"/videoach"}>{t("navigation.home")}</Link>
          </li>
          <Menu />
        </ul>
      </div>

      <div className="navbar-end space-x-2">
        <ThemeButton />
        {userId ? (
          <>
            {/* {notifications.length ? (
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn-ghost btn-circle btn">
                  <div className="w-10 rounded-full">
                    {unread ? (
                      <div className="indicator ">
                        <i className="bx bx-bell bx-md text-primary" />
                        <span className="badge-secondary badge badge-sm indicator-item">
                          {unread}
                        </span>
                      </div>
                    ) : (
                      <i className="bx bx-bell bx-md text-primary" />
                    )}
                  </div>
                </label>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-base-100 p-2 shadow"
                >
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`max-w-full overflow-hidden truncate text-ellipsis ${
                        notification.viewDate ? "" : "font-bold text-secondary"
                      }`}
                    >
                      <Link
                        href={`/user/${notification.userToId}/notification?notificationId=${notification.id}`}
                      >
                        <span>{formatMessage(notification)}</span>
                      </Link>
                    </li>
                  ))}
                  <div className="divider my-1"></div>
                  <li>
                    <Link href={`/user/${sessionData.user.id}/notification`}>
                      <span>{t("navigation.my-notifications")}</span>
                    </Link>
                  </li>
                </ul>
              </div>
            ) : ( */}
            <i className="bx bx-bell bx-md text-base-300" />
            {/* )}{" "} */}
            {userId ? (
              <>
                <span className="badge badge-primary">
                  {t(`roles.${role}`)}
                </span>
                <UserButton />
              </>
            ) : (
              <Link href="/user/signin">{tAuth("signin.connect")}</Link>
            )}
          </>
        ) : (
          <ul className="menu menu-horizontal p-0">
            <li>
              <Link href="/user/signin">{tAuth("signin.connect")}</Link>{" "}
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

const Logo = () => {
  return (
    <div className="flex-1">
      <Link href={"/videoach"} className="btn btn-ghost text-2xl capitalize">
        Videoach
      </Link>
      {BETA ? (
        <span className="badge badge-warning hidden lg:inline">BETA</span>
      ) : null}
    </div>
  );
};
