import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import { getNotificationToUser } from "@/server/api/routers/notification";
import { formatMessage } from "@/lib/getNotifications";
import { createTrpcCaller } from "@/lib/trpc/caller";
import { RoleEnum } from "@/db/schema/enums";
import ThemeButton from "./themeButton";
import UserButton from "./userButton";
import { env } from "@/env";
import Menu from "./menu";

const BETA = env.NEXT_PUBLIC_BETA === "true";

export default async function Navbar({
  userId,
  internalRole,
}: {
  userId: string | undefined;
  internalRole: RoleEnum | undefined | null;
}) {
  const t = await getTranslations();

  const notificationsQuery = await getNotificationToUser(userId);
  const unread = notificationsQuery.unread;
  const notifications = notificationsQuery.notifications;

  const caller = await createTrpcCaller();
  if (!caller) return null;
  const user = userId
    ? await caller.users.getUserById({
        id: userId,
        options: {
          withFeatures: true,
        },
      })
    : undefined;

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
          <Menu />
        </ul>
      </div>

      <div className="navbar-end space-x-2">
        <ThemeButton />
        {userId ? (
          <>
            {notifications.length ? (
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
                  {notifications.map(async (notification) => (
                    <li
                      key={notification.id}
                      className={`max-w-full overflow-hidden truncate text-ellipsis ${
                        notification.viewDate ? "" : "font-bold text-secondary"
                      }`}
                    >
                      <Link
                        href={`/user/${notification.userToId}/notification?notificationId=${notification.id}`}
                      >
                        <span>{await formatMessage(notification)}</span>
                      </Link>
                    </li>
                  ))}
                  <div className="divider my-1"></div>
                  <li>
                    <Link href={`/user/${user?.id}/notification`}>
                      <span>{t("common.navigation.my-notifications")}</span>
                    </Link>
                  </li>
                </ul>
              </div>
            ) : (
              <i className="bx bx-bell bx-md text-base-300" />
            )}{" "}
            {userId ? (
              <>
                <span className="badge badge-primary">
                  {t(`common.roles.${internalRole}`)}
                </span>
                <UserButton />
              </>
            ) : (
              <Link href="/user/signin">{t("auth.signin.connect")}</Link>
            )}
          </>
        ) : (
          <ul className="menu menu-horizontal p-0">
            <li>
              <Link href="/user/signin">{t("auth.signin.connect")}</Link>{" "}
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

const Logo = () => {
  return (
    <div className="flex flex-1 items-center">
      <Link
        href={"/fitlink"}
        className="btn btn-ghost text-2xl capitalize flex items-center gap-2 relative"
      >
        <Image src="/images/fitlink.svg" alt="Fitlink" width={24} height={24} />
        <span>Fitlink</span>
        {BETA ? (
          <span className="badge badge-xs badge-warning hidden lg:inline absolute bottom-0 right-0 opacity-50">
            BETA
          </span>
        ) : null}
      </Link>
    </div>
  );
};
