import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

import { NextRequest } from "next/server";

import { getActualUser } from "@/lib/auth/server";

const f = createUploadthing();

const auth = async (req: NextRequest) => {
  const user = await getActualUser();
  if (!user) throw new UploadThingError("Unauthorized");
  return { userId: user.id };
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  profilePicture: f(["image"])
    .middleware(({ req }) => auth(req))
    .onUploadComplete((data) => console.log("file", data)),

  // This route takes an attached image OR video
  messageAttachment: f(["image", "video"])
    .middleware(({ req }) => auth(req))
    .onUploadComplete((data) => console.log("file", data)),

  // Takes exactly ONE image up to 2MB
  strictImageAttachment: f({
    image: { maxFileSize: "2MB", maxFileCount: 1, minFileCount: 1 },
  })
    .middleware(({ req }) => auth(req))
    .onUploadComplete((data) => console.log("file", data)),

  // Define as many FileRoutes as you like, each with a unique routeSlug
  // protectedUploader: f({
  //   image: {
  //     /**
  //      * For full list of options and defaults, see the File Route API reference
  //      * @see https://docs.uploadthing.com/file-routes#route-config
  //      */
  //     maxFileSize: "4MB",
  //     maxFileCount: 1,
  //   },
  //   pdf: {
  //     maxFileSize: "4MB",
  //     maxFileCount: 1,
  //   },
  // })
  //   // Set permissions and file types for this FileRoute
  //   .middleware(async ({ req }) => {
  //     // This code runs on your server before upload
  //     const user = await getActualUser();

  //     // If you throw, the user will not be able to upload
  //     if (!user) throw new UploadThingError("Unauthorized");

  //     // Whatever is returned here is accessible in onUploadComplete as `metadata`
  //     return { userId: user.id };
  //   })
  //   .onUploadComplete(async ({ metadata, file }) => {
  //     // This code RUNS ON YOUR SERVER after upload
  //     console.log("Upload complete for userId:", metadata.userId);

  //     console.log("file url", file.ufsUrl);

  //     // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
  //     return { uploadedBy: metadata.userId };
  //   }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
