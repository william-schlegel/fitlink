import { userDocumentTypeEnum } from "@/db/schema/enums";
import { trpc } from "./trpc/client";

export const useWriteFile = (
  userId: string,
  documentType: (typeof userDocumentTypeEnum.enumValues)[number],
  maxSize: number = 1024 * 1024,
) => {
  const createPresignedUrl =
    trpc.files.createPresignedUrl.useMutation().mutateAsync;

  async function writeFile(file: File | undefined) {
    if (!file) return undefined;
    const { url, fields, documentId } = await createPresignedUrl({
      userId,
      fileType: file.type,
      documentType,
      fileName: file.name,
      maxSize,
    });
    const formData = new FormData();
    formData.append("Content-Type", file.type);
    Object.entries(fields).forEach(([k, v]) => {
      formData.append(k, v);
    });
    formData.append("file", file);

    await fetch(url, {
      method: "POST",
      body: formData,
    });
    return documentId;
  }
  return writeFile;
};

export const useWriteFileDirect = (
  userId: string,
  maxSize: number = 1024 * 1024,
) => {
  const createPresignedUrl =
    trpc.files.createPresignedUrlDirect.useMutation().mutateAsync;

  async function writeFile(file: File | undefined) {
    if (!file) return undefined;
    const fileId = crypto.randomUUID();
    const { url, fields } = await createPresignedUrl({
      userId,
      fileId,
      fileType: file.type,
      maxSize,
    });
    const formData = new FormData();
    formData.append("Content-Type", file.type);
    Object.entries(fields).forEach(([k, v]) => {
      formData.append(k, v);
    });
    formData.append("file", file);

    await fetch(url, {
      method: "POST",
      body: formData,
    });
    return fileId;
  }
  return writeFile;
};
