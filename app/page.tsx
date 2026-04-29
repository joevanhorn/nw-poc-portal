import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import GuideContent from "./guide-content";

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              NW-POC MCP Demo Portal
            </h1>
            <p className="text-sm text-gray-500">
              Signed in as {session.user?.email}
            </p>
          </div>
          <a
            href="/api/auth/signout"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </a>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        <GuideContent />
      </main>
    </div>
  );
}
