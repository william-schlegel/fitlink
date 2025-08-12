import { isCuid } from "@paralleldrive/cuid2";

export function isCUID(value: unknown) {
  if (typeof value !== "string") return false;
  return isCuid(value);
}
