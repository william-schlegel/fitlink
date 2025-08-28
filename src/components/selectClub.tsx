"use client";
import createLink from "@/lib/createLink";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

type SelectClubProps = {
  clubId: string;
  clubs: { id: string; name: string }[];
};
export default function SelectClub({ clubId, clubs }: SelectClubProps) {
  const router = useRouter();
  const t = useTranslations("club");
  return (
    <div className="ml-auto flex items-center gap-2">
      <label className="text-sm shrink-0">{t("select-club")}</label>
      <select
        className="w-48 min-w-fit"
        value={clubId}
        onChange={(e) => {
          router.push(createLink({ clubId: e.target.value }));
        }}
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
