import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import { ComponentProps } from "react";

import type { OurFileRouter } from "@/app/api/uploadthing/core";

const MyUploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export const UploadButton = (
  props: ComponentProps<typeof MyUploadButton> & { buttonText?: string },
) => {
  return (
    <MyUploadButton
      {...props}
      className="ut-button:btn-primary ut-button:btn"
      content={{
        button() {
          return props.buttonText ?? "Téléchargement...";
        },
      }}
      appearance={{
        button() {
          return {
            width: "fit-content",
            borderStartStartRadius: "var(--join-ss, var(--radius-field))",
            borderStartEndRadius: "var(--join-se, var(--radius-field))",
            borderEndEndRadius: "var(--join-ee, var(--radius-field))",
            borderEndStartRadius: "var(--join-es, var(--radius-field))",
          };
        },
      }}
    />
  );
};
