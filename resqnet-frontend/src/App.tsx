import { useEffect, useState, type FormEvent } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "./lib/supabase"
import Dashboard from "./Dashboard"
import DispatcherInbox from "./DispatcherInbox"
import NotificationInbox from "./NotificationInbox"
import ReportUpdatesProvider from "./ReportUpdatesProvider"

type Mode = "signup" | "user" | "dispatcher"

const tabs: { id: Mode; label: string }[] = [
  { id: "signup", label: "Sign up" },
  { id: "user", label: "User" },
  { id: "dispatcher", label: "Dispatcher" },
]

const copy: Record<Mode, { title: string; sub: string; cta: string }> = {
  signup: { title: "Create your account", sub: "Report incidents and follow the response in real time.", cta: "Create account" },
  user: { title: "Log in as user", sub: "Welcome back. Pick up where you left off.", cta: "Log in" },
  dispatcher: { title: "Log in as dispatcher", sub: "Control room access for authorised staff.", cta: "Log in as dispatcher" },
}

function Field({ label, name, type = "text", autoComplete }: { label: string; name: string; type?: string; autoComplete?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-mute">{label}</span>
      <input
        name={name}
        type={type}
        required
        minLength={autoComplete === "new-password" ? 8 : undefined}
        autoComplete={autoComplete}
        className="block w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-focus focus:ring-2 focus:ring-focus/25"
      />
    </label>
  )
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode>("signup")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const c = copy[mode]
  const index = tabs.findIndex((t) => t.id === mode)

  useEffect(() => {
    let active = true
    const callbackUrl = new URL(window.location.href)
    const callbackHash = new URLSearchParams(callbackUrl.hash.slice(1))
    const oauthError = callbackUrl.searchParams.get("error_description") ?? callbackHash.get("error_description")
    if (oauthError) {
      setMsg({ ok: false, text: `Google sign-in failed: ${oauthError}` })
      for (const key of ["error", "error_code", "error_description"]) callbackUrl.searchParams.delete(key)
      callbackUrl.hash = ""
      window.history.replaceState(null, "", callbackUrl)
    }
    const refreshUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (!active) return
        setUser(error ? null : data.user)
      } catch {
        if (active) setMsg({ ok: false, text: "Could not restore your session. Please try logging in." })
      } finally {
        if (active) setInitializing(false)
      }
    }
    void refreshUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // Defer Auth calls until the subscription callback releases its lock.
      if (event === "SIGNED_OUT") { setUser(null) }
      else if (event !== "INITIAL_SESSION") setTimeout(() => { if (active) void refreshUser() }, 0)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  const switchMode = (m: Mode) => {
    setMode(m)
    setMsg(null)
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
    const form = e.currentTarget
    const f = new FormData(e.currentTarget)
    if (mode === "signup" && f.get("password") !== f.get("confirm")) {
      setMsg({ ok: false, text: "Passwords do not match." })
      return
    }
    setMsg(null)
    setBusy(true)
    try {
      const email = String(f.get("email")).trim()
      const password = String(f.get("password"))
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg({ ok: true, text: data.session ? "Your account is ready." : "Check your email to confirm your account before logging in." })
        form.reset()
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const { data, error: userError } = await supabase.auth.getUser()
        if (userError || !data.user) throw userError ?? new Error("Could not verify your account.")
        if (mode === "dispatcher" && data.user.app_metadata.role !== "dispatcher") {
          await supabase.auth.signOut({ scope: "local" })
          setUser(null)
          throw new Error("This account does not have dispatcher access. Please use User login or contact your administrator.")
        }
        setUser(data.user)
        form.reset()
      }
    } catch (error) {
      setMsg({ ok: false, text: error instanceof Error ? error.message : "Unable to connect. Please try again." })
    } finally {
      setBusy(false)
    }
  }

  const endSession = async (nextMode: Mode, local: boolean) => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    // Auth may clear the local session even when remote revocation fails.
    setMode(nextMode)
    try {
      const { error } = await supabase.auth.signOut({ scope: local ? "local" : "global" })
      if (error) throw error
      setUser(null)
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#overview`)
      window.scrollTo(0, 0)
    } catch (error) {
      setMsg({ ok: false, text: error instanceof Error ? error.message : "Could not sign out. Try again." })
    } finally {
      setBusy(false)
    }
  }
  const signOut = () => endSession("user", false)
  const switchAccount = () => endSession(user?.app_metadata.role === "dispatcher" ? "user" : "dispatcher", true)

  const continueWithGoogle = async () => {
    if (busy) return
    setBusy(true)
    setMsg(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}${window.location.pathname}`,
          queryParams: { prompt: "select_account" },
        },
      })
      if (error) throw error
    } catch (error) {
      setMsg({ ok: false, text: error instanceof Error ? error.message : "Could not start Google sign-in. Please try again." })
      setBusy(false)
    }
  }

  return (
    <ReportUpdatesProvider accountId={user?.id ?? null} enabled={Boolean(user && user.app_metadata.role !== "dispatcher")}>
    <div data-accent="pastel" className="app-shell flex min-h-screen flex-col bg-canvas">
      <header className="app-header flex items-center justify-between border-b border-line px-[clamp(1.5rem,4vw,3rem)] py-5">
        <a
          href="#overview"
          aria-label="ResqNet home"
          onClick={() => {
            setMsg(null)
            window.scrollTo(0, 0)
          }}
          className="font-brand text-[1.75rem] font-bold leading-none tracking-[-1px] text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
        >ResqNet</a>
        {user && <NotificationInbox key={user.id} accountId={user.id} audience={user.app_metadata.role === "dispatcher" ? "dispatcher" : "reporter"} />}
      </header>

      {user && !initializing ? (user.app_metadata.role === "dispatcher" ? <DispatcherInbox key={user.id} accountId={user.id} onSwitchAccount={switchAccount} onSignOut={signOut} signingOut={busy} signOutError={msg && !msg.ok ? msg.text : undefined} /> : <Dashboard key={user.id} onSwitchAccount={switchAccount} onSignOut={signOut} signingOut={busy} signOutError={msg && !msg.ok ? msg.text : undefined} />) : (
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-[30rem]">
        <section className="card w-full max-w-[30rem] rounded-[20px] p-7 sm:p-9">
          {initializing ? (
            <p role="status" className="py-12 text-center text-sm text-mute">Checking your session…</p>
          ) : (
          <>
          <div role="tablist" className="relative grid grid-cols-3 rounded-full bg-surface p-1">
            <span
              aria-hidden
              className="active-tab absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-white shadow-sm transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${index * 100}%)` }}
            />
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={mode === t.id}
                disabled={busy}
                onClick={() => switchMode(t.id)}
                className={`relative z-10 rounded-full py-2 text-[13px] font-medium transition-colors ${mode === t.id ? "text-ink" : "text-mute hover:text-ink"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <h1 className="mt-9 text-[1.75rem] font-semibold leading-tight tracking-tight">{c.title}</h1>
          <p className="mt-2 text-[15px] text-mute">{c.sub}</p>

          <form key={mode} onSubmit={submit} className="mt-7 space-y-4">
            <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
            <Field label="Email" name="email" type="email" autoComplete="email" />
            <Field label="Password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            {mode === "signup" && <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" />}
            {mode === "signup" && <p className="text-xs text-mute">Use at least 8 characters for your password.</p>}
            </fieldset>

            {msg && (
              <p role={msg.ok ? "status" : "alert"} className="text-sm font-medium text-ink">
                {msg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="primary-button mt-2 w-full rounded-full bg-action py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {busy ? "Please wait…" : c.cta}
            </button>
          </form>
          {mode !== "dispatcher" && (
            <div className="mt-7">
              <div className="mb-6 flex items-center gap-4 text-xs text-mute">
                <span className="h-px flex-1 bg-line" />
                <span>or</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <button
                type="button"
                onClick={continueWithGoogle}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-line bg-white/70 px-4 py-3.5 text-sm font-medium text-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                  <path d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36ZM12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.08v2.59A10 10 0 0 0 12 22ZM6.42 13.92A6 6 0 0 1 6.1 12c0-.67.11-1.32.32-1.92V7.49H3.08A10 10 0 0 0 2 12c0 1.61.38 3.14 1.08 4.51l3.34-2.59ZM12 5.96c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.92 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z" />
                </svg>
                Continue with Google
              </button>
            </div>
          )}
          </>
          )}
        </section>
        </div>
      </main>
      )}
    </div>
    </ReportUpdatesProvider>
  )
}
