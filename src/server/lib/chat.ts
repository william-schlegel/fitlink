import { channel, channelUsers } from "@/db/schema/chat";
import { ChannelTypeEnum } from "@/db/schema/enums";
import { db } from "@/db";

export async function createChannelService(input: {
  name: string;
  createdByUserId: string;
  type: ChannelTypeEnum;
  imageDocumentId?: string;
  users?: string[];
}) {
  return await db.transaction(async (tx) => {
    const created = await tx
      .insert(channel)
      .values({
        name: input.name,
        createdByUserId: input.createdByUserId,
        type: input.type,
        imageDocumentId: input.imageDocumentId,
      })
      .returning();
    if (input.users) {
      await tx.insert(channelUsers).values(
        input.users.map((user) => ({
          channelId: created[0].id,
          userId: user,
        })),
      );
    }
    return created[0];
  });
}
