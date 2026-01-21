"use client";

import { ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/shadcn/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/shadcn/collapsible";
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
        <Button variant="outline" className={className}>
          <span>{groupName}</span>
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default CollapsableGroup;
