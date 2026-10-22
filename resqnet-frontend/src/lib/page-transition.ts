import { flushSync } from "react-dom"

let activeTransition: ViewTransition | null = null

// Navigation never waits for motion; unsupported browsers update immediately.
export function transitionPage(update: () => void, direction: "forward" | "back" = "forward") {
  const root = document.documentElement
  root.dataset.navigation = direction
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  activeTransition?.skipTransition()
  if (reducedMotion || typeof document.startViewTransition !== "function") {
    root.dataset.pageMotion = reducedMotion ? "none" : "fallback"
    flushSync(update)
    return
  }
  root.dataset.pageMotion = "native"
  const transition = document.startViewTransition(() => { flushSync(update) })
  activeTransition = transition
  void transition.ready.catch(() => {
    // Resizing or a newer navigation can cancel snapshot creation.
  })
  void transition.finished.catch(() => {
    // A newer navigation may legitimately skip this animation.
  }).finally(() => {
    if (activeTransition === transition) activeTransition = null
  })
}
