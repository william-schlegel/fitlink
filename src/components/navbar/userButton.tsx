"use client";
import { useUser } from "@/lib/auth/client";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

export default function UserButton() {
  const t = useTranslations("common");
  const { data: user } = useUser({ withImage: true });

  if (!user) return null;
  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn-ghost btn-circle avatar btn">
        <div className="w-10 rounded-full">
          <Image
            src={user?.profileImageUrl ?? "/images/dummy.jpg"}
            alt={user?.name ?? ""}
            width={80}
            height={80}
          />
        </div>
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-base-100 p-2 shadow"
      >
        <li>
          <Link href={`/user/${user.id}/profile`}>
            {t("navigation.my-profile")}
          </Link>
        </li>
        <li>
          <Link href={`/user/${user.id}/account`}>
            {t("navigation.my-account")}
          </Link>
        </li>
        <li>
          <div
          // onClick={() => {
          //   signOut({
          //     redirect: true,
          //   });
          // }}
          >
            {t("navigation.disconnect")}
          </div>
        </li>
      </ul>
    </div>
  );
}
