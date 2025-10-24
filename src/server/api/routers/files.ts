import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc/server";
import { userDocumentTypeEnum } from "@/db/schema/enums";
import { userDocument } from "@/db/schema/user";
import { env } from "@/env";
import { db } from "@/db";

import { UTApi } from "uploadthing/server";

export const utapi = new UTApi({
  token: env.UPLOADTHING_TOKEN,
});

export async function getDocUrl(userId: string, documentId: string) {
  const document = await db.query.userDocument.findFirst({
    where: and(
      eq(userDocument.id, documentId),
      eq(userDocument.userId, userId),
    ),
  });
  if (!document) return "";
  const fileUrl = await utapi.generateSignedURL(document.fileKey);

  return fileUrl.ufsUrl;
}

export const fileRouter = createTRPCRouter({
  uploadFile: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        maxSize: z
          .number()
          .optional()
          .default(1024 * 1024),
        fileType: z.string(),
        fileName: z.string(),
        documentType: z.enum(userDocumentTypeEnum.enumValues),
        file: z.instanceof(File),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.internalRole !== "ADMIN" && ctx.user.id !== input.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not allowed to upload a file",
        });
      }
      const uploadedFile = await utapi.uploadFiles(input.file);
      if (uploadedFile.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload file",
        });
      }
      const fileKey = uploadedFile.data.key;
      const userId = input.userId;
      const document = await db
        .insert(userDocument)
        .values({
          userId,
          documentType: input.documentType,
          fileType: input.fileType,
          fileName: input.fileName,
          fileKey,
        })
        .returning();

      const fileUrl = utapi.generateSignedURL(fileKey);
      return { fileUrl, documentId: document[0].id };
    }),
  getDocumentUrlById: publicProcedure
    .input(z.cuid2())
    .query(async ({ input }) => {
      if (!input) return { url: "", fileype: "" };
      const document = await db.query.userDocument.findFirst({
        where: eq(userDocument.id, input),
      });
      if (!document)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This document does not exist",
        });
      const fileUrl = await utapi.generateSignedURL(document.fileKey);

      return { url: fileUrl.ufsUrl, fileType: document.fileType };
    }),
  getDocumentsForUser: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        documentType: z.enum(userDocumentTypeEnum.enumValues).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.internalRole !== "ADMIN" && ctx.user.id !== input.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not allowed to get these files",
        });
      }
      const documents = await db.query.userDocument.findMany({
        where: and(
          eq(userDocument.userId, input.userId),
          input.documentType
            ? eq(userDocument.documentType, input.documentType)
            : undefined,
        ),
      });
      const extendedDocuments = await Promise.all(
        documents.map(async (doc) => ({
          ...doc,
          url: utapi.generateSignedURL(doc.fileKey),
        })),
      );
      return extendedDocuments;
    }),
  deleteUserDocument: protectedProcedure
    .input(z.object({ userId: z.cuid2(), documentId: z.cuid2() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.internalRole !== "ADMIN" && ctx.user.id !== input.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not allowed to delete this file",
        });
      }

      const document = await db.query.userDocument.findFirst({
        where: eq(userDocument.id, input.documentId),
      });
      if (!document)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This document does not exist",
        });
      await utapi.deleteFiles(document.fileKey);
      return db
        .delete(userDocument)
        .where(eq(userDocument.id, input.documentId));
    }),
});
