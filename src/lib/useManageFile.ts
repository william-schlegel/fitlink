import { userDocumentTypeEnum } from "@/db/schema/enums";
import { trpc } from "./trpc/client";

export const useWriteFile = (
  userId: string,
  documentType: (typeof userDocumentTypeEnum.enumValues)[number],
  maxSize: number = 1024 * 1024,
) => {
  const uploadFile = trpc.files.uploadFile.useMutation();

  async function writeFile(file: File | undefined) {
    if (!file) return undefined;

    uploadFile.mutate(
      {
        userId,
        fileType: file.type,
        documentType,
        fileName: file.name,
        maxSize,
        file,
      },
      {
        onSuccess: (data) => {
          return data.documentId;
        },
        onError: (error) => {
          throw error;
        },
      },
    );
  }
  return writeFile;
};
