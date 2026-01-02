import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";

import { createTrpcCaller } from "@/lib/trpc/caller";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
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
    <div className="flex items-center justify-between bg-shadcn-card px-4 py-2 border-b border-shadcn">
      <div className="flex items-center gap-2">
        <div className="lg:hidden">
          <MobileMenu />
        </div>
        <Logo />
      </div>
      <div className="hidden lg:flex">
        <nav>
          <ul className="flex items-center gap-1">
            <Menu />
          </ul>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <ThemeButton />
        {userId ? (
          <>
            <NotificationIcon userId={userId} />
            <Badge variant="default">{t(`common.roles.${internalRole}`)}</Badge>
            <UserButton />
          </>
        ) : (
          <Button asChild variant="ghost">
            <Link href="/user/signin">{t("auth.signin.connect")}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

const Logo = () => {
  return (
    <div className="flex items-center">
      <Link
        href={"/fitlink"}
        className="flex items-center gap-2 text-2xl capitalize font-semibold hover:opacity-80 transition-opacity relative"
      >
        <Image src="/images/fitlink.svg" alt="Fitlink" width={24} height={24} />
        <span>Fitlink</span>
        {BETA ? (
          <Badge
            variant="warning"
            className="text-[10px] px-1 py-0 absolute -bottom-1 -right-4 opacity-50"
          >
            BETA
          </Badge>
        ) : null}
      </Link>
    </div>
  );
};

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { Menu as MenuIcon } from "lucide-react";

function MobileMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MenuIcon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <ul className="flex flex-col gap-1 p-2">
          <Menu />
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
