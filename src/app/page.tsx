import { redirect } from "next/navigation";
import { homeFor } from "@/lib/roles";
import { isInstalled } from "@/lib/server/install";
import { deps, getSessionUser } from "@/lib/server/session";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect(homeFor(user.perfil));
  if (!(await isInstalled(deps()))) redirect("/install");
  redirect("/login");
}
