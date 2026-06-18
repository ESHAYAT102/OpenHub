"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"

import { useThemeTransition } from "@/hooks/use-theme-transition"
import { THEME_IDS, getThemeMode } from "@/lib/themes"

function ThemeProvider({
  children,
  disableHotkeys = false,
  ...props
}: React.ComponentProps<typeof NextThemesProvider> & {
  disableHotkeys?: boolean
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={THEME_IDS}
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey disabled={disableHotkeys} />
      <ThemeColorScheme />
      {children}
    </NextThemesProvider>
  )
}

function ThemeColorScheme() {
  const { resolvedTheme, theme } = useTheme()

  React.useEffect(() => {
    const currentTheme = theme === "system" ? resolvedTheme : theme
    document.documentElement.style.colorScheme = getThemeMode(currentTheme)
  }, [resolvedTheme, theme])

  return null
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey({ disabled = false }: { disabled?: boolean }) {
  const { toggleTheme } = useThemeTransition()

  React.useEffect(() => {
    if (disabled) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      toggleTheme()
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [disabled, toggleTheme])

  return null
}

export { ThemeProvider }
