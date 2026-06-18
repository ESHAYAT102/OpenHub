"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import A from "@/components/A"
import { useAuth } from "@/components/AuthProvider"
import BrowserContextMenu from "@/components/BrowserContextMenu"
import CommandPalette from "@/components/CommandPalette"
import NotificationsDrawer from "@/components/NotificationsDrawer"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ContextMenuItem } from "@/components/ui/context-menu"
import { useThemeTransition } from "@/hooks/use-theme-transition"
import type { GitHubNotification } from "@/lib/github"
import { getThemeLabel, getThemeMode, type ThemeId } from "@/lib/themes"
import {
  Settings,
  LogOutIcon,
  User,
  Copy,
  Moon,
  Plus,
  Command,
  Sun,
  SquareArrowOutUpRight,
  BookMarked,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "./Image"

type NavbarProps = {
  disableBrowserInteractions?: boolean
  initialUnreadNotifications?: GitHubNotification[]
}

export default function Page({
  disableBrowserInteractions = false,
  initialUnreadNotifications = [],
}: NavbarProps) {
  const { user } = useAuth()
  const { resolvedTheme, theme } = useThemeTransition()
  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [commandInitialValue, setCommandInitialValue] = useState("")
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const profileUrl = useMemo(
    () => (user?.login ? `/${user.login}` : "/"),
    [user?.login]
  )
  const newRepositoryUrl = "/new"
  const fallbackInitial =
    user?.name?.trim().charAt(0).toUpperCase() ||
    user?.login?.trim().charAt(0).toUpperCase() ||
    user?.email?.trim().charAt(0).toUpperCase() ||
    "O"

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href)
  }

  const handleCommandOpenChange = (nextOpen: boolean) => {
    setIsCommandOpen(nextOpen)
    if (!nextOpen) {
      setCommandInitialValue("")
    }
  }

  useEffect(() => {
    if (disableBrowserInteractions) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target
      if (!target) return
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      )
        return
      if (target instanceof HTMLElement && target.isContentEditable) return

      if (event.key.toLowerCase() === "n") {
        event.preventDefault()
        setIsNotificationsOpen(true)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [disableBrowserInteractions])

  const currentTheme = ((theme === "system" ? resolvedTheme : theme) ??
    "light") as ThemeId
  const isDarkTheme = getThemeMode(currentTheme) === "dark"
  const authUrl = "/api/auth/github/login?callbackUrl=/"

  return (
    <nav className="fixed z-50 flex w-full items-center justify-between border-b border-foreground/10 bg-background/60 px-4 py-4 md:px-8 supports-backdrop-filter:backdrop-blur">
      <CommandPalette
        open={isCommandOpen}
        disableGlobalHotkeys={disableBrowserInteractions}
        onOpenChange={handleCommandOpenChange}
        onOpenNotificationsChange={setIsNotificationsOpen}
        initialValue={commandInitialValue}
      />
      <div className="flex items-center">
        {disableBrowserInteractions ? (
          <Link
            href="/"
            prefetch={false}
            className="flex items-center gap-2 font-bold"
          >
            <Image className="h-6" src="/favicon.ico" alt="Logo"></Image>
            <span>Xenon</span>
          </Link>
        ) : (
          <BrowserContextMenu
            triggerClassName="flex items-center justify-center"
            menuChildren={
              <>
                <A href="/" target="_blank">
                  <ContextMenuItem>
                    <SquareArrowOutUpRight />
                    Open in new tab
                  </ContextMenuItem>
                </A>
                <A href="/ESHAYAT102/Xenon">
                  <ContextMenuItem>
                    <BookMarked />
                    Open repository
                  </ContextMenuItem>
                </A>
                <ContextMenuItem onClick={handleCopyUrl}>
                  <Copy />
                  Copy URL
                </ContextMenuItem>
              </>
            }
          >
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-2 font-bold"
            >
              <Image className="h-6" src="/favicon.ico" alt="Logo"></Image>
              <span>Xenon</span>
            </Link>
          </BrowserContextMenu>
        )}
      </div>
      <div className="flex items-center gap-2">
        {disableBrowserInteractions ? (
          <>
            <Button
              className="rounded-full mr-2"
              variant="ghost"
              title="Open command palette"
              onClick={() => {
                setCommandInitialValue("")
                setIsCommandOpen(true)
              }}
            >
              <Command />
            </Button>
            {user ? (
              <Button
                asChild
                className="hidden cursor-default rounded-full sm:inline-flex"
                variant="ghost"
                title="Create new repository"
              >
                <A href={newRepositoryUrl}>
                  <Plus />
                </A>
              </Button>
            ) : null}
          </>
        ) : (
          <BrowserContextMenu triggerClassName="inline-flex">
            <Button
              className="mr-2 rounded-full"
              variant="ghost"
              title="Open command palette"
              onClick={() => {
                setCommandInitialValue("")
                setIsCommandOpen(true)
              }}
            >
              <Command />
            </Button>
            {user ? (
              <Button
                asChild
                className="hidden cursor-default rounded-full sm:inline-flex"
                variant="ghost"
                title="Create new repository"
              >
                <A href={newRepositoryUrl}>
                  <Plus />
                </A>
              </Button>
            ) : null}
          </BrowserContextMenu>
        )}
        <div className="items-center">
          {user && (
            <>
              <NotificationsDrawer
                open={isNotificationsOpen}
                onOpenChange={setIsNotificationsOpen}
                initialNotifications={initialUnreadNotifications}
              />
            </>
          )}
        </div>
        <Button
          className="hidden rounded-full md:flex"
          variant="ghost"
          title={mounted ? `Theme: ${getThemeLabel(currentTheme)}` : undefined}
          onClick={() => {
            setCommandInitialValue("/themes ")
            setIsCommandOpen(true)
          }}
        >
          {mounted && isDarkTheme ? <Moon /> : mounted ? <Sun /> : null}
        </Button>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="rounded-full"
                variant="ghost"
                size="icon"
              >
                <Avatar size="sm">
                  <AvatarImage
                    src={user.image ?? undefined}
                    alt={user.name ?? "Profile Picture"}
                  />
                  <AvatarFallback>{fallbackInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-6" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      @{user.login}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <A href={profileUrl} prefetch={false}>
                  <DropdownMenuItem className="hover:bg-accent-foreground/10">
                    <User className="mr-2 size-4" />
                    Profile
                  </DropdownMenuItem>
                </A>
                <A href="/settings">
                  <DropdownMenuItem className="hover:bg-accent-foreground/10">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </DropdownMenuItem>
                </A>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="hover:bg-accent-foreground/10"
                onClick={() => {
                  window.location.href = "/api/auth/signout?callbackUrl=/"
                }}
              >
                <LogOutIcon className="mr-2 size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            asChild
            variant="outline"
            className="hidden rounded-full px-4 md:inline-flex"
          >
            <A href={authUrl}>Sign in</A>
          </Button>
        )}
      </div>
    </nav>
  )
}
