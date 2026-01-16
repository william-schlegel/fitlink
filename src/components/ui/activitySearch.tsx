"use client";

import { useDebounceValue } from "usehooks-ts";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "./shadcn";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "./shadcn/input-group";
import { Popover, PopoverContent } from "./shadcn/popover";
import { Button } from "@/components/ui/shadcn/button";
import { Label } from "@/components/ui/shadcn/label";
import { Input } from "@/components/ui/shadcn/input";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  initialActivity?: string;
  onSearch: (activity: ActivityData) => void;
  onActivityChange: (value: string) => void;
  required?: boolean;
  iconActivity?: boolean;
  error?: string;
  className?: string;
};

type ActivityData = {
  id: string;
  name: string;
};

const ActivitySearch = ({
  initialActivity,
  label,
  onSearch,
  required,
  iconActivity = true,
  error,
  onActivityChange,
  className,
}: Props) => {
  const [activity, setActivity] = useState("");
  const [debouncedActivity] = useDebounceValue<string>(activity, 500);
  const t = useTranslations("common");
  const [showList, setShowList] = useState(false);

  const activities = trpc.coachs.getOfferActivityByName.useQuery(
    debouncedActivity,
    { enabled: debouncedActivity !== "" },
  );

  useEffect(() => {
    onActivityChange(debouncedActivity);
    setShowList(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedActivity]);

  useEffect(() => {
    if (initialActivity) setActivity(initialActivity);
  }, [initialActivity]);

  return (
    <Field className={cn("relative", className)}>
      {label && (
        <FieldLabel className={cn(required && "required")}>{label}</FieldLabel>
      )}
      <FieldContent className="bg-background">
        <InputGroup>
          {iconActivity && (
            <InputGroupAddon>
              <Search className="text-primary" />
            </InputGroupAddon>
          )}
          <InputGroupInput
            value={activity}
            onChange={(e) => setActivity(e.currentTarget.value)}
            placeholder={t("enter-activity") ?? ""}
          />
        </InputGroup>
      </FieldContent>

      {error && <FieldError>{error}</FieldError>}
      {showList && activities.data?.length ? (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {activities.data?.map((act) => (
              <li key={act.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  onClick={() => {
                    setActivity(act.name);
                    onSearch({ id: act.id, name: act.name });
                    setShowList(false);
                  }}
                >
                  <TextHighlighted
                    text={act.name}
                    highlight={debouncedActivity}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Field>
  );
};

export default ActivitySearch;

function TextHighlighted({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((p, idx) => (
        <span
          key={`P-${idx}`}
          className={
            p.toLocaleLowerCase() === highlight.toLocaleLowerCase()
              ? "font-semibold text-accent"
              : ""
          }
        >
          {p}
        </span>
      ))}
    </span>
  );
}
