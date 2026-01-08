"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = { note: number; className?: string };

function Rating({ note, className }: Props) {
  return (
    <div className={cn("flex items-center h-6", className)}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = clamp(note - i, 0, 1);
        return <StarIcon key={`STAR-${i}`} fill={fill} />;
      })}
      <span className="ml-2 text-sm text-base-content/70">
        ({note.toFixed(1)})
      </span>
    </div>
  );
}

export default Rating;

function StarIcon({
  fill,
  size = 12,
  className,
}: {
  fill: number;
  size?: number;
  className?: string;
}) {
  if (fill >= 1)
    return (
      <Star
        className={cn("fill-yellow-500 text-yellow-500", className)}
        size={size}
      />
    );

  if (fill <= 0)
    return <Star className={cn("text-yellow-500", className)} size={size} />;

  return (
    <span
      className={cn("relative inline-block", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Star className="absolute left-0 top-0 text-yellow-500" size={size} />
      <span
        className="absolute left-0 top-0 overflow-hidden"
        style={{ width: `${fill * 100}%`, height: size }}
      >
        <Star className="fill-yellow-500 text-yellow-500" size={size} />
      </span>
    </span>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
