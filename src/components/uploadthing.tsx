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
      onClientUploadComplete={(result) => {
        props.onClientUploadComplete?.(result);
      }}
      {...props}
      className={props.className}
      content={{
        button() {
          return props.buttonText ?? "Téléchargement...";
        },
      }}
      appearance={{
        button() {
          return {
            width: "max-content",
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            padding: "0.5em 1em",
          };
        },
      }}
    />
  );
};
