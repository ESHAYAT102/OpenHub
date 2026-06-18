"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Copy,
  Eye,
  EyeOff,
  GitFork,
  Search,
  SquareArrowOutUpRight,
  Star,
} from "lucide-react"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ContextMenuItem } from "@/components/ui/context-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { GitHubRepository } from "@/lib/github"
import { cn } from "@/lib/utils"
import { usePrefetchRoutes } from "@/hooks/usePrefetchRoutes"
import A from "./A"
import Loader from "@/components/Loader"

import { Pagination } from "@/components/ui/pagination"

type ProfileRepositoriesProps = {
  compact?: boolean
  enableRemoteSearch?: boolean
  initialQuery?: string
  onVisibleCountChange?: (count: number) => void
  pageSize?: number
  repositories: GitHubRepository[]
  showStarredToggle?: boolean
  showPagination?: boolean
  starredRepositories?: GitHubRepository[]
}

type VisibilityFilter = "all" | "forks" | "archived" | "starred"
type SortMode = "updated" | "stars" | "name"

function formatRelativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const days = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)))

  if (days === 1) return "1d ago"
  if (days < 30) return `${days}d ago`

  const months = Math.floor(days / 30)
  if (months === 1) return "1mo ago"
  if (months < 12) return `${months}mo ago`

  const years = Math.floor(months / 12)
  return years === 1 ? "1y ago" : `${years}y ago`
}

export default function ProfileRepositories({
  compact = false,
  enableRemoteSearch = false,
  initialQuery,
  onVisibleCountChange,
  pageSize = 10,
  repositories,
  showStarredToggle = true,
  showPagination = true,
  starredRepositories = [],
}: ProfileRepositoriesProps) {
  const [query, setQuery] = useState(initialQuery ?? "")
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all")
  const [sortMode, setSortMode] = useState<SortMode>("updated")
  const [currentPage, setCurrentPage] = useState(1)
  const [remoteResults, setRemoteResults] = useState<GitHubRepository[] | null>(
    null
  )
  const [isRemoteLoading, setIsRemoteLoading] = useState(false)
  const remoteSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setCurrentPage(1)

    if (!enableRemoteSearch) {
      return
    }

    if (remoteSearchTimeout.current) {
      clearTimeout(remoteSearchTimeout.current)
    }

    const trimmed = value.trim()
    if (!trimmed) {
      setRemoteResults(null)
      setIsRemoteLoading(false)
      return
    }

    setIsRemoteLoading(true)
    remoteSearchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?query=${encodeURIComponent(trimmed)}`,
          { cache: "no-store" }
        )
        const data = (await response.json()) as {
          repositories: Array<{
            archived: boolean
            clone_url: string
            created_at: string
            id: number
            forks_count: number
            name: string
            owner: { avatar_url: string | null; login: string }
            private: boolean
            fullName: string
            description: string | null
            stars: number
            language: string | null
            url: string
            updated_at: string
            api_url: string
            fork: boolean
            languages_url: string
          }>
        }

        const mapped = data.repositories.map((repo) => ({
          archived: repo.archived,
          clone_url: repo.clone_url,
          created_at: repo.created_at,
          description: repo.description,
          fork: repo.fork,
          forks_count: repo.forks_count,
          full_name: repo.fullName,
          has_discussions: false,
          has_wiki: false,
          html_url: repo.url,
          id: repo.id,
          language: repo.language,
          languages_url: repo.languages_url,
          name: repo.name,
          owner: {
            avatar_url: repo.owner.avatar_url,
            login: repo.owner.login,
          },
          private: repo.private,
          pushed_at: repo.updated_at,
          stargazers_count: repo.stars,
          updated_at: repo.updated_at,
          url: repo.api_url,
        }))

        setRemoteResults(mapped)
      } catch {
        setRemoteResults([])
      } finally {
        setIsRemoteLoading(false)
      }
    }, 350)
  }

  const filteredRepositories = useMemo(() => {
    const sourceRepositories =
      visibilityFilter === "starred" ? starredRepositories : repositories
    const activeRepositories =
      enableRemoteSearch && query.trim()
        ? (remoteResults ?? [])
        : sourceRepositories

    const visibleRepositories = activeRepositories.filter((repository) => {
      const matchesQuery =
        repository.name.toLowerCase().includes(query.toLowerCase()) ||
        repository.description?.toLowerCase().includes(query.toLowerCase())

      const matchesVisibility =
        visibilityFilter === "all" ||
        visibilityFilter === "starred" ||
        (visibilityFilter === "forks" && repository.fork) ||
        (visibilityFilter === "archived" && repository.archived)

      return Boolean(matchesQuery && matchesVisibility)
    })

    return [...visibleRepositories].sort((a, b) => {
      if (sortMode === "stars") {
        return b.stargazers_count - a.stargazers_count
      }

      if (sortMode === "name") {
        return a.name.localeCompare(b.name)
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [
    repositories,
    starredRepositories,
    query,
    visibilityFilter,
    sortMode,
    enableRemoteSearch,
    remoteResults,
  ])

  const handleSortChange = (value: string) => {
    setSortMode(value as "updated" | "stars" | "name")
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(filteredRepositories.length / pageSize)
  const paginatedRepositories = useMemo(() => {
    if (!showPagination) return filteredRepositories
    const start = (currentPage - 1) * pageSize
    return filteredRepositories.slice(start, start + pageSize)
  }, [filteredRepositories, currentPage, pageSize, showPagination])

  const prefetchPaths = useMemo(() => {
    const nextPage = currentPage + 1
    const totalPages = Math.ceil(filteredRepositories.length / pageSize)
    const paths: string[] = []

    if (nextPage <= totalPages) {
      const start = (nextPage - 1) * pageSize
      const reposToPreload = filteredRepositories.slice(start, start + pageSize)
      for (const repo of reposToPreload) {
        paths.push(`/${repo.owner.login}/${repo.name}`)
      }
    }

    return paths
  }, [filteredRepositories, currentPage, pageSize])

  usePrefetchRoutes(prefetchPaths)

  useEffect(() => {
    onVisibleCountChange?.(filteredRepositories.length)
  }, [filteredRepositories.length, onVisibleCountChange])

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            onClear={() => handleQueryChange("")}
            placeholder="Find a repository..."
            className={
              compact
                ? "h-10 rounded-xl pl-10 text-sm"
                : "h-12 rounded-2xl pl-11 text-base"
            }
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(showStarredToggle
            ? (["all", "starred", "forks", "archived"] as const)
            : (["all", "forks", "archived"] as const)
          ).map((value) => (
            <Button
              key={value}
              variant={visibilityFilter === value ? "secondary" : "outline"}
              size={compact ? "sm" : "default"}
              className={
                compact ? "rounded-xl capitalize" : "rounded-2xl capitalize"
              }
              onClick={() => {
                setVisibilityFilter(value)
                setCurrentPage(1)
              }}
            >
              {value}
            </Button>
          ))}
          <Select value={sortMode} onValueChange={handleSortChange}>
            <SelectTrigger
              aria-label="Sort repositories"
              className={cn(
                "border-border bg-background text-foreground",
                compact
                  ? "h-8 rounded-xl px-3 text-xs"
                  : "h-10 rounded-2xl px-4 text-sm"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="stars">Stars</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p
        className={
          compact
            ? "text-xs text-muted-foreground"
            : "text-sm text-muted-foreground"
        }
      >
        {isRemoteLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader className="-ml-1 scale-90" />
            Searching GitHub
          </span>
        ) : null}
        {isRemoteLoading ? " " : null}
        Showing {filteredRepositories.length}{" "}
        {filteredRepositories.length === 1 ? "repository" : "repositories"}
        {visibilityFilter === "starred" ? " from starred repos" : ""}
      </p>

      <Card
        className={
          compact
            ? "overflow-hidden rounded-2xl"
            : "overflow-hidden rounded-3xl"
        }
      >
        <CardContent className="p-0">
          {filteredRepositories.length > 0 ? (
            <div className="divide-y divide-border">
              {paginatedRepositories.map((repository) => (
                <BrowserContextMenu
                  key={repository.id}
                  triggerClassName="block"
                  menuChildren={
                    <>
                      <ContextMenuItem
                        onClick={() => {
                          window.open(
                            repository.html_url,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }}
                      >
                        <SquareArrowOutUpRight />
                        Open in GitHub
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => {
                          window.open(
                            `${window.location.origin}/${repository.owner.login}/${repository.name}`,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }}
                      >
                        <SquareArrowOutUpRight />
                        Open in new tab
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={async () => {
                          await navigator.clipboard.writeText(
                            `${window.location.origin}/${repository.owner.login}/${repository.name}`
                          )
                        }}
                      >
                        <Copy />
                        Copy URL
                      </ContextMenuItem>
                    </>
                  }
                >
                  <A
                    href={`/${repository.owner.login}/${repository.name}`}
                    className={
                      compact
                        ? "grid gap-3 px-4 py-3 transition hover:bg-accent/30 md:grid-cols-[minmax(0,1fr)_120px_80px_80px]"
                        : "grid gap-4 px-5 py-4 transition hover:bg-accent/30 md:grid-cols-[minmax(0,1fr)_140px_90px_90px]"
                    }
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <div
                          className={
                            compact
                              ? "truncate text-lg font-medium tracking-tight"
                              : "truncate text-xl font-medium tracking-tight"
                          }
                        >
                          {repository.owner.login}/{repository.name}
                        </div>
                        <Badge
                          variant="outline"
                          className={compact ? "text-[11px]" : undefined}
                        >
                          {repository.private ? (
                            <EyeOff className="size-3.5" />
                          ) : (
                            <Eye className="size-3.5" />
                          )}
                          {repository.private ? "Private" : "Public"}
                        </Badge>
                        {repository.fork ? (
                          <Badge variant="outline">
                            <GitFork className="size-3.5" />
                            Fork
                          </Badge>
                        ) : null}
                        {repository.archived ? (
                          <Badge variant="outline">Archived</Badge>
                        ) : null}
                      </div>
                      <p
                        className={
                          compact
                            ? "mt-1.5 truncate text-sm text-muted-foreground"
                            : "mt-2 truncate text-base text-muted-foreground"
                        }
                      >
                        {repository.description || "No description"}
                      </p>
                    </div>
                    <div
                      className={
                        compact
                          ? "flex items-center text-xs text-muted-foreground"
                          : "flex items-center text-sm text-muted-foreground"
                      }
                    >
                      <span className="truncate">
                        {repository.language || "Unknown"}
                      </span>
                    </div>
                    <div
                      className={
                        compact
                          ? "flex items-center gap-1.5 text-xs text-muted-foreground"
                          : "flex items-center gap-2 text-sm text-muted-foreground"
                      }
                    >
                      <Star className={compact ? "size-3.5" : "size-4"} />
                      {repository.stargazers_count}
                    </div>
                    <div
                      className={
                        compact
                          ? "flex items-center text-xs text-muted-foreground"
                          : "flex items-center text-sm text-muted-foreground"
                      }
                    >
                      {formatRelativeDate(repository.updated_at)}
                    </div>
                  </A>
                </BrowserContextMenu>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center text-muted-foreground">
              No repositories match the current filters.
            </div>
          )}
        </CardContent>
      </Card>
      {showPagination && totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  )
}
