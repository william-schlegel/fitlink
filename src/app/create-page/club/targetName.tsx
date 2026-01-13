"use client";

import { usePageSection } from "@/lib/sections/useGetSection";
import { PageTarget } from "@/lib/sections/data";
import { Badge } from "@/components/ui/shadcn";

export default function TargetName({ target }: { target: PageTarget }) {
  const { getTargetName } = usePageSection();

  return <Badge variant="info">{getTargetName(target)}</Badge>;
}
