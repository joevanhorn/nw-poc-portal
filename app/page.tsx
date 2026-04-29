import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import GuideContent from "./guide-content";

export default async function Home() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">NW</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">
                NW-POC MCP Demo
              </h1>
              <p className="text-xs text-gray-500">
                {session.user?.email}
              </p>
            </div>
          </div>
          <a
            href="/api/auth/signout"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </a>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12">
          <GuideContent />
        </div>
      </main>
    </div>
  );
}
