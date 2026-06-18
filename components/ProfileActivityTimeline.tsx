"use client"

import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  CircleDot,
  FilePlus2,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquare,
  MessageSquareText,
  Star,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { ProfileActivityItem } from "@/lib/github"
import A from "./A"

type ProfileActivityTimelineProps = {
  activity: ProfileActivityItem[]
}

function monthKeyFromDate(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${date.getMonth()}`
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(value))
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

function categoryIcon(category: ProfileActivityItem["category"]) {
  switch (category) {
    case "Commits":
      return GitCommitHorizontal
    case "Discussions":
      return MessageSquare
    case "Issues":
      return MessageSquareText
    case "Pull Requests":
      return GitPullRequest
    case "Repositories Created":
      return FilePlus2
    case "Stars":
      return Star
  }
}

export default function ProfileActivityTimeline({
  activity,
}: ProfileActivityTimelineProps) {
  const groupedMonths = useMemo(() => {
    const monthMap = new Map<
      string,
      {
        items: ProfileActivityItem[]
        label: string
      }
    >()

    for (const item of activity) {
      const key = monthKeyFromDate(item.createdAt)
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          items: [],
          label: formatMonthLabel(item.createdAt),
        })
      }

      monthMap.get(key)?.items.push(item)
    }

    return Array.from(monthMap.entries()).map(([key, value]) => {
      const categoryMap = new Map<
        ProfileActivityItem["category"],
        ProfileActivityItem[]
      >()

      for (const item of value.items) {
        if (!categoryMap.has(item.category)) {
          categoryMap.set(item.category, [])
        }
        categoryMap.get(item.category)?.push(item)
      }

      return {
        categories: Array.from(categoryMap.entries()),
        key,
        label: value.label,
      }
    })
  }, [activity])

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        groupedMonths.flatMap((month, monthIndex) =>
          month.categories.map(([category], categoryIndex) => [
            `${month.key}-${category}`,
            monthIndex === 0 && categoryIndex === 0,
          ])
        )
      )
  )

  if (groupedMonths.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="px-6 py-16 text-center text-muted-foreground">
          No recent activity found.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {groupedMonths.map((month) => (
        <div key={month.key} className="space-y-3">
          <div className="flex items-center gap-3 text-sm tracking-[0.18em] text-muted-foreground uppercase">
            <CircleDot className="size-3 fill-current" />
            <span>{month.label}</span>
            <span className="tracking-normal normal-case">
              {month.categories.reduce(
                (sum, [, items]) => sum + items.length,
                0
              )}{" "}
              contributions
            </span>
          </div>

          <div className="space-y-3 border-l border-border/60 pl-4">
            {month.categories.map(([category, items]) => {
              const groupKey = `${month.key}-${category}`
              const isExpanded = expandedGroups[groupKey] ?? false
              const Icon = categoryIcon(category)

              return (
                <Card key={groupKey} className="rounded-2xl">
                  <CardContent className="p-0">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-5 py-4 text-left"
                      onClick={() =>
                        setExpandedGroups((current) => ({
                          ...current,
                          [groupKey]: !isExpanded,
                        }))
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="text-lg font-medium">{category}</span>
                        <span className="text-sm text-muted-foreground">
                          {items.length}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </button>

                    {isExpanded ? (
                      <>
                        <Separator />
                        <div className="divide-y divide-border">
                          {items.slice(0, 8).map((item) => (
                            <A
                              key={item.id}
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-accent/20"
                            >
                              <div className="min-w-0">
                                <div className="mb-1 flex min-w-0 items-center gap-2">
                                  <span className="size-2 rounded-full bg-lime-300" />
                                  <span className="truncate text-base">
                                    {item.title}
                                  </span>
                                  {item.status === "open" && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Open
                                    </Badge>
                                  )}
                                  {item.status === "closed" && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Closed
                                    </Badge>
                                  )}
                                  {item.status === "merged" && (
                                    <Badge className="bg-purple-500/20 text-xs text-purple-400">
                                      Merged
                                    </Badge>
                                  )}
                                </div>
                                <p className="truncate text-sm text-muted-foreground">
                                  {item.repoName}
                                </p>
                              </div>
                              <span className="shrink-0 text-sm text-muted-foreground">
                                {formatRelativeDate(item.createdAt)}
                              </span>
                            </A>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
