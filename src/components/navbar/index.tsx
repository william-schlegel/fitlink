import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import { createTrpcCaller } from "@/lib/trpc/caller";
import NotificationIcon from "./notificationIcon";
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

  const caller = await createTrpcCaller();
  if (!caller) return null;

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
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
          </div>
          <ul
            tabIndex={0}
            className="menu-compact menu dropdown-content mt-3 w-52 rounded-box bg-base-100 p-2 shadow z-10"
          >
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
            <NotificationIcon userId={userId} />
            <span className="badge badge-primary">
              {t(`common.roles.${internalRole}`)}
            </span>
            <UserButton />
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
