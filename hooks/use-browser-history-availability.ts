"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

type BrowserNavigation = {
  canGoBack?: boolean
  canGoForward?: boolean
}

function readAvailability() {
  const navigation = ("navigation" in window
    ? (window as typeof window & { navigation?: BrowserNavigation }).navigation
    : undefined) as BrowserNavigation | undefined

  return {
    canGoBack:
      typeof navigation?.canGoBack === "boolean"
        ? navigation.canGoBack
        : window.history.length > 1,
    canGoForward:
      typeof navigation?.canGoForward === "boolean"
        ? navigation.canGoForward
        : false,
  }
}

export function useBrowserHistoryAvailability() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()
  const currentUrl = useMemo(() => {
    return searchParamsString ? `${pathname}?${searchParamsString}` : pathname
  }, [pathname, searchParamsString])
  const [availability, setAvailability] = useState(() => ({
    canGoBack: false,
    canGoForward: false,
  }))

  useEffect(() => {
    const syncAvailability = () => {
      setAvailability(readAvailability())
    }

    const handlePopState = () => {
      syncAvailability()
    }

    const handlePageShow = () => {
      syncAvailability()
    }

    syncAvailability()

    window.addEventListener("popstate", handlePopState)
    window.addEventListener("pageshow", handlePageShow)

    return () => {
      window.removeEventListener("popstate", handlePopState)
      window.removeEventListener("pageshow", handlePageShow)
    }
  }, [currentUrl])

  return availability
}
