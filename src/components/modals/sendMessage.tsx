"use client";

import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { useState } from "react";

import { Mail } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/shadcn";
import Modal from "../ui/modal";

export default function SendMessage({
  toUserId,
  fromUserId,
}: {
  toUserId: string;
  fromUserId: string;
}) {
  const t = useTranslations("auth");
  const [closeModal, setCloseModal] = useState(false);
  const sendMessage = useMutation(api.messages.sendDirectMessage);
  return (
    <Modal
      title={t("notification.send-message")}
      submitButtonText={t("notification.send-message")}
      buttonIcon={<Mail />}
      variant="outline"
      cancelButtonText=""
      onCloseModal={() => setCloseModal(true)}
      closeModal={closeModal}
      onOpenModal={() => setCloseModal(false)}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          const content = formData.get("content") as string;
          await sendMessage({
            toUserId,
            fromUserId,
            content,
          });
          setCloseModal(true);
        }}
      >
        <textarea
          name="content"
          className="textarea textarea-bordered w-full"
          placeholder={t("notification.message-placeholder")}
        />
        <Button type="submit" className="mt-4 ">
          {t("notification.send-message")}
        </Button>
      </form>
    </Modal>
  );
}
