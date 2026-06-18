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
  initialPage?: TrendingFeedPage
  pageSize?: number
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

function TrendingFeedSkeleton() {
  return (
    <div className="divide-y divide-border/70">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 px-4 py-5 sm:gap-4 sm:px-6">
          <div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-3 w-12 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
            <div className="flex gap-2 pt-1">
              <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-7 w-16 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const clientFeedCache = new Map<
  string,
  { items: TrendingFeedPage["items"]; nextCursor: string | null; hasMore: boolean }
>()

export default function TrendingFeed({
  initialPage,
  pageSize = 5,
}: TrendingFeedProps) {
  const cacheKey = `trending:${pageSize}`
  const cached = clientFeedCache.get(cacheKey)

  const [items, setItems] = useState(cached?.items ?? initialPage?.items ?? [])
  const [nextCursor, setNextCursor] = useState(
    cached?.nextCursor ?? initialPage?.nextCursor ?? "1"
  )
  const [hasMore, setHasMore] = useState(cached?.hasMore ?? initialPage?.hasMore ?? true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(!initialPage && !cached)
  const [initialLoadError, setInitialLoadError] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const observerLockRef = useRef(false)
  const nextCursorRef = useRef(cached?.nextCursor ?? initialPage?.nextCursor ?? "1")
  const hasMoreRef = useRef(cached?.hasMore ?? initialPage?.hasMore ?? true)
  const pageSizeRef = useRef(pageSize)
  const loadTriggeredWhileVisibleRef = useRef(false)

  useEffect(() => {
    if (initialPage) {
      setItems(initialPage.items)
      setNextCursor(initialPage.nextCursor ?? "1")
      setHasMore(initialPage.hasMore)
      setIsInitialLoading(false)
    }
  }, [initialPage])

  useEffect(() => {
    if (initialPage || cached) return

    const fetchInitial = async () => {
      try {
        const response = await fetch(
          `/api/trending-feed?cursor=1&limit=${pageSize}`,
          { cache: "no-store" }
        )
        if (!response.ok) {
          setInitialLoadError(true)
          setHasMore(false)
          return
        }

        const data = (await response.json()) as TrendingFeedPage
        setItems(data.items)
        setNextCursor(data.nextCursor ?? "1")
        setHasMore(data.hasMore)
      } catch {
        setInitialLoadError(true)
        setHasMore(false)
      } finally {
        setIsInitialLoading(false)
      }
    }

    fetchInitial()
  }, [initialPage, pageSize])

  useEffect(() => {
    clientFeedCache.set(cacheKey, { items, nextCursor, hasMore })
  }, [cacheKey, items, nextCursor, hasMore])

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
      setNextCursor(data.nextCursor ?? "1")
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
    if (!sentinel || !hasMore || isInitialLoading) {
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
  }, [hasMore, isInitialLoading])

  return (
    <section className="w-full space-y-4">
      <div className="space-y-1 px-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Trending repositories
        </h2>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-sm backdrop-blur-sm">
        {isInitialLoading ? (
          <TrendingFeedSkeleton />
        ) : initialLoadError ? (
          <div className="px-6 py-16 text-center text-muted-foreground">
            Failed to load trending repositories.
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </section>
  )
}
