import { getActualUser } from "@/lib/auth/server";
import { redirect, RedirectType } from "next/navigation";

export default async function HomePage() {
  const user = await getActualUser();
  if (user) {
    const { internalRole, id: userId } = user;
    if (internalRole === "MEMBER")
      redirect(`/member/${userId}`, RedirectType.replace);
    if (internalRole === "COACH")
      redirect(`/coach/${userId}`, RedirectType.replace);
    if (internalRole === "MANAGER")
      redirect(`/manager/${userId}`, RedirectType.replace);
    if (internalRole === "MANAGER_COACH")
      redirect(`/manager-coach/${userId}`, RedirectType.replace);
    if (internalRole === "ADMIN")
      redirect(`/admin/${userId}`, RedirectType.replace);
  }

  redirect("/videoach", RedirectType.replace);
}
