"use client";
import { PageTarget, usePageSection } from "@/components/modals/managePage";

export default function TargetName({ target }: { target: PageTarget }) {
  const { getTargetName } = usePageSection();

  return <span className="badge-secondary badge">{getTargetName(target)}</span>;
}
