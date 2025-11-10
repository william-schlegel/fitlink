"use client";

import { useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
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
      buttonIcon={<i className="bx bx-envelope bx-sm" />}
      variant="Outlined-Primary"
      className="w-2/3 max-w-xl"
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
        <button type="submit" className="btn btn-primary mt-4 ">
          {t("notification.send-message")}
        </button>
      </form>
    </Modal>
  );
}
