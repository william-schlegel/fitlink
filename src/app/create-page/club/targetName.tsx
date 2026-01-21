"use client";

import { Badge } from "@/components/ui/shadcn";
import { PageTarget } from "@/lib/sections/data";
import { usePageSection } from "@/lib/sections/useGetSection";

export default function TargetName({ target }: { target: PageTarget }) {
  const { getTargetName } = usePageSection();

  return <Badge variant="info">{getTargetName(target)}</Badge>;
}
