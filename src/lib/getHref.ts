import { headers } from "next/headers";

export async function getHref() {
  const headerList = await headers();
  return headerList.get("x-current-href");
}
