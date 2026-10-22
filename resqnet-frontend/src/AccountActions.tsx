export default function AccountActions({ onSwitchAccount, onSignOut, busy }: {
  onSwitchAccount: () => void
  onSignOut: () => void
  busy: boolean
}) {
  return (
    <div className="account-actions flex shrink-0 flex-wrap items-center gap-2">
      <button type="button" onClick={onSwitchAccount} disabled={busy} className="home-action inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-white/60 px-4 py-2.5 text-xs font-medium disabled:opacity-50">
        <svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4" /></svg>
        Switch account
      </button>
      <button type="button" onClick={onSignOut} disabled={busy} className="home-action whitespace-nowrap rounded-full border border-line bg-white/60 px-4 py-2.5 text-xs font-medium disabled:opacity-50">{busy ? "Please wait…" : "Sign out"}</button>
    </div>
  )
}
