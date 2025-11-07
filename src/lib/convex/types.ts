import { NotificationType } from "@/app/user/[userId]/notification/types";
import { Id } from "../../../convex/_generated/dataModel";

export type CreateNotificationInConvexArgs = {
  userId: string;
  userFromId: string;
  type: NotificationType;
  message: string;
  data?: unknown;
  linkedNotification?: string;
  answeredAt?: number;
  answer?: string;
  answered?: boolean;
  id?: Id<"notifications">;
};
