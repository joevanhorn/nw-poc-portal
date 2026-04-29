"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-5">
            <span className="text-white font-bold text-xl">NW</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            NW-POC MCP Demo
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Okta MCP Adapter POC Environment
          </p>
          <button
            onClick={() => signIn("okta", { callbackUrl: "/" })}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in with Okta
          </button>
          <p className="mt-4 text-xs text-gray-400">
            Requires an account in the NW-POC Okta org
          </p>
        </div>
      </div>
    </div>
  );
}
