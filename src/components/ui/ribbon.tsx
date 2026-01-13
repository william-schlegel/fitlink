"use client";

import { cn } from "@/lib/utils";

type Props = {
  text: string | string[];
  offset: number | string;
  bgColor: "primary" | "secondary" | "accent" | string;
  textColor?: string;
};

function Ribbon({ text, offset, bgColor, textColor }: Props) {
  const folder = "1rem";
  const ribbonShape = "1rem";
  const topOffset = typeof offset === "number" ? `${offset}px` : offset;

  const bgClass =
    bgColor === "primary"
      ? "bg-primary text-primary-content"
      : bgColor === "secondary"
        ? "bg-secondary text-secondary-content"
        : bgColor === "accent"
          ? "bg-accent text-accent-content"
          : "";

  const style = {
    inset: `${topOffset} calc(-1*${folder}) auto auto`,
    padding: `0.25rem 0.5rem calc(0.25rem + ${folder}) calc(0.5rem + ${ribbonShape})`,
    clipPath: `polygon(0 0,100% 0,100% calc(100% - ${folder}),calc(100% - ${folder}) 100%,
        calc(100% - ${folder}) calc(100% - ${folder}),0 calc(100% - ${folder}),
        ${ribbonShape} calc(50% - ${folder}/2))`,
    backgroundColor: !bgClass ? bgColor : undefined,
    color: !bgClass ? textColor : undefined,
    boxShadow: `0 calc(-1*${folder}) 0 inset #0005`,
  };

  return (
    <div
      className={cn("absolute text-sm font-medium", bgClass)}
      style={style}
    >
      {Array.isArray(text) ? text.map((p, i) => <p key={i}>{p}</p>) : text}
    </div>
  );
}

export default Ribbon;
