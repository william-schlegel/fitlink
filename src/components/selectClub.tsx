"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import createLink from "@/lib/createLink";
import { cn } from "@/lib/utils";
import {
  Field,
  FieldLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/shadcn";

type SelectClubProps = {
  clubId: string;
  clubs: { id: string; name: string }[];
};
export default function SelectClub({ clubId, clubs }: SelectClubProps) {
  const router = useRouter();
  const t = useTranslations("club");

  return (
    <Field
      orientation="horizontal"
      className={cn(
        "ml-auto w-fit",
        clubs.length <= 1 && "text-muted-foreground",
      )}
    >
      <FieldLabel>{t("select-club")}</FieldLabel>

      <Select
        defaultValue={clubId}
        onValueChange={(value) => router.push(createLink({ clubId: value }))}
        disabled={clubs.length <= 1}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {clubs.map((club) => (
            <SelectItem key={club.id} value={club.id}>
              {club.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
