"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/shadcn/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";

type Props = { label: string; limited?: boolean };

function LockedButton({ label, limited }: Props) {
  const t = useTranslations("common");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="destructive">
            <span>
              <Lock className="size-4" />
              {label}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {t(
              limited
                ? "navigation.limited-plan"
                : "navigation.insufficient-plan",
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default LockedButton;
