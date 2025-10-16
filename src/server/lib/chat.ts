import { channel } from "@/db/schema/chat";
import { db } from "@/db";

export async function createChannelService(input: {
  name: string;
  createdByUserId: string;
}) {
  const created = await db
    .insert(channel)
    .values({ name: input.name, createdByUserId: input.createdByUserId })
    .returning();
  return created[0];
}
