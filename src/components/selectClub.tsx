"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { twMerge } from "tailwind-merge";

import createLink from "@/lib/createLink";

type SelectClubProps = {
  clubId: string;
  clubs: { id: string; name: string }[];
};
export default function SelectClub({ clubId, clubs }: SelectClubProps) {
  const router = useRouter();
  const t = useTranslations("club");

  return (
    <div className="ml-auto flex items-center gap-2">
      <label
        className={twMerge(
          "text-sm shrink-0",
          clubs.length <= 1 && "text-color-disabled",
        )}
      >
        {t("select-club")}
      </label>
      <select
        className="w-48 min-w-fit"
        value={clubId}
        onChange={(e) => {
          router.push(createLink({ clubId: e.target.value }));
        }}
        disabled={clubs.length <= 1}
      >
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
    </div>
  );
}
