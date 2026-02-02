"use client";

import {
  addDays,
  isValid,
  parse,
  startOfDay,
  startOfToday,
  subDays,
} from "date-fns";
import {
  Calendar,
  Calendar1,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";
import { Input } from "@/components/ui/shadcn/input";
import { DayName } from "@/lib/dates/data";
import { useDayName } from "@/lib/dates/useDayName";
import { formatDateAsYYYYMMDD, formatDateLocalized } from "@/lib/formatDate";
import { ButtonGroup, ButtonGroupText } from "./shadcn/button-group";

type SelectDayProps = {
  day: DayName;
  onNewDay?: (newDay: DayName) => void;
  redirectTo?: string;
};

export default function SelectDay({
  day,
  onNewDay,
  redirectTo,
}: SelectDayProps) {
  const { getName, getNextDay, getPreviousDay, getToday } = useDayName();
  const router = useRouter();
  const t = useTranslations("common");

  const handleClick = (newDay: DayName) => {
    if (redirectTo) {
      router.push(`${redirectTo}?day=${newDay}`);
    } else {
      onNewDay?.(newDay);
    }
  };

  return (
    <ButtonGroup>
      <Button
        variant="default"
        size="icon"
        onClick={() => handleClick(getPreviousDay(day))}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <ButtonGroupText className="bg-primary text-primary-foreground">
        {getName(day)}
      </ButtonGroupText>
      <Button
        variant="default"
        size="icon"
        onClick={() => handleClick(getToday())}
        title={t("today")}
      >
        <CalendarDays className="h-5 w-5" />
      </Button>
      <Button
        variant="default"
        size="icon"
        onClick={() => handleClick(getNextDay(day))}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </ButtonGroup>
  );
}

type SelectDateProps = {
  day: Date | string;
  onNewDay?: (newDay: Date) => void;
  redirectTo?: string;
};

function normalizeDateValue(value: Date | string) {
  if (value instanceof Date) return startOfDay(value);
  const parsed = parse(value, "yyyy-MM-dd", startOfToday());
  return isValid(parsed) ? startOfDay(parsed) : startOfToday();
}

export function SelectDate({ day, onNewDay, redirectTo }: SelectDateProps) {
  const router = useRouter();
  const normalizedDay = normalizeDateValue(day);
  const t = useTranslations("common");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateChange = (newDay: Date) => {
    const nextDay = startOfDay(newDay);
    if (redirectTo) {
      router.push(`${redirectTo}?day=${formatDateAsYYYYMMDD(nextDay)}`);
    } else {
      onNewDay?.(nextDay);
    }
  };
  return (
    <div className="inline-flex rounded-md shadow-sm">
      <Button
        variant="default"
        size="icon"
        className="rounded-r-none"
        onClick={() => handleDateChange(subDays(normalizedDay, 1))}
        title={t("previousDay")}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="inline-flex items-center justify-center w-32 bg-primary text-primary-foreground text-sm font-medium">
        {formatDateLocalized(normalizedDay, {
          dateFormat: "short",
          withDay: "short",
        })}
      </span>
      <Button
        variant="default"
        size="icon"
        className="rounded-none"
        onClick={() => handleDateChange(startOfToday())}
        title={t("today")}
      >
        <Calendar1 className="h-5 w-5" />
      </Button>
      <DropdownMenu open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="rounded-none"
            title={t("selectDate")}
          >
            <Calendar className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56 p-3">
          <Input
            type="date"
            aria-label={t("selectDate")}
            value={formatDateAsYYYYMMDD(normalizedDay)}
            onChange={(event) => {
              const nextValue = event.currentTarget.value;
              const nextDate = parse(nextValue, "yyyy-MM-dd", startOfToday());
              if (!isValid(nextDate)) return;
              handleDateChange(nextDate);
              setIsCalendarOpen(false);
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="default"
        size="icon"
        className="rounded-l-none"
        onClick={() => handleDateChange(addDays(normalizedDay, 1))}
        title={t("nextDay")}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
