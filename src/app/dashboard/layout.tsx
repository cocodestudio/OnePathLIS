import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Sidebar from "./sidebar-client";
import Navbar from "./navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar session={session} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar session={session} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 py-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
