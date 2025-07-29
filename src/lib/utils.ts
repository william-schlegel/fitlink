import { z } from "zod";

export function isCUID(value: unknown) {
  const schema = z.cuid();
  const check = schema.safeParse(value);
  return check.success;
}
