"use client";

import { usePageSection } from "@/lib/sections/useGetSection";
import { PageTarget } from "@/lib/sections/data";

export default function TargetName({ target }: { target: PageTarget }) {
  const { getTargetName } = usePageSection();

  return <span className="badge-secondary badge">{getTargetName(target)}</span>;
}
