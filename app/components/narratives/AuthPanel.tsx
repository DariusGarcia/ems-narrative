"use client";

import type { SessionUser, TemplateView } from "@/app/components/narratives/types";

type Props = {
  sessionUser: SessionUser | null;
  templateView: TemplateView;
  setTemplateView: (view: TemplateView) => void;
  handleLogout: () => Promise<void>;
  authMode: "login" | "register" | null;
  setAuthMode: (mode: "login" | "register" | null) => void;
  authUsername: string;
  setAuthUsername: (value: string) => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  isSubmittingAuth: boolean;
  handleAuthSubmit: (mode: "login" | "register") => Promise<void>;
};

export function AuthPanel({
  sessionUser,
  templateView,
  setTemplateView,
  handleLogout,
  authMode,
  setAuthMode,
  authUsername,
  setAuthUsername,
  authPassword,
  setAuthPassword,
  isSubmittingAuth,
  handleAuthSubmit,
}: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-surface p-4 shadow-sm">
      {sessionUser ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Signed in as {sessionUser.username}</p>
            <p className="text-xs text-slate-600">
              You can switch between main feed templates and your personal templates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTemplateView("feed")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                templateView === "feed"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              Main Feed
            </button>
            <button
              type="button"
              onClick={() => setTemplateView("mine")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                templateView === "mine"
                  ? "bg-cyan-700 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              My Templates
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-50"
            >
              Log out
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-900">Optional account for personal templates</p>
          <p className="text-xs text-slate-600">
            Without an account, you can still create and manage main feed templates.
          </p>
          {!authMode ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600"
              >
                Create account
              </button>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-700">
                {authMode === "login" ? "Log in to your account" : "Create a new account"}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={authUsername}
                  onChange={(event) => setAuthUsername(event.target.value)}
                  placeholder="username"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="password"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-cyan-300 transition focus:ring-2"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isSubmittingAuth}
                  onClick={() => void handleAuthSubmit(authMode)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed ${
                    authMode === "login"
                      ? "bg-slate-900 hover:bg-slate-800 disabled:bg-slate-500"
                      : "bg-cyan-700 hover:bg-cyan-600 disabled:bg-cyan-400"
                  }`}
                >
                  {authMode === "login" ? "Log in" : "Create account"}
                </button>
                <button
                  type="button"
                  disabled={isSubmittingAuth}
                  onClick={() => {
                    setAuthMode(null);
                    setAuthPassword("");
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
