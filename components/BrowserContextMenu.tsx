"use client"

import type { PropsWithChildren, ReactNode } from "react"
import { useSyncExternalStore } from "react"

import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { useBrowserHistoryAvailability } from "@/hooks/use-browser-history-availability"

type BrowserContextMenuProps = PropsWithChildren<{
  menuChildren?: ReactNode
  showSeparator?: boolean
  triggerClassName?: string
}>

function useIsMobile() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mql = window.matchMedia("(pointer: coarse)")
      mql.addEventListener("change", onStoreChange)
      return () => mql.removeEventListener("change", onStoreChange)
    },
    () => window.matchMedia("(pointer: coarse)").matches,
    () => false
  )
}

export default function BrowserContextMenu({
  children,
  menuChildren,
  showSeparator = true,
  triggerClassName,
}: BrowserContextMenuProps) {
  const router = useRouter()
  const { canGoBack, canGoForward } = useBrowserHistoryAvailability()
  const isMobile = useIsMobile()

  const handleBack = () => {
    if (!canGoBack) return
    router.back()
  }

  const handleForward = () => {
    if (!canGoForward) return
    router.forward()
  }

  const handleReload = () => window.location.reload()

  if (isMobile) {
    return <>{children}</>
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild className={triggerClassName}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          {menuChildren ? (
            <>
              {menuChildren}
              {showSeparator ? <ContextMenuSeparator /> : null}
            </>
          ) : null}
          <ContextMenuItem onClick={handleReload}>
            <RotateCw />
            Reload
          </ContextMenuItem>
          <ContextMenuItem disabled={!canGoBack} onClick={handleBack}>
            <ArrowLeft />
            Back
          </ContextMenuItem>
          <ContextMenuItem disabled={!canGoForward} onClick={handleForward}>
            <ArrowRight />
            Forward
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
