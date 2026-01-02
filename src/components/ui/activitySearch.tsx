"use client";

import { useDebounceValue } from "usehooks-ts";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Button } from "@/components/ui/shadcn/button";
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
    { enabled: debouncedActivity !== "" }
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
    <div className={cn("relative", className)}>
      {label && (
        <Label
          className={cn(
            "mb-2",
            required && "after:content-['*'] after:text-error after:ml-0.5"
          )}
        >
          {label}
        </Label>
      )}
      <div className="flex gap-2">
        {iconActivity && (
          <Button variant="outline" size="icon" className="shrink-0" disabled>
            <Search className="h-4 w-4 text-primary" />
          </Button>
        )}
        <Input
          value={activity}
          onChange={(e) => setActivity(e.currentTarget.value)}
          placeholder={t("enter-activity") ?? ""}
        />
      </div>
      {error && <p className="text-sm text-error mt-1">{error}</p>}
      {showList && activities.data?.length ? (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-shadcn bg-shadcn-card shadow-lg">
          <ul className="max-h-60 overflow-auto py-1">
            {activities.data?.map((act) => (
              <li key={act.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-shadcn-muted transition-colors"
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
    </div>
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
