"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CircleDot,
  FilePlus2,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquare,
  Star,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Loader from "@/components/Loader"
import type { ProfileActivityItem } from "@/lib/github"
import A from "./A"

type HomeActivityProps = {
  activity?: ProfileActivityItem[]
}

function formatRelativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function getCategoryIcon(category: ProfileActivityItem["category"]) {
  switch (category) {
    case "Commits":
      return GitCommitHorizontal
    case "Discussions":
      return MessageSquare
    case "Issues":
      return CircleDot
    case "Pull Requests":
      return GitPullRequest
    case "Repositories Created":
      return FilePlus2
    case "Stars":
      return Star
  }
}

function HomeActivitySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="rounded-3xl">
          <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function HomeActivity({ activity: initialActivity }: HomeActivityProps) {
  const [activity, setActivity] = useState(initialActivity ?? [])
  const [isLoading, setIsLoading] = useState(!initialActivity)
  const [activeTab, setActiveTab] = useState<
    "all" | "commits" | "discussions" | "issues" | "prs"
  >("all")
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (initialActivity) return

    const controller = new AbortController()
    fetch("/api/user/activity", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.activity) {
          setActivity(data.activity)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [initialActivity])

  const { filteredActivity, hasMore } = useMemo(() => {
    const base =
      activeTab === "all" ? activity
      : activeTab === "commits" ? activity.filter((a) => a.category === "Commits")
      : activeTab === "discussions" ? activity.filter((a) => a.category === "Discussions")
      : activeTab === "issues" ? activity.filter((a) => a.category === "Issues")
      : activeTab === "prs" ? activity.filter((a) => a.category === "Pull Requests")
      : activity
    const limit = showAll ? 20 : 4
    return { filteredActivity: base.slice(0, limit), hasMore: base.length > 4 }
  }, [activity, activeTab, showAll])

  const commits = activity.filter((a) => a.category === "Commits")
  const discussions = activity.filter((a) => a.category === "Discussions")
  const issues = activity.filter((a) => a.category === "Issues")
  const prs = activity.filter((a) => a.category === "Pull Requests")

  if (isLoading) {
    return <HomeActivitySkeleton />
  }

  if (activity.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="px-6 py-16 text-center text-muted-foreground">
          No recent activity found.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === "all" ? "secondary" : "outline"}
          size="sm"
          className="rounded-full"
          onClick={() => setActiveTab("all")}
        >
          All
        </Button>
        <Button
          variant={activeTab === "commits" ? "secondary" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("commits")}
        >
          <GitCommitHorizontal className="size-4" />
          Commits
          <span className="text-xs text-muted-foreground">
            {commits.length}
          </span>
        </Button>
        <Button
          variant={activeTab === "discussions" ? "secondary" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("discussions")}
        >
          <MessageSquare className="size-4" />
          Discussions
          <span className="text-xs text-muted-foreground">
            {discussions.length}
          </span>
        </Button>
        <Button
          variant={activeTab === "issues" ? "secondary" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("issues")}
        >
          <CircleDot className="size-4" />
          Issues
          <span className="text-xs text-muted-foreground">{issues.length}</span>
        </Button>
        <Button
          variant={activeTab === "prs" ? "secondary" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("prs")}
        >
          <GitPullRequest className="size-4" />
          PRs
          <span className="text-xs text-muted-foreground">{prs.length}</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredActivity.map((item) => {
          const Icon = getCategoryIcon(item.category)
          return (
            <A
              key={item.id}
              href={item.internalUrl ?? item.url}
              className="block min-w-0"
            >
              <Card className="transition hover:bg-accent/20">
                <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {item.category}
                    </span>
                  </div>
                  {item.status === "open" && (
                    <Badge variant="outline" className="text-xs">
                      Open
                    </Badge>
                  )}
                  {item.status === "closed" && (
                    <Badge variant="secondary" className="text-xs">
                      Closed
                    </Badge>
                  )}
                  {item.status === "merged" && (
                    <Badge className="bg-purple-500/20 text-xs text-purple-400">
                      Merged
                    </Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <p className="truncate text-sm">{item.title}</p>
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    {item.repoName} · {formatRelativeDate(item.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </A>
          )
        })}
      </div>

      {hasMore && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  )
}
