import type { SessionUser } from "@/lib/session"
import {
  generateRepositorySummaries,
  type RepositorySummaryInput,
} from "@/lib/openrouter"
import {
  extractSummarySource,
  normalizeSummary,
  SUMMARY_CACHE_VERSION,
} from "@/lib/readme-summary"
import {
  getGitHubProfileSummary,
  getGitHubRepositoryReadme,
  getTrendingRepositoriesPage,
  isGitHubRepositoryStarred,
  type GitHubRepository,
  type GitHubRepositoryReadmeData,
  type GitHubProfile,
} from "@/lib/github"

export type TrendingFeedItem = {
  author: {
    avatarUrl: string | null
    login: string
    name: string
    profileUrl: string
  }
  canFork: boolean
  cloneUrl: string
  forkCount: number
  isStarred: boolean
  media: {
    alt: string
    type: "image" | "video"
    url: string
  } | null
  repoName: string
  repoUrl: string
  starCount: number
  summary: string
  updatedAt: string
}

export type TrendingFeedPage = {
  hasMore: boolean
  items: TrendingFeedItem[]
  nextCursor: string | null
}

const summaryCache = new Map<string, string>()

function isAbsoluteUrl(value: string) {
  return /^[a-z][a-z\d+\-.]*:/i.test(value)
}

function isImageUrl(value: string) {
  return /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)(\?.*)?$/i.test(value)
}

function isVideoUrl(value: string) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(value)
}

function normalizePath(path: string) {
  const parts = path.split("/")
  const normalized: string[] = []

  for (const part of parts) {
    if (!part || part === ".") continue
    if (part === "..") {
      normalized.pop()
      continue
    }

    normalized.push(part)
  }

  return normalized.join("/")
}

function encodePath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

function findReadmeMedia(markdown: string) {
  const mediaPattern =
    /!\[[^\]]*]\(([^)]+)\)|<img[^>]+src=["']([^"']+)["']|<(?:video|source)[^>]+src=["']([^"']+)["']|\[[^\]]*]\(([^)]+)\)/gi

  for (const match of markdown.matchAll(mediaPattern)) {
    const candidate = match[1] ?? match[2] ?? match[3] ?? match[4]
    if (!candidate) continue

    const url = candidate.split(/\s+/)[0]?.trim() ?? ""
    if (!url) continue

    if (match[1] || match[2]) {
      return { type: "image" as const, url }
    }

    if (match[3]) {
      return { type: "video" as const, url }
    }

    if (match[4]) {
      if (isImageUrl(url)) {
        return { type: "image" as const, url }
      }
      if (isVideoUrl(url)) {
        return { type: "video" as const, url }
      }
    }
  }

  return null
}

function resolveRelativeMediaUrl(
  value: string,
  repository: GitHubRepository,
  readme?: GitHubRepositoryReadmeData | null
) {
  const branch = repository.default_branch ?? "main"
  const [basePath] = value.split("#")
  const [pathWithoutQuery] = basePath.split("?")
  const normalizedPath = normalizePath(
    pathWithoutQuery.startsWith("/") ? pathWithoutQuery.slice(1) : pathWithoutQuery
  )

  if (!normalizedPath) return null

  if (process.env.ADRIAN_DATA_DIR) {
    const query = new URLSearchParams({
      owner: repository.owner.login,
      path: normalizedPath,
      repo: repository.name,
    })
    if (branch) {
      query.set("branch", branch)
    }
    return `/api/repository-media?${query.toString()}`
  }

  return `https://raw.githubusercontent.com/${repository.owner.login}/${repository.name}/${branch}/${encodePath(normalizedPath)}`
}

function buildMedia(
  repository: GitHubRepository,
  readme: GitHubRepositoryReadmeData | null
) {
  if (!readme?.markdown) {
    return null
  }

  const media = findReadmeMedia(readme.markdown)
  if (!media) return null

  const resolvedUrl = isAbsoluteUrl(media.url)
    ? media.url
    : resolveRelativeMediaUrl(media.url, repository, readme)

  if (!resolvedUrl) {
    return null
  }

  return {
    alt: `${repository.owner.login}/${repository.name} README media`,
    type: media.type,
    url: resolvedUrl,
  }
}

function fallbackSummary(
  repository: GitHubRepository,
  ownerName: string,
  readme: GitHubRepositoryReadmeData | null
) {
  const readmeSummary = readme?.markdown
    ? extractSummarySource(readme.markdown)
    : ""
  const description = repository.description?.trim() ?? ""
  const text =
    description ||
    readmeSummary ||
    `${ownerName} maintains ${repository.name}, a ${repository.language ?? "general"} repository.`

  return normalizeSummary(text)
}

async function buildSummaryMap(
  sessionUser: SessionUser | null,
  repositories: GitHubRepository[],
  ownerProfiles: Map<string, GitHubProfile>,
  readmes: Map<number, GitHubRepositoryReadmeData | null>
) {
  const pendingInputs: RepositorySummaryInput[] = []
  const pendingKeys: string[] = []

  for (const repository of repositories) {
    const readme = readmes.get(repository.id) ?? null
    const cacheKey = `${SUMMARY_CACHE_VERSION}:${repository.owner.login}/${repository.name}:${readme?.sha ?? repository.updated_at}`
    const cached = summaryCache.get(cacheKey)
    if (cached) continue

    pendingInputs.push({
      description: repository.description,
      forks: repository.forks_count,
      fullName: repository.full_name ?? `${repository.owner.login}/${repository.name}`,
      hasMedia: Boolean(buildMedia(repository, readme)),
      key: cacheKey,
      language: repository.language,
      ownerName:
        ownerProfiles.get(repository.owner.login)?.name ??
        ownerProfiles.get(repository.owner.login)?.login ??
        repository.owner.login,
      readme: readme?.markdown
        ? extractSummarySource(readme.markdown) || repository.description
        : repository.description,
      stars: repository.stargazers_count,
      topics: repository.topics ?? [],
    })
    pendingKeys.push(cacheKey)
  }

  if (pendingInputs.length > 0) {
    const generated = await generateRepositorySummaries(pendingInputs)
    for (const key of pendingKeys) {
      const summary =
        generated.get(key) ??
        pendingInputs.find((entry) => entry.key === key)?.readme ??
        ""
      if (summary) {
        summaryCache.set(key, normalizeSummary(summary))
      }
    }
  }

  const summaryMap = new Map<string, string>()
  for (const repository of repositories) {
    const readme = readmes.get(repository.id) ?? null
    const cacheKey = `${SUMMARY_CACHE_VERSION}:${repository.owner.login}/${repository.name}:${readme?.sha ?? repository.updated_at}`
    const ownerName =
      ownerProfiles.get(repository.owner.login)?.name ??
      ownerProfiles.get(repository.owner.login)?.login ??
      repository.owner.login
    summaryMap.set(
      cacheKey,
      summaryCache.get(cacheKey) ??
        fallbackSummary(repository, ownerName, readme)
    )
  }

  return summaryMap
}

export async function getTrendingFeedPage(
  sessionUser: SessionUser | null,
  options?: { page?: number; perPage?: number }
): Promise<TrendingFeedPage> {
  const page = Math.max(1, options?.page ?? 1)
  const perPage = Math.min(10, Math.max(1, options?.perPage ?? 5))
  const repositories = await getTrendingRepositoriesPage(sessionUser, {
    page,
    perPage,
  })

  if (repositories.length === 0) {
    return { hasMore: false, items: [], nextCursor: null }
  }

  const uniqueOwners = Array.from(
    new Set(repositories.map((repository) => repository.owner.login))
  )

  const [ownerProfilesEntries, readmeEntries, starredEntries] = await Promise.all([
    Promise.all(
      uniqueOwners.map(async (login) => [
        login,
        await getGitHubProfileSummary(login, sessionUser),
      ] as const)
    ),
    Promise.all(
      repositories.map(async (repository) => [
        repository.id,
        await getGitHubRepositoryReadme(
          repository.owner.login,
          repository.name,
          sessionUser,
          repository.default_branch
        ),
      ] as const)
    ),
    Promise.all(
      repositories.map(async (repository) => [
        repository.id,
        await isGitHubRepositoryStarred(
          sessionUser,
          repository.owner.login,
          repository.name
        ),
      ] as const)
    ),
  ])

  const ownerProfiles = new Map(ownerProfilesEntries)
  const readmes = new Map(readmeEntries)
  const starredByRepositoryId = new Map(starredEntries)
  const summaries = await buildSummaryMap(
    sessionUser,
    repositories,
    ownerProfiles,
    readmes
  )

  const currentUserLogin = sessionUser?.login?.toLowerCase() ?? null
  const items = repositories.map((repository) => {
    const readme = readmes.get(repository.id) ?? null
    const profile = ownerProfiles.get(repository.owner.login)
    const summaryKey = `${repository.owner.login}/${repository.name}:${readme?.sha ?? repository.updated_at}`
    const media = buildMedia(repository, readme)

    return {
      author: {
        avatarUrl:
          profile?.avatar_url ?? repository.owner.avatar_url ?? null,
        login: repository.owner.login,
        name: profile?.name ?? profile?.login ?? repository.owner.login,
        profileUrl: `/${repository.owner.login}`,
      },
      canFork:
        Boolean(sessionUser?.login) &&
        repository.owner.login.toLowerCase() !== currentUserLogin,
      cloneUrl: repository.clone_url ?? `${repository.html_url}.git`,
      forkCount: repository.forks_count,
      isStarred: starredByRepositoryId.get(repository.id) ?? false,
      media: media && media.url ? media : null,
      repoName: repository.name,
      repoUrl: `/${repository.full_name ?? `${repository.owner.login}/${repository.name}`}`,
      starCount: repository.stargazers_count,
      summary:
        summaries.get(summaryKey) ??
        fallbackSummary(
          repository,
          profile?.name ?? profile?.login ?? repository.owner.login,
          readme
        ),
      updatedAt: repository.updated_at,
    }
  })

  const hasMore = repositories.length === perPage

  return {
    hasMore,
    items,
    nextCursor: hasMore ? String(page + 1) : null,
  }
}
