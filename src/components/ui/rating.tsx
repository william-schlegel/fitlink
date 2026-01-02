"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { note: number; className?: string };

function Rating({ note, className }: Props) {
  return (
    <div className={cn("flex items-center h-6", className)}>
      {Array.from({ length: 5 }, (_, k) => k).map((i) => (
        <StarIcon
          key={`STAR-${i}`}
          filled={i < Math.floor(note)}
          partial={i === Math.floor(note) ? note % 1 : 0}
        />
      ))}
      <span className="ml-2 text-sm text-base-content/70">
        ({note.toFixed(1)})
      </span>
    </div>
  );
}

export default Rating;

function StarIcon({ filled, partial }: { filled: boolean; partial: number }) {
  if (filled) {
    return <Star className="h-5 w-5 fill-accent text-accent" />;
  }
  if (partial > 0) {
    return (
      <div className="relative h-5 w-5">
        <Star className="absolute h-5 w-5 text-base-300" />
        <div
          className="absolute overflow-hidden"
          style={{ width: `${partial * 100}%` }}
        >
          <Star className="h-5 w-5 fill-accent text-accent" />
        </div>
      </div>
    );
  }
  return <Star className="h-5 w-5 text-base-300" />;
}
