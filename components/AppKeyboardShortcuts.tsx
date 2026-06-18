"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AppKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    // Firefox/Zen already has more aggressive browser-level shortcuts.
    // Keep this listener disabled there to avoid conflicting navigation loops.
    if (typeof navigator !== "undefined" && /Firefox|Zen/i.test(navigator.userAgent)) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (event.altKey || event.shiftKey) return

      if (event.key === "," && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        router.push("/settings")
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [router])

  return null
}
