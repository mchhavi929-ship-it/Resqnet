import { useEffect, useId, useRef, useState } from "react"
import { clearNotifications, markNotificationsRead, readNotifications, subscribeNotifications } from "./lib/notifications"
import InboxReportDetails from "./InboxReportDetails"

export default function NotificationInbox({ accountId, audience = "reporter" }: { accountId: string; audience?: "reporter" | "dispatcher" }) {
  const [records, setRecords] = useState(() => ({ owner: accountId, items: readNotifications(accountId) }))
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const messageHeading = useRef<HTMLHeadingElement>(null)
  const allMessages = useRef<HTMLButtonElement>(null)
  const id = useId()
  const items = records.owner === accountId ? records.items : []
  const unread = items.filter(item => !item.read).length
  const visible = filter === "unread" ? items.filter(item => !item.read) : items
  const selected = items.find(item => item.id === selectedId)

  useEffect(() => {
    dialog.current?.close()
    setFilter("all")
    setSelectedId(null)
    const load = () => setRecords({ owner: accountId, items: readNotifications(accountId) })
    load()
    return subscribeNotifications(accountId, load)
  }, [accountId])

  useEffect(() => {
    if (selectedId) {
      messageHeading.current?.focus({ preventScroll: true })
      if (dialog.current) dialog.current.scrollTop = 0
    }
  }, [selectedId])

  const backToInbox = () => {
    const previousId = selectedId
    setSelectedId(null)
    requestAnimationFrame(() => {
      const previous = document.getElementById(`${id}-message-${previousId}`)
      if (previous) previous.focus()
      else allMessages.current?.focus()
    })
  }

  return (
    <div className="notification-inbox">
      <button type="button" aria-label={`Inbox${unread ? `, ${unread} unread` : ""}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={() => { dialog.current?.showModal(); setOpen(true) }} className="notification-trigger home-action relative inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line bg-white px-3 text-xs font-medium sm:px-4">
        <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>
        <span>Inbox</span>
        {unread > 0 && <span aria-hidden="true" className="notification-badge flex size-5 items-center justify-center rounded-full bg-ink text-xs tabular-nums text-white">{unread}</span>}
      </button>
      <dialog ref={dialog} id={id} data-reading={Boolean(selected)} aria-labelledby={`${id}-title`} onClose={() => { setOpen(false); setSelectedId(null) }} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }} className="notification-dialog border border-white bg-canvas p-0 text-ink shadow-2xl">
        <div className="inbox-shell">
          <div className="notification-panel-heading border-b border-line p-5">
            <div className="flex items-center justify-between gap-3"><div><p className="mb-1 text-xs uppercase tracking-widest text-mute">Report updates</p><h2 id={`${id}-title`} className="font-brand text-2xl font-medium tracking-tight">Inbox<span className="ml-2 font-sans text-xs font-normal text-mute">{unread} unread</span></h2></div><button type="button" aria-label="Close inbox" onClick={() => dialog.current?.close()} className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-white/70"><svg aria-hidden="true" className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div>
            {!selected && <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex rounded-full bg-surface p-1" aria-label="Inbox filter">{(["all", "unread"] as const).map(value => <button key={value} ref={value === "all" ? allMessages : undefined} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-full px-4 py-1.5 text-xs font-medium ${filter === value ? "bg-ink text-white" : "text-mute"}`}>{value === "all" ? "All messages" : "Unread"}</button>)}</div><button type="button" onClick={() => markNotificationsRead(accountId)} disabled={unread === 0} className="text-xs font-medium underline underline-offset-4 disabled:opacity-40">Mark all read</button></div>}
          </div>
          {selected ? <article key={selected.id} className="inbox-reader p-5">
            <button type="button" onClick={backToInbox} className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-mute hover:text-ink"><svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5m6-6-6 6 6 6" /></svg>Back to inbox</button>
            <div className="mb-4 flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface/60"><svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 9-6 9 6v12H3V8Z" /><path d="m3 8 9 7 9-7M3 20l6-7m6 0 6 7" /></svg></span><div><p className="text-xs font-medium">ResqNet</p><time dateTime={selected.createdAt} className="mt-1 block text-xs text-mute">{new Date(selected.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div></div>
            <h3 ref={messageHeading} tabIndex={-1} className="font-brand text-xl font-medium leading-snug tracking-tight outline-none">{selected.title}</h3>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-mute">{selected.body}</p>
            {typeof selected.reportId === "string" ? <>
              <InboxReportDetails key={selected.reportId} reportId={selected.reportId} audience={audience} />
              <div className="mt-6 border-t border-line pt-5"><button type="button" onClick={() => { const reportId = selected.reportId; if (audience === "reporter" && typeof reportId === "string") window.location.hash = `incident/${encodeURIComponent(reportId)}`; dialog.current?.close() }} className="primary-button inline-flex items-center gap-4 rounded-full px-5 py-3 text-xs font-semibold text-white">{audience === "reporter" ? "View report" : "Back to workspace"}<svg aria-hidden="true" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></button></div>
            </> : <section className="mt-5 space-y-4 border-t border-line pt-5">
              <div><h4 className="text-xs font-medium uppercase tracking-widest text-mute">About this message</h4><p className="mt-2 text-sm leading-relaxed text-mute">This is a workspace update, not an incident report. It does not mean a report was dispatched, resolved, or deleted.</p></div>
              {/interrupted|offline|paused/i.test(selected.title) && <><div><h4 className="text-sm font-medium">Your saved reports remain recorded</h4><p className="mt-2 text-sm leading-relaxed text-mute">A connection interruption can delay new updates. Previously saved reports are not removed by this alert.</p></div><div><h4 className="text-sm font-medium">What you can do</h4><p className="mt-2 text-sm leading-relaxed text-mute">Check your connection, return to the workspace, and refresh the inbox. Automatic updates resume when the connection returns.</p></div></>}
              <button type="button" onClick={() => dialog.current?.close()} className="home-action rounded-full border border-line bg-white px-4 py-3 text-xs font-medium">Back to workspace</button>
            </section>}
          </article> : visible.length ? <ul className="notification-list max-h-96 overflow-y-auto divide-y divide-line">{visible.map(item => <li key={item.id}>
            <button id={`${id}-message-${item.id}`} type="button" aria-label={`Open message: ${item.title}`} onClick={() => { markNotificationsRead(accountId, item.id); setSelectedId(item.id) }} className={`notification-row flex w-full gap-3 px-5 py-4 text-left ${item.read ? "bg-white" : "bg-surface/50"}`}>
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.read ? "bg-line" : "bg-ink"}`} aria-hidden="true" />
              <span className="min-w-0"><span className={`block text-sm ${item.read ? "font-medium" : "font-semibold"}`}>{item.title}</span><span className="mt-1 line-clamp-1 text-xs leading-relaxed text-mute">{item.body}</span><time dateTime={item.createdAt} className="mt-2 block text-xs text-mute">{new Date(item.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></span>
            </button>
          </li>)}</ul> : <div className="inbox-empty px-6 py-12 text-center"><svg aria-hidden="true" className="mx-auto mb-4 size-8 text-mute" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v16H4zM4 14h5l1 3h4l1-3h5" /></svg><p className="font-brand text-lg font-medium">{filter === "unread" && items.length ? "You’re all caught up." : "Your inbox is empty."}</p><p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-mute">{filter === "unread" && items.length ? "Read messages are still available in All messages." : "Saved report and response updates will appear here while you’re signed in."}</p></div>}
          <div className="inbox-footer flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4"><p className="text-xs text-mute">Recent messages</p><button type="button" onClick={() => { clearNotifications(accountId); setSelectedId(null) }} disabled={!items.length} className="text-xs font-medium underline underline-offset-4 disabled:opacity-40">Clear history</button></div>
        </div>
      </dialog>
    </div>
  )
}
