"use client"

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
} from "react"
import { useRouter } from "next/navigation"

import A from "@/components/A"
import Image from "@/components/Image"
import Loader from "@/components/Loader"
import RepositoryEngagementActions from "@/components/RepositoryEngagementActions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import VideoPlayer from "@/components/VideoPlayer"
import { cn } from "@/lib/utils"
import type { TrendingFeedPage } from "@/lib/trending-feed"

type TrendingFeedProps = {
  initialPage: TrendingFeedPage
  pageSize?: number
}

function formatRelativeDate(value: string) {
  const diff = Date.now() - new Date(value).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return ""
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function TrendingFeedPost({
  item,
}: {
  item: TrendingFeedPage["items"][number]
}) {
  const router = useRouter()

  const navigateToRepo = useCallback(() => {
    router.push(item.repoUrl)
  }, [item.repoUrl, router])

  const isInteractiveTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    return Boolean(
      target.closest(
        "a, button, input, textarea, select, label, [role='button']"
      )
    )
  }

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) return
    navigateToRepo()
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) return

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      navigateToRepo()
    }
  }

  return (
    <article
      className="flex cursor-pointer gap-3 px-4 py-5 transition-colors hover:bg-accent/10 sm:gap-4 sm:px-6"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      aria-label={`Open repository ${item.author.login}/${item.repoName}`}
    >
      <A
        href={item.author.profileUrl}
        prefetch={false}
        className="shrink-0 self-start rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar size="lg" className="size-11">
          {item.author.avatarUrl ? (
            <AvatarImage src={item.author.avatarUrl} alt={item.author.name} />
          ) : null}
          <AvatarFallback>
            {item.author.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </A>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[15px]">
              <A
                href={item.author.profileUrl}
                prefetch={false}
                className="truncate font-semibold tracking-tight text-foreground hover:underline"
              >
                {item.author.name}
              </A>
              <span className="text-muted-foreground">/</span>
              <A
                href={item.repoUrl}
                prefetch={false}
                className="truncate font-medium text-muted-foreground hover:text-foreground hover:underline"
              >
                {item.repoName}
              </A>
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              @{item.author.login}
            </div>
          </div>

          {formatRelativeDate(item.updatedAt) ? (
            <div className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeDate(item.updatedAt)}
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          {item.media ? (
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-muted/40">
              {item.media.type === "video" ? (
                <VideoPlayer
                  className="w-full rounded-none"
                  src={item.media.url}
                  title={item.media.alt}
                />
              ) : (
                <Image
                  alt={item.media.alt}
                  className="block h-auto max-h-[34rem] w-full object-cover"
                  src={item.media.url}
                />
              )}
            </div>
          ) : null}

          <p className="text-[15px] leading-6 whitespace-pre-wrap text-foreground/90">
            {item.summary}
          </p>
        </div>

        <div className="pt-1">
          <RepositoryEngagementActions
            canFork={item.canFork}
            cloneUrl={item.cloneUrl}
            compact
            initialForkCount={item.forkCount}
            initialIsStarred={item.isStarred}
            initialStarCount={item.starCount}
            owner={item.author.login}
            repo={item.repoName}
          />
        </div>
      </div>
    </article>
  )
}

export default function TrendingFeed({
  initialPage,
  pageSize = 5,
}: TrendingFeedProps) {
  const [items, setItems] = useState(initialPage.items)
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor)
  const [hasMore, setHasMore] = useState(initialPage.hasMore)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerLockRef = useRef(false)
  const nextCursorRef = useRef(initialPage.nextCursor)
  const hasMoreRef = useRef(initialPage.hasMore)
  const pageSizeRef = useRef(pageSize)
  const loadTriggeredWhileVisibleRef = useRef(false)

  useEffect(() => {
    setItems(initialPage.items)
    setNextCursor(initialPage.nextCursor)
    setHasMore(initialPage.hasMore)
  }, [initialPage])

  useEffect(() => {
    nextCursorRef.current = nextCursor
  }, [nextCursor])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    pageSizeRef.current = pageSize
  }, [pageSize])

  const loadMore = async () => {
    const cursor = nextCursorRef.current
    if (observerLockRef.current || !hasMoreRef.current || !cursor) {
      return
    }

    observerLockRef.current = true
    setIsLoadingMore(true)

    try {
      const response = await fetch(
        `/api/trending-feed?cursor=${encodeURIComponent(cursor)}&limit=${pageSizeRef.current}`,
        { cache: "no-store" }
      )
      if (!response.ok) {
        setHasMore(false)
        return
      }

      const data = (await response.json()) as TrendingFeedPage
      setItems((current) => [...current, ...data.items])
      setNextCursor(data.nextCursor)
      setHasMore(data.hasMore)
    } catch {
      // Leave the existing items in place and stop retry storms.
      setHasMore(false)
    } finally {
      observerLockRef.current = false
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting)
        if (!isIntersecting) {
          loadTriggeredWhileVisibleRef.current = false
          return
        }

        if (!loadTriggeredWhileVisibleRef.current) {
          loadTriggeredWhileVisibleRef.current = true
          void loadMore()
        }
      },
      { rootMargin: "240px 0px", threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore])

  return (
    <section className="w-full space-y-4">
      <div className="space-y-1 px-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Trending repositories
        </h2>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
        <div className="divide-y divide-border/70">
          {items.map((item) => (
            <TrendingFeedPost
              key={`${item.author.login}/${item.repoName}`}
              item={item}
            />
          ))}
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-16 text-center text-muted-foreground">
            No trending repositories right now.
          </div>
        ) : null}

        <div
          ref={sentinelRef}
          className={cn("px-6 py-5", !hasMore && "hidden")}
        >
          {isLoadingMore ? (
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader className="-ml-1 scale-90" />
              Loading more posts
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Keep scrolling for more trending repos.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
