import { isCuid } from "@paralleldrive/cuid2";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isCUID(value: unknown) {
  if (typeof value !== "string") return false;
  return isCuid(value);
}
