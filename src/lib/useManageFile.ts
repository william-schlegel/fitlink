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
    console.log("file", file);

    const f = await uploadFile.mutateAsync({
      userId,
      documentType,
      maxSize,
      file,
    });
    return f.documentId;
  }

  return writeFile;
};
