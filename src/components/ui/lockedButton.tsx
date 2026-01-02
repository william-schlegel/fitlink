"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/shadcn/tooltip";
import { Button } from "@/components/ui/shadcn/button";

type Props = { label: string; limited?: boolean };

function LockedButton({ label, limited }: Props) {
  const t = useTranslations("common");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className="cursor-default bg-neutral/20 text-base-content/30 hover:bg-neutral/20 hover:text-base-content/30 gap-2"
            disabled
          >
            <Lock className="h-4 w-4" />
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-error text-error-content">
          <p>
            {t(
              limited
                ? "navigation.limited-plan"
                : "navigation.insufficient-plan"
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default LockedButton;
