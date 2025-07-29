import { getServerAuthSession } from "@root/src/server/common/get-server-auth-session";
import { type NextApiRequest, type NextApiResponse } from "next";
import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { appRouter } from "@trpcserver/router/_app";
import { PrismaClient } from "@prisma/client";
import { isCUID } from "@lib/checkValidity";

type ResponseData = {
  success?: string;
  error?: string;
  step?: string;
  trpcerror?: string;
};

const refuseSearchCoach = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  const session = await getServerAuthSession({ req, res });
  const prisma = new PrismaClient({ log: ["error"] });

  const caller = appRouter.createCaller({ session, prisma });

  const notificationId = req.query.notificationId as string;

  if (!notificationId || !isCUID(notificationId))
    return res.status(500).json({
      error: "common:api.error-refuse-search-coach",
      step: "notificationId",
    });

  if (session) {
    try {
      const notification = await caller.notifications.getNotificationById({
        notificationId: notificationId,
        updateViewDate: false,
      });
      if (!notification)
        return res.status(500).json({
          error: "common:api.error-refuse-search-coach",
          step: "notification",
        });
      // create aswer notification
      const answer = await caller.notifications.createNotificationToUser({
        from: notification.userToId,
        to: notification.userFromId,
        type: "COACH_REFUSE",
        message: ">".concat(notification.message.slice(0, 15), "..."),
        linkedNotification: notification.id,
      });
      // update notification answered
      await caller.notifications.updateNotification({
        id: notificationId,
        answered: new Date(Date.now()),
        answer: "common:api.refused",
        linkedNotification: answer.id,
      });
      res.status(200).json({ success: "common:api.answer-sent" });
    } catch (e) {
      if (e instanceof TRPCError) {
        // We can get the specific HTTP status code coming from tRPC (e.g. 404 for `NOT_FOUND`).
        const httpStatusCode = getHTTPStatusCodeFromError(e);

        res.status(httpStatusCode).json({ trpcerror: e.message });
        return;
      }
      res.status(500).json({ error: "common:api.error" });
    }
  }
};

export default refuseSearchCoach;
