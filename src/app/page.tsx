import { getActualUser } from "@/lib/auth/server";
import { redirect, RedirectType } from "next/navigation";

export default async function HomePage() {
  const user = await getActualUser();
  if (user) {
    const { role, id: userId } = user;
    if (role === "MEMBER") redirect(`/member/${userId}`, RedirectType.replace);
    if (role === "COACH") redirect(`/coach/${userId}`, RedirectType.replace);
    if (role === "MANAGER")
      redirect(`/manager/${userId}`, RedirectType.replace);
    if (role === "MANAGER_COACH")
      redirect(`/manager-coach/${userId}`, RedirectType.replace);
    if (role === "ADMIN") redirect(`/admin/${userId}`, RedirectType.replace);
  }

  redirect("/videoach", RedirectType.replace);
}
