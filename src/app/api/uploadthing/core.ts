import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  profilePicture: f({
    image: { maxFileSize: "512KB", maxFileCount: 1, minFileCount: 1 },
  }).onUploadComplete(async (data) => {
    console.log("file", data);
    return { fileUrl: data.file.ufsUrl };
  }),

  // This route takes an attached image OR video
  messageAttachment: f(["image", "video"]).onUploadComplete((data) =>
    console.log("file", data),
  ),

  document: f({
    pdf: { maxFileSize: "4MB", maxFileCount: 1, minFileCount: 1 },
    image: { maxFileSize: "2MB", maxFileCount: 1, minFileCount: 1 },
  }).onUploadComplete(async (data) => {
    console.log("file", data);
    return { fileUrl: data.file.ufsUrl };
  }),

  // Takes exactly ONE image up to 2MB
  imageAttachment: f({
    image: { maxFileSize: "2MB", maxFileCount: 1, minFileCount: 1 },
  }).onUploadComplete(async (data) => {
    console.log("file", data);
    return { fileUrl: data.file.ufsUrl };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
