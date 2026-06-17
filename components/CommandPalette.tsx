"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { Dialog as DialogPrimitive } from "radix-ui"
import {
  Bell,
  BookMarked,
  Command as CommandIcon,
  Copy,
  LogIn,
  Moon,
  Palette,
  Plus,
  RotateCw,
  Search,
  Settings,
  SquareArrowOutUpRight,
  Sun,
  User,
  Volume2,
  VolumeX,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/components/AuthProvider"
import {
  UI_SOUNDS_CHANGED_EVENT,
  areUiSoundsDisabled,
  setUiSoundsDisabled,
} from "@/components/UiSoundEffects"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useThemeTransition } from "@/hooks/use-theme-transition"
import { usePrefetchRoutes } from "@/hooks/usePrefetchRoutes"
import {
  THEME_FAMILIES,
  getThemeFamily,
  getThemeIdForFamily,
  getThemeMode,
  type ThemeFamilyId,
  type ThemeId,
} from "@/lib/themes"

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenNotificationsChange?: (open: boolean) => void
  initialValue?: string
}

type CommandItem = {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

type CommandAction = {
  id: string
  label: string
  icon: React.ReactNode
  onSelect: () => void
  keywords?: string[]
}

type CommandEntry = {
  id: string
  label: string
  icon: React.ReactNode
  onSelect: () => void
  keywords?: string[]
}

type SearchRepositoryResult = {
  id: number
  name: string
  fullName: string
  description: string | null
  stars: number
  language: string | null
  url: string
}

type SearchUserResult = {
  login: string
  avatarUrl: string | null
  url: string
  type: "User" | "Organization" | string
}

const RECENT_COMMANDS_KEY = "xenon:recent-commands"
const MAX_RECENTS = 12

function getMatchingThemeFamily(query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return null

  const exactMatch = THEME_FAMILIES.find((family) => {
    const exactTerms = [
      family.id,
      family.name,
      family.lightTheme,
      family.darkTheme,
      ...family.keywords,
    ].map((term) => term.toLowerCase())

    return exactTerms.includes(normalizedQuery)
  })

  if (exactMatch) return exactMatch

  const partialMatches = THEME_FAMILIES.filter((family) => {
    const searchableText = [
      family.id,
      family.name,
      family.description,
      family.lightTheme,
      family.darkTheme,
      ...family.keywords,
    ]
      .join(" ")
      .toLowerCase()

    return searchableText.includes(normalizedQuery)
  })

  return partialMatches.length === 1 ? partialMatches[0] : null
}

export default function CommandPalette({
  open,
  onOpenChange,
  onOpenNotificationsChange,
  initialValue,
}: CommandPaletteProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { resolvedTheme, setThemeWithTransition, theme, toggleTheme } =
    useThemeTransition()
  const [value, setValue] = useState("")
  const [recentCommands, setRecentCommands] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<{
    repositories: SearchRepositoryResult[]
    users: SearchUserResult[]
  }>({ repositories: [], users: [] })
  const [userRepos, setUserRepos] = useState<SearchRepositoryResult[]>([])
  const [soundsDisabled, setSoundsDisabledState] = useState(false)
  const currentTheme = ((theme === "system" ? resolvedTheme : theme) ??
    "light") as ThemeId
  const currentAppearance = getThemeMode(currentTheme)
  const currentFamily = getThemeFamily(currentTheme)

  const items = useMemo<CommandItem[]>(() => {
    const baseItems: CommandItem[] = [
      {
        id: "search",
        label: "Search",
        icon: <Search className="size-4" />,
        href: "/",
      },
      {
        id: "new-repo",
        label: "Create repository",
        icon: <Plus className="size-4" />,
        href: "/new",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: <Bell className="size-4" />,
        href: "/notifications",
      },
      {
        id: "settings",
        label: "Settings",
        icon: <Settings className="size-4" />,
        href: "/settings",
      },
    ]

    if (user?.login) {
      baseItems.unshift({
        id: "profile",
        label: "Profile",
        icon: <User className="size-4" />,
        href: `/${user.login}`,
      })
    }

    return baseItems
  }, [user?.login])

  useEffect(() => {
    if (!open) return
    if (initialValue === undefined) return
    setValue(initialValue)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [initialValue, open])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_COMMANDS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as string[]
        if (Array.isArray(parsed)) {
          setRecentCommands(parsed.filter((id) => typeof id === "string"))
        }
      }
    } catch {
      setRecentCommands([])
    }
  }, [])

  useEffect(() => {
    setSoundsDisabledState(areUiSoundsDisabled())

    const onSoundPreferenceChange = (event: Event) => {
      const nextDisabled = (event as CustomEvent<{ disabled?: boolean }>).detail
        ?.disabled
      setSoundsDisabledState(
        typeof nextDisabled === "boolean" ? nextDisabled : areUiSoundsDisabled()
      )
    }

    window.addEventListener(UI_SOUNDS_CHANGED_EVENT, onSoundPreferenceChange)
    return () =>
      window.removeEventListener(
        UI_SOUNDS_CHANGED_EVENT,
        onSoundPreferenceChange
      )
  }, [])

  useEffect(() => {
    if (!user?.login) return

    const controller = new AbortController()
    fetch(`/api/user/repos?per_page=30`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.repositories) {
          setUserRepos(data.repositories)
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [user?.login])

  const markCommandUsed = (id: string) => {
    setRecentCommands((current) => {
      const next = [id, ...current.filter((item) => item !== id)].slice(
        0,
        MAX_RECENTS
      )
      try {
        window.localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const toggleSoundsDisabled = useCallback(() => {
    const nextDisabled = !areUiSoundsDisabled()
    setUiSoundsDisabled(nextDisabled)
    setSoundsDisabledState(nextDisabled)
    toast.success(nextDisabled ? "Sounds disabled" : "Sounds enabled")
  }, [])

  const baseEntries = useMemo<CommandEntry[]>(() => {
    return items.map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      onSelect: () => {
        if (item.id === "search") {
          markCommandUsed(item.id)
          setValue("/search ")
          requestAnimationFrame(() => inputRef.current?.focus())
          return
        }

        if (item.id === "notifications" && onOpenNotificationsChange) {
          markCommandUsed(item.id)
          onOpenChange(false)
          onOpenNotificationsChange(true)
          return
        }

        markCommandUsed(item.id)
        onOpenChange(false)
        router.push(item.href)
      },
    }))
  }, [items, onOpenChange, onOpenNotificationsChange, router])

  const actionEntries = useMemo<CommandAction[]>(() => {
    const authItem = user
      ? null
      : {
          id: "sign-in",
          label: "Sign in",
          icon: <LogIn className="size-4 text-muted-foreground" />,
          onSelect: () => {
            markCommandUsed("sign-in")
            onOpenChange(false)
            window.location.href = "/api/auth/github/login?callbackUrl=/"
          },
          keywords: ["login", "account"],
        }

    return [
      {
        id: "toggle-sounds",
        label: soundsDisabled ? "Enable sounds" : "Disable sounds",
        icon: soundsDisabled ? (
          <Volume2 className="size-4 text-muted-foreground" />
        ) : (
          <VolumeX className="size-4 text-muted-foreground" />
        ),
        onSelect: () => {
          markCommandUsed("toggle-sounds")
          toggleSoundsDisabled()
          onOpenChange(false)
        },
        keywords: [
          "audio",
          "disable",
          "enable",
          "sound",
          "sounds",
          "mute",
          "muted",
          "silence",
          "unmute",
        ],
      },
      {
        id: "change-theme",
        label: "Appearance",
        icon:
          currentAppearance === "dark" ? (
            <Moon className="size-4 text-muted-foreground" />
          ) : (
            <Sun className="size-4 text-muted-foreground" />
          ),
        onSelect: () => {
          markCommandUsed("change-theme")
          const nextTheme = toggleTheme()
          toast.success(
            `${getThemeMode(nextTheme) === "dark" ? "Dark" : "Light"} appearance enabled`
          )
        },
        keywords: ["appearance", "theme", "mode", "dark", "light"],
      },
      {
        id: "choose-theme",
        label: "Choose theme",
        icon: <Palette className="size-4 text-muted-foreground" />,
        onSelect: () => {
          markCommandUsed("choose-theme")
          const matchingTheme = getMatchingThemeFamily(value)
          if (matchingTheme) {
            setThemeWithTransition(
              getThemeIdForFamily(
                currentTheme,
                matchingTheme.id as ThemeFamilyId
              )
            )
            toast.success(`${matchingTheme.name} enabled`)
            onOpenChange(false)
            return
          }

          setValue("/themes ")
          requestAnimationFrame(() => inputRef.current?.focus())
        },
        keywords: [
          "theme",
          "change",
          "change theme",
          "choose theme",
          "appearance",
          "catppuccin",
          "dracula",
          "tokyo",
          "everforest",
          "gruvbox",
          "flexoki",
          "nord",
          "osaka",
          "rose pine",
        ],
      },
      {
        id: "reload",
        label: "Reload",
        icon: <RotateCw className="size-4 text-muted-foreground" />,
        onSelect: () => {
          markCommandUsed("reload")
          onOpenChange(false)
          window.location.reload()
        },
        keywords: ["refresh"],
      },
      {
        id: "open-in-github",
        label: "Open in GitHub",
        icon: (
          <SquareArrowOutUpRight className="size-4 text-muted-foreground" />
        ),
        onSelect: () => {
          markCommandUsed("open-in-github")
          const path = window.location.pathname
          const segments = path.split("/").filter(Boolean)
          const githubUrl =
            segments.length >= 2
              ? `https://github.com/${segments[0]}/${segments[1]}`
              : segments.length === 1
                ? `https://github.com/${segments[0]}`
                : "https://github.com"
          onOpenChange(false)
          window.open(githubUrl, "_blank", "noopener,noreferrer")
        },
        keywords: ["github", "open", "repo", "profile"],
      },
      {
        id: "copy-current-url",
        label: "Copy current URL",
        icon: <Copy className="size-4 text-muted-foreground" />,
        onSelect: () => {
          markCommandUsed("copy-current-url")
          const url = window.location.href
          navigator.clipboard
            .writeText(url)
            .then(() => toast.success("URL copied"))
            .catch(() => toast.error("Could not copy URL"))
          onOpenChange(false)
        },
        keywords: ["copy", "url", "link"],
      },
      {
        id: "keyboard-shortcuts",
        label: "Keyboard shortcuts",
        icon: <Settings className="size-4 text-muted-foreground" />,
        onSelect: () => {
          markCommandUsed("keyboard-shortcuts")
          setValue("/shortcuts")
          requestAnimationFrame(() => inputRef.current?.focus())
        },
        keywords: ["shortcuts", "keys", "hotkeys", "keyboard"],
      },
      ...(authItem ? [authItem] : []),
    ]
  }, [
    currentAppearance,
    currentTheme,
    onOpenChange,
    soundsDisabled,
    setThemeWithTransition,
    toggleSoundsDisabled,
    toggleTheme,
    user,
    value,
  ])

  const orderedEntries = useMemo(() => {
    const seen = new Set<string>()
    const ordered: CommandEntry[] = []

    for (const id of recentCommands) {
      const entry =
        baseEntries.find((item) => item.id === id) ??
        actionEntries.find((item) => item.id === id)
      if (entry && !seen.has(id)) {
        ordered.push(entry)
        seen.add(id)
      }
    }

    for (const entry of [...baseEntries, ...actionEntries]) {
      if (!seen.has(entry.id)) {
        ordered.push(entry)
      }
    }

    return ordered
  }, [actionEntries, baseEntries, recentCommands])

  const filteredEntries = useMemo(() => {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed || trimmed.startsWith("/")) {
      return orderedEntries
    }

    return orderedEntries.filter((entry) => {
      const haystack = `${entry.label}`.toLowerCase()
      if (haystack.includes(trimmed)) return true
      return entry.keywords?.some((keyword) =>
        keyword.toLowerCase().includes(trimmed)
      )
    })
  }, [orderedEntries, value])

  const parsed = useMemo(() => {
    const trimmed = value.trim()
    if (!trimmed.startsWith("/")) return null

    const [rawCommand, ...rest] = trimmed.slice(1).split(" ")
    const command = rawCommand?.toLowerCase() ?? ""
    const argument = rest.join(" ").trim()
    return { command, argument }
  }, [value])

  const slashCommands = useMemo(
    () => [
      {
        id: "slash-new",
        command: "/new",
        description: "Create a repository",
        placeholder: "/new my-repo",
        onSelect: () => setValue("/new "),
        requiresArgument: true,
      },
      {
        id: "slash-search",
        command: "/search",
        description: "Search repositories and users",
        placeholder: "/search react",
        onSelect: () => setValue("/search "),
        requiresArgument: true,
      },
      {
        id: "slash-repos",
        command: "/repos",
        description: "Open your profile",
        placeholder: "/repos",
        onSelect: () => setValue("/repos "),
        requiresArgument: false,
      },
      {
        id: "slash-github",
        command: "/github",
        description: "Open in GitHub",
        placeholder: "/github owner/repo",
        onSelect: () => setValue("/github "),
        requiresArgument: false,
      },
      {
        id: "slash-settings",
        command: "/settings",
        description: "Open settings",
        placeholder: "/settings",
        onSelect: () => setValue("/settings"),
        requiresArgument: false,
      },
      {
        id: "slash-notifications",
        command: "/notifications",
        description: "Open notifications",
        placeholder: "/notifications",
        onSelect: () => setValue("/notifications"),
        requiresArgument: false,
      },
      {
        id: "slash-themes",
        command: "/themes",
        description: "Choose theme",
        placeholder: "/themes catppuccin",
        onSelect: () => setValue("/themes "),
        requiresArgument: false,
      },
      {
        id: "slash-appearance",
        command: "/appearance",
        description: "Toggle appearance",
        placeholder: "/appearance",
        onSelect: () => setValue("/appearance"),
        requiresArgument: false,
      },
      {
        id: "slash-mute",
        command: "/mute",
        description: "Disable sounds",
        placeholder: "/mute",
        onSelect: () => setValue("/mute"),
        requiresArgument: false,
      },
      {
        id: "slash-unmute",
        command: "/unmute",
        description: "Enable sounds",
        placeholder: "/unmute",
        onSelect: () => setValue("/unmute"),
        requiresArgument: false,
      },
      {
        id: "slash-home",
        command: "/home",
        description: "Go to home",
        placeholder: "/home",
        onSelect: () => setValue("/home"),
        requiresArgument: false,
      },
      {
        id: "slash-reload",
        command: "/reload",
        description: "Reload the page",
        placeholder: "/reload",
        onSelect: () => setValue("/reload"),
        requiresArgument: false,
      },
      {
        id: "slash-copy-url",
        command: "/copy-url",
        description: "Copy current URL",
        placeholder: "/copy-url",
        onSelect: () => setValue("/copy-url"),
        requiresArgument: false,
      },
      {
        id: "slash-shortcuts",
        command: "/shortcuts",
        description: "Show keyboard shortcuts",
        placeholder: "/shortcuts",
        onSelect: () => setValue("/shortcuts"),
        requiresArgument: false,
      },
      {
        id: "slash-signin",
        command: "/signin",
        description: "Sign in",
        placeholder: "/signin",
        onSelect: () => setValue("/signin"),
        requiresArgument: false,
      },
    ],
    []
  )

  const slashCommandNeedsArgument = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const item of slashCommands) {
      map.set(item.command.slice(1), item.requiresArgument)
    }
    return map
  }, [slashCommands])

  const trimmedValue = value.trim().toLowerCase()
  const startsWithSlash = trimmedValue.startsWith("/")
  const matchingSlashCommands = useMemo(() => {
    if (!startsWithSlash) return []
    if (!trimmedValue) return []
    return slashCommands.filter((item) => item.command.startsWith(trimmedValue))
  }, [slashCommands, startsWithSlash, trimmedValue])

  useEffect(() => {
    if (!parsed || parsed.command !== "search") {
      setSearchLoading(false)
      setSearchResults({ repositories: [], users: [] })
      return
    }

    if (!parsed.argument) {
      setSearchLoading(false)
      setSearchResults({ repositories: [], users: [] })
      return
    }

    const controller = new AbortController()
    const query = parsed.argument
    setSearchLoading(true)

    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        )
        if (!response.ok) {
          throw new Error("Search failed")
        }
        const data = (await response.json()) as {
          repositories?: SearchRepositoryResult[]
          users?: SearchUserResult[]
        }
        setSearchResults({
          repositories: data.repositories ?? [],
          users: data.users ?? [],
        })
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSearchResults({ repositories: [], users: [] })
        }
      } finally {
        setSearchLoading(false)
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [parsed])

  const keywordActions = useMemo(() => {
    const map = new Map<string, () => void>()

    map.set("new", () => router.push("/new"))
    map.set("create repo", () => router.push("/new"))
    map.set("create repository", () => router.push("/new"))
    map.set("repo", () => {
      if (user?.login) router.push(`/${user.login}`)
    })
    map.set("repos", () => {
      if (user?.login) router.push(`/${user.login}`)
    })
    map.set("repository", () => {
      if (user?.login) router.push(`/${user.login}`)
    })
    map.set("repositories", () => {
      if (user?.login) router.push(`/${user.login}`)
    })
    map.set("home", () => router.push("/"))
    map.set("reload", () => window.location.reload())
    map.set("refresh", () => window.location.reload())
    map.set("copy url", () => {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => toast.success("URL copied"))
        .catch(() => toast.error("Could not copy URL"))
    })
    map.set("copy link", () => {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => toast.success("URL copied"))
        .catch(() => toast.error("Could not copy URL"))
    })
    map.set("settings", () => router.push("/settings"))
    map.set("notifications", () => {
      if (onOpenNotificationsChange) {
        onOpenNotificationsChange(true)
      }
    })
    map.set("profile", () => {
      if (user?.login) router.push(`/${user.login}`)
    })
    map.set("sign in", () => {
      window.location.href = "/api/auth/github/login?callbackUrl=/"
    })
    map.set("signin", () => {
      window.location.href = "/api/auth/github/login?callbackUrl=/"
    })
    map.set("open in github", () => {
      const path = window.location.pathname
      const segments = path.split("/").filter(Boolean)
      const githubUrl =
        segments.length >= 2
          ? `https://github.com/${segments[0]}/${segments[1]}`
          : segments.length === 1
            ? `https://github.com/${segments[0]}`
            : "https://github.com"
      window.open(githubUrl, "_blank", "noopener,noreferrer")
    })
    map.set("theme", () => {
      setValue("/themes ")
      requestAnimationFrame(() => inputRef.current?.focus())
    })
    map.set("themes", () => {
      setValue("/themes ")
      requestAnimationFrame(() => inputRef.current?.focus())
    })
    map.set("appearance", () => {
      const nextTheme = toggleTheme()
      toast.success(
        `${getThemeMode(nextTheme) === "dark" ? "Dark" : "Light"} appearance enabled`
      )
    })
    map.set("disable sounds", () => {
      toggleSoundsDisabled()
    })
    map.set("mute", () => {
      toggleSoundsDisabled()
    })
    map.set("toggle sounds", () => {
      toggleSoundsDisabled()
    })
    map.set("enable sounds", () => {
      setUiSoundsDisabled(false)
      setSoundsDisabledState(false)
      toast.success("Sounds enabled")
    })
    map.set("unmute", () => {
      setUiSoundsDisabled(false)
      setSoundsDisabledState(false)
      toast.success("Sounds enabled")
    })

    return map
  }, [
    onOpenNotificationsChange,
    router,
    toggleSoundsDisabled,
    toggleTheme,
    user?.login,
  ])

  const executeSlashCommand = async (command: string, argument: string) => {
    if (command === "home") {
      onOpenChange(false)
      router.push("/")
      return
    }

    if (command === "reload") {
      onOpenChange(false)
      window.location.reload()
      return
    }

    if (["repo", "repos", "repository", "repositories"].includes(command)) {
      if (!user?.login) {
        toast.error("Sign in to view your repositories")
        return
      }
      onOpenChange(false)
      router.push(`/${user.login}`)
      return
    }

    if (command === "search") {
      if (!argument) {
        setValue("/search ")
        requestAnimationFrame(() => inputRef.current?.focus())
        return
      }
      return
    }

    if (["settings", "config"].includes(command)) {
      onOpenChange(false)
      router.push("/settings")
      return
    }

    if (["notifications", "notifs", "inbox"].includes(command)) {
      onOpenChange(false)
      if (onOpenNotificationsChange) {
        onOpenNotificationsChange(true)
      }
      return
    }

    if (["copy-url", "copyurl"].includes(command)) {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.success("URL copied")
      } catch {
        toast.error("Could not copy URL")
      }
      onOpenChange(false)
      return
    }

    if (["shortcuts", "keys", "hotkeys"].includes(command)) {
      setValue("/shortcuts")
      requestAnimationFrame(() => inputRef.current?.focus())
      return
    }

    if (["github", "open-github"].includes(command)) {
      const target = argument || window.location.pathname
      const segments = target.split("/").filter(Boolean)
      const githubUrl =
        segments.length >= 2
          ? `https://github.com/${segments[0]}/${segments[1]}`
          : segments.length === 1
            ? `https://github.com/${segments[0]}`
            : "https://github.com"
      onOpenChange(false)
      window.open(githubUrl, "_blank", "noopener,noreferrer")
      return
    }

    if (["appearance", "toggle-theme"].includes(command)) {
      const nextTheme = toggleTheme()
      toast.success(
        `${getThemeMode(nextTheme) === "dark" ? "Dark" : "Light"} appearance enabled`
      )
      requestAnimationFrame(() => inputRef.current?.focus())
      return
    }

    if (["mute", "disable-sounds", "sounds-off"].includes(command)) {
      toggleSoundsDisabled()
      onOpenChange(false)
      return
    }

    if (["unmute", "enable-sounds", "sounds-on"].includes(command)) {
      setUiSoundsDisabled(false)
      setSoundsDisabledState(false)
      toast.success("Sounds enabled")
      onOpenChange(false)
      return
    }

    if (["theme", "themes"].includes(command)) {
      if (argument) {
        const normalizedArgument = argument.toLowerCase()
        const currentTheme = ((theme === "system" ? resolvedTheme : theme) ??
          "light") as ThemeId
        const matchingTheme = THEME_FAMILIES.find((family) => {
          const label = family.name.toLowerCase()
          return (
            family.id === normalizedArgument ||
            label === normalizedArgument ||
            label.includes(normalizedArgument) ||
            family.keywords.some((keyword) =>
              keyword.includes(normalizedArgument)
            )
          )
        })

        if (!matchingTheme) {
          toast.error("Theme not found")
          return
        }

        setThemeWithTransition(
          getThemeIdForFamily(currentTheme, matchingTheme.id as ThemeFamilyId)
        )
        toast.success(`${matchingTheme.name} enabled`)
        onOpenChange(false)
        return
      }

      setValue("/themes ")
      requestAnimationFrame(() => inputRef.current?.focus())
      return
    }

    if (["signin", "login"].includes(command)) {
      onOpenChange(false)
      window.location.href = "/api/auth/github/login?callbackUrl=/"
      return
    }

    if (command === "new") {
      if (!argument) {
        toast.error("Provide a repository name after /new")
        return
      }

      const response = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: argument,
          private: false,
          auto_init: false,
        }),
      })

      const data = (await response.json()) as {
        repository?: { full_name: string }
      }

      if (!response.ok || !data.repository?.full_name) {
        toast.error("Could not create repository")
        return
      }

      onOpenChange(false)
      router.push(`/${data.repository.full_name}`)
      toast.success("Repository created")
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.key === "k" || event.key === "K") &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        onOpenChange(!open)
        return
      }

      if (
        event.key === "/" &&
        !(event.metaKey || event.ctrlKey || event.altKey)
      ) {
        const target = event.target as HTMLElement | null
        if (
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable)
        ) {
          return
        }
        event.preventDefault()
        onOpenChange(true)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return

    const onContextMenu = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (dialogRef.current && target && dialogRef.current.contains(target)) {
        return
      }
      event.preventDefault()
      onOpenChange(false)
    }

    window.addEventListener("contextmenu", onContextMenu)
    return () => window.removeEventListener("contextmenu", onContextMenu)
  }, [open, onOpenChange])

  const showSearchResults =
    parsed?.command === "search" && Boolean(parsed.argument)
  const showShortcuts = parsed?.command === "shortcuts"
  const showThemes = parsed?.command === "themes" || parsed?.command === "theme"
  const themeSearchQuery = showThemes
    ? (parsed?.argument ?? "").trim().toLowerCase()
    : ""
  const filteredThemeFamilies = useMemo(() => {
    if (!themeSearchQuery) return THEME_FAMILIES
    return THEME_FAMILIES.filter((family) => {
      const haystack = [
        family.name,
        family.description,
        family.id,
        ...family.keywords,
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(themeSearchQuery)
    })
  }, [themeSearchQuery])
  const listHeightClass = startsWithSlash
    ? "max-h-[61.9vh]"
    : showShortcuts
      ? "max-h-[61.9vh]"
      : "max-h-[61.9vh]"
  const shortcutItems = useMemo(
    () => [
      { id: "shortcut-slash", label: "Open command palette", keys: ["/"] },
      { id: "shortcut-star", label: "Star repository", keys: ["S"] },
      { id: "shortcut-fork", label: "Fork repository", keys: ["F"] },
      { id: "shortcut-copy", label: "Copy Git URL", keys: ["C"] },
      { id: "shortcut-zip", label: "Download ZIP", keys: ["I"] },
      { id: "shortcut-tab-1", label: "Code tab", keys: ["1"] },
      { id: "shortcut-tab-2", label: "Commits tab", keys: ["2"] },
      { id: "shortcut-tab-3", label: "Issues tab", keys: ["3"] },
      { id: "shortcut-tab-4", label: "Fourth visible repo tab", keys: ["4"] },
      { id: "shortcut-tab-5", label: "Fifth visible repo tab", keys: ["5"] },
      { id: "shortcut-tab-6", label: "Sixth visible repo tab", keys: ["6"] },
      { id: "shortcut-tab-7", label: "Seventh visible repo tab", keys: ["7"] },
      { id: "shortcut-tab-8", label: "Eighth visible repo tab", keys: ["8"] },
      { id: "shortcut-tab-9", label: "Ninth visible repo tab", keys: ["9"] },
      {
        id: "shortcut-editor-duplicate-up",
        label: "Duplicate line up (editor)",
        keys: ["Alt", "Shift", "↑"],
      },
      {
        id: "shortcut-editor-duplicate-down",
        label: "Duplicate line down (editor)",
        keys: ["Alt", "Shift", "↓"],
      },
      {
        id: "shortcut-editor-move-up",
        label: "Move line up (editor)",
        keys: ["Alt", "↑"],
      },
      {
        id: "shortcut-editor-move-down",
        label: "Move line down (editor)",
        keys: ["Alt", "↓"],
      },
      {
        id: "shortcut-editor-delete-line",
        label: "Delete line (editor)",
        keys: ["Shift", "Delete"],
      },
      {
        id: "shortcut-editor-indent",
        label: "Indent line or selection (editor)",
        keys: ["Tab"],
      },
      {
        id: "shortcut-editor-outdent",
        label: "Outdent line or selection (editor)",
        keys: ["Shift", "Tab"],
      },
      {
        id: "shortcut-delete-repository",
        label: "Delete repository (settings)",
        keys: ["Shift", "Delete"],
      },
    ],
    []
  )

  const searchPrefetchPaths = useMemo(() => {
    return searchResults.repositories.map((repo) => `/${repo.fullName}`)
  }, [searchResults.repositories])

  usePrefetchRoutes(searchPrefetchPaths)

  const matchingUserRepos = useMemo(() => {
    if (!user?.login) return []

    const query = parsed?.argument?.toLowerCase() ?? ""
    if (!query) return []

    return userRepos
      .filter(
        (repo) =>
          repo.fullName.toLowerCase().includes(query) ||
          repo.name.toLowerCase().includes(query)
      )
      .slice(0, 5)
  }, [parsed?.argument, user?.login, userRepos])

  const searchRepositories = useMemo(() => {
    if (!matchingUserRepos.length) return searchResults.repositories

    const userRepoNames = new Set(
      matchingUserRepos.map((repo) => repo.fullName.toLowerCase())
    )
    return searchResults.repositories.filter(
      (repo) => !userRepoNames.has(repo.fullName.toLowerCase())
    )
  }, [matchingUserRepos, searchResults.repositories])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content asChild aria-describedby={undefined}>
          <Command
            shouldFilter={false}
            ref={dialogRef}
            className="fixed top-[15vh] left-1/2 z-60 w-[min(96vw,720px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-foreground/10 bg-background/60 shadow-2xl supports-backdrop-filter:backdrop-blur"
            onContextMenu={(event) => event.preventDefault()}
          >
            <DialogPrimitive.Title className="sr-only">
              Command palette
            </DialogPrimitive.Title>
            <div className="flex items-center gap-3 border-b border-border/80 px-4 py-3">
              <CommandIcon className="size-4 text-muted-foreground" />
              <Command.Input
                value={value}
                onValueChange={setValue}
                ref={inputRef}
                className="h-9 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="Search commands..."
                onKeyDown={async (event) => {
                  if (event.key !== "Enter") return

                  if (showSearchResults || showShortcuts || startsWithSlash) {
                    return
                  }

                  const trimmedInput = value.trim().toLowerCase()
                  if (
                    trimmedInput &&
                    !trimmedInput.startsWith("/") &&
                    filteredEntries.length === 0
                  ) {
                    const keywordAction = keywordActions.get(trimmedInput)
                    if (keywordAction) {
                      event.preventDefault()
                      onOpenChange(false)
                      keywordAction()
                      return
                    }
                  }

                  if (!parsed) return

                  event.preventDefault()

                  const { command, argument } = parsed
                  const needsArgument =
                    slashCommandNeedsArgument.get(command) ?? false
                  if (needsArgument && !argument) {
                    setValue(`/${command} `)
                    requestAnimationFrame(() => inputRef.current?.focus())
                    return
                  }
                  await executeSlashCommand(command, argument)
                }}
              />
              <Kbd>/</Kbd>
            </div>

            <Command.List
              className={`h-auto ${listHeightClass} overflow-y-auto p-2`}
            >
              <Command.Empty className="px-3 py-4 text-sm text-muted-foreground">
                No results found.
              </Command.Empty>
              {showThemes ? (
                <Command.Group>
                  {filteredThemeFamilies.length ? (
                    filteredThemeFamilies.map((family) => (
                      <Command.Item
                        key={family.id}
                        value={`${family.name} ${family.description} ${family.keywords.join(" ")}`}
                        onSelect={() => {
                          const nextTheme = getThemeIdForFamily(
                            currentTheme,
                            family.id as ThemeFamilyId
                          )
                          setThemeWithTransition(nextTheme)
                          toast.success(`${family.name} enabled`)
                        }}
                        className="flex cursor-pointer items-center justify-between gap-5 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/30 aria-selected:bg-accent/50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`size-3 rounded-full border ${
                              currentFamily.id === family.id
                                ? "border-transparent bg-primary"
                                : "border-transparent bg-muted"
                            }`}
                            aria-hidden
                          />
                          <span className="flex shrink-0 items-center -space-x-1">
                            {family.swatches.map((swatch) => (
                              <span
                                key={swatch}
                                className="size-3 rounded-full"
                                style={{ backgroundColor: swatch }}
                              />
                            ))}
                          </span>
                          <span className="truncate">{family.name}</span>
                        </div>
                      </Command.Item>
                    ))
                  ) : (
                    <Command.Item
                      value="No theme results"
                      className="flex cursor-default items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground"
                    >
                      No themes found.
                    </Command.Item>
                  )}
                </Command.Group>
              ) : showSearchResults ? (
                <Command.Group>
                  {searchLoading ? (
                    <Command.Item
                      value="Searching"
                      className="flex cursor-default items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground"
                    >
                      Searching...
                    </Command.Item>
                  ) : (
                    <>
                      {matchingUserRepos.map((repo) => (
                        <Command.Item
                          key={`user-repo-${repo.id}`}
                          value={repo.fullName}
                          onSelect={() => {
                            markCommandUsed("search")
                            onOpenChange(false)
                            router.push(`/${repo.fullName}`)
                          }}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/30 aria-selected:bg-accent/50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <BookMarked className="size-4 shrink-0 text-muted-foreground" />
                            <div className="flex min-w-0 flex-col">
                              <span>{repo.fullName}</span>
                              {repo.description ? (
                                <span className="text-xs text-muted-foreground">
                                  <span className="block max-w-full truncate">
                                    {repo.description}
                                  </span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </Command.Item>
                      ))}
                      {searchRepositories.map((repo) => (
                        <Command.Item
                          key={`repo-${repo.id}`}
                          value={repo.fullName}
                          onSelect={() => {
                            markCommandUsed("search")
                            onOpenChange(false)
                            router.push(`/${repo.fullName}`)
                          }}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/30 aria-selected:bg-accent/50"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <BookMarked className="size-4 shrink-0 text-muted-foreground" />
                            <div className="flex min-w-0 flex-col">
                              <span>{repo.fullName}</span>
                              {repo.description ? (
                                <span className="text-xs text-muted-foreground">
                                  <span className="block max-w-full truncate">
                                    {repo.description}
                                  </span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </Command.Item>
                      ))}
                      {searchResults.users.map((userResult) => (
                        <Command.Item
                          key={`user-${userResult.login}`}
                          value={userResult.login}
                          onSelect={() => {
                            markCommandUsed("search")
                            onOpenChange(false)
                            router.push(`/${userResult.login}`)
                          }}
                          className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/30 aria-selected:bg-accent/50"
                        >
                          <div className="flex items-center gap-3">
                            <User className="size-4 text-muted-foreground" />
                            <span>{userResult.login}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {userResult.type === "Organization"
                              ? "Organization"
                              : "User"}
                          </span>
                        </Command.Item>
                      ))}
                      {!matchingUserRepos.length &&
                      !searchRepositories.length &&
                      !searchResults.users.length ? (
                        <Command.Item
                          value="No search results"
                          className="flex cursor-default items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground"
                        >
                          No results found.
                        </Command.Item>
                      ) : null}
                    </>
                  )}
                </Command.Group>
              ) : showShortcuts ? (
                <Command.Group>
                  {shortcutItems.map((shortcut) => (
                    <Command.Item
                      key={shortcut.id}
                      value={shortcut.label}
                      onSelect={() => {}}
                      className="flex cursor-default items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition aria-selected:bg-accent/50"
                    >
                      <span>{shortcut.label}</span>
                      {shortcut.keys.length > 1 ? (
                        <KbdGroup>
                          {shortcut.keys.map((key) => (
                            <Kbd key={key}>{key}</Kbd>
                          ))}
                        </KbdGroup>
                      ) : (
                        <Kbd>{shortcut.keys[0]}</Kbd>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : startsWithSlash ? (
                matchingSlashCommands.length ? (
                  <Command.Group>
                    {matchingSlashCommands.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={item.command}
                        onSelect={() => {
                          const trimmedInput = value.trim()
                          const commandToken = item.command.slice(1)
                          const hasArgument =
                            trimmedInput.startsWith(item.command) &&
                            trimmedInput.length > item.command.length &&
                            trimmedInput.replace(item.command, "").trim()
                              .length > 0

                          if (!item.requiresArgument || hasArgument) {
                            const argument = hasArgument
                              ? trimmedInput.replace(item.command, "").trim()
                              : ""
                            executeSlashCommand(commandToken, argument)
                            return
                          }

                          item.onSelect()
                          requestAnimationFrame(() => inputRef.current?.focus())
                        }}
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/30 aria-selected:bg-accent/50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="text-muted-foreground">
                            {item.command}
                          </span>
                        </div>
                        <span className="ml-auto hidden truncate text-right text-muted-foreground sm:block">
                          {item.description}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : (
                  <Command.Group>
                    <Command.Item
                      value="No results found"
                      className="flex cursor-default items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground"
                    >
                      No results found.
                    </Command.Item>
                  </Command.Group>
                )
              ) : (
                <Command.Group>
                  {filteredEntries.map((entry) => (
                    <Command.Item
                      key={entry.id}
                      value={entry.label}
                      onSelect={entry.onSelect}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/30 aria-selected:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          {entry.icon}
                        </span>
                        {entry.label}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {parsed && ["new"].includes(parsed.command) ? (
                <Command.Group>
                  <Command.Item
                    value={`Create ${parsed.argument}`}
                    onSelect={async () => {
                      if (!parsed.argument) {
                        toast.error("Provide a repository name after /new")
                        return
                      }

                      const response = await fetch("/api/repositories", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: parsed.argument,
                          private: false,
                          auto_init: false,
                        }),
                      })

                      const data = (await response.json()) as {
                        repository?: { full_name: string }
                      }

                      if (!response.ok || !data.repository?.full_name) {
                        toast.error("Could not create repository")
                        return
                      }

                      onOpenChange(false)
                      router.push(`/${data.repository.full_name}`)
                      toast.success("Repository created")
                    }}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-accent/30 aria-selected:bg-accent/50"
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="size-4 text-muted-foreground" />
                      Create repository
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {parsed.argument || "repo-name"}
                    </span>
                  </Command.Item>
                </Command.Group>
              ) : null}
            </Command.List>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
