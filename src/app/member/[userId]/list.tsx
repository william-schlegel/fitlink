"use client";
import { useTranslations } from "next-intl";

type ListProps = {
  label: string;
  items: string[];
};

export function List({ label, items }: ListProps) {
  const t = useTranslations("dashboard");
  if (!items.length) return null;
  return (
    <div className="flex flex-1 flex-col">
      <h4>{t(label, { count: items.length })}</h4>
      <ul>
        {items.map((item, idx) => (
          <li key={`ITEM-${idx}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
