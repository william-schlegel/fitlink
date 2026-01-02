"use client";

import { type ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/shadcn/collapsible";
import { Button } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/utils";

type Props = {
  groupName: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

function CollapsableGroup({
  groupName,
  children,
  className,
  defaultOpen = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex w-full justify-between rounded-md border border-base-300 bg-base-200 px-3 py-2",
            className
          )}
        >
          <span>{groupName}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2 pl-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default CollapsableGroup;
