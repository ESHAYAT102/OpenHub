import { notFound } from "next/navigation"

import type { SessionUser } from "@/lib/session"

export type GitHubProfile = {
  avatar_url: string | null
  bio: string | null
  blog: string | null
  company: string | null
  created_at: string
  followers?: number
  following?: number
  html_url: string
  location: string | null
  login: string
  name: string | null
  public_repos: number
  type?: "User" | "Organization"
}

export type GitHubViewerSettings = {
  avatarUrl: string | null
  bio: string | null
  blog: string | null
  canEditProfile: boolean
  canReadNotifications: boolean
  company: string | null
  email: string | null
  hireable: boolean | null
  htmlUrl: string
  location: string | null
  login: string
  name: string | null
  scopes: string[]
  twitterUsername: string | null
}

export type GitHubViewerSettingsUpdateInput = {
  bio?: string | null
  blog?: string | null
  company?: string | null
  hireable?: boolean | null
  location?: string | null
  name?: string | null
  twitter_username?: string | null
}

export type GitHubCreateRepositoryInput = {
  auto_init?: boolean
  description?: string | null
  homepage?: string | null
  name: string
  private?: boolean
}

export type GitHubRepositoryMetadataUpdateInput = {
  archived?: boolean
  default_branch?: string | null
  description?: string | null
  has_discussions?: boolean
  has_wiki?: boolean
  homepage?: string | null
  name?: string
  private?: boolean
}

export type GitHubRepositoryFileUpdateInput = {
  branch?: string
  content: string
  message: string
  path: string
  sha: string
}

export type GitHubRepositoryFileDeleteInput = {
  branch?: string
  message: string
  path: string
  sha: string
}

export type GitHubRepository = {
  archived: boolean
  created_at: string
  default_branch?: string
  description: string | null
  fork: boolean
  forks_count: number
  full_name?: string
  has_discussions: boolean
  has_wiki: boolean
  homepage?: string | null
  html_url: string
  id: number
  language: string | null
  languages_url: string
  name: string
  open_issues_count?: number
  owner: {
    avatar_url?: string | null
    login: string
  }
  permissions?: {
    admin?: boolean
    maintain?: boolean
    push?: boolean
  }
  private: boolean
  pushed_at: string
  size?: number
  stargazers_count: number
  subscribers_count?: number
  topics?: string[]
  updated_at: string
  url: string
}

export type GitHubBranch = {
  name: string
}

export type GitHubRepositoryLanguages = Record<string, number>

export type GitHubRepositoryContent = {
  content?: string
  download_url: string | null
  encoding?: "base64" | "utf-8"
  html_url: string | null
  name: string
  path: string
  sha?: string
  size: number
  type: "dir" | "file" | "submodule" | "symlink"
}

export type GitHubRepositoryReadme = {
  content: string
  html_url: string
  name: string
  path: string
  sha: string
}

export type GitHubRepositoryPageData = {
  contents: GitHubRepositoryContent[]
  rateLimited?: boolean
  rateLimitReset?: number | null
  selectedItem: {
    downloadUrl: string | null
    htmlUrl: string | null
    isImage: boolean
    isMarkdown: boolean
    isText: boolean
    isVideo: boolean
    name: string
    path: string
    sha: string
    text: string
    type: "file"
  } | null
  readme: {
    htmlUrl: string
    markdown: string
    name: string
    path: string
    sha: string
  } | null
  repository: GitHubRepository
}

export type GitHubRepositoryCommit = {
  commit: {
    author: {
      date: string
      name: string
    } | null
    committer: {
      date: string
    } | null
    message: string
  }
  html_url: string
  sha: string
}

export type GitHubRepositoryCommitDiffFile = {
  additions: number
  changes: number
  deletions: number
  filename: string
  patch: string | null
  previousFilename: string | null
  status: string
}

export type GitHubRepositoryCommitDiff = {
  files: GitHubRepositoryCommitDiffFile[]
  patch: string
  sha: string
}

export type GitHubRepositoryIssue = {
  comments: number
  html_url: string
  number: number
  pull_request?: unknown
  state: string
  title: string
  updated_at: string
  user: {
    login: string
  } | null
}

export type GitHubRepositoryPullRequest = {
  comments: number
  html_url: string
  number: number
  state: string
  title: string
  updated_at: string
  user: {
    login: string
  } | null
}

export type GitHubRepositoryDiscussion = {
  comments: number
  html_url: string
  number: number
  title: string
  updated_at: string
  user: {
    login: string
  } | null
}

export type GitHubRepositoryRelease = {
  body: string | null
  draft: boolean
  html_url: string
  name: string | null
  prerelease: boolean
  published_at: string | null
  tag_name: string
}

type GitHubNotificationThread = {
  id: string
  reason: string
  repository: {
    full_name: string
    html_url: string
    private: boolean
  }
  subject: {
    title: string
    type: string
    url: string | null
  }
  unread: boolean
  updated_at: string
  url: string
}

export type GitHubNotification = {
  id: string
  reason: string
  repositoryFullName: string
  repositoryUrl: string
  subjectTitle: string
  subjectType: string
  unread: boolean
  updatedAt: string
  url: string
}

type GitHubEvent = {
  created_at: string
  id: string
  payload: {
    action?: string
    commits?: Array<{
      message: string
      sha: string
    }>
    discussion?: {
      html_url: string
      title: string
      number: number
      updated_at?: string
    }
    issue?: {
      html_url: string
      title: string
      state: string
      number: number
      updated_at?: string
    }
    pull_request?: {
      html_url: string
      title: string
      state: string
      merged: boolean
      number: number
      updated_at?: string
    }
    ref_type?: string
  }
  repo: {
    name: string
  }
  type: string
}

export type ProfileActivityItem = {
  category:
    | "Commits"
    | "Discussions"
    | "Issues"
    | "Pull Requests"
    | "Repositories Created"
    | "Stars"
  createdAt: string
  id: string
  repoName: string
  title: string
  url: string
  status?: "open" | "closed" | "merged"
  internalUrl?: string
}

function getHeaders(accessToken?: string) {
  return {
    Accept: "application/vnd.github+json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    "User-Agent": "Xenon",
  }
}

function parseScopesHeader(value: string | null) {
  if (!value) return []

  return value
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean)
}

type CacheEntry<T> = {
  expires: number
  value: T
}

const CACHE_TTL = 30_000
const PROFILE_CACHE_TTL = 60_000
const REPO_CACHE_TTL = 60_000

const contentsCache = new Map<string, CacheEntry<GitHubRepositoryContent[]>>()
const commitDiffCache = new Map<string, CacheEntry<GitHubRepositoryCommitDiff>>()
const readmeCache = new Map<string, CacheEntry<GitHubRepositoryReadme | null>>()
const selectedItemCache = new Map<
  string,
  CacheEntry<GitHubRepositoryContent | null>
>()
const profileCache = new Map<string, CacheEntry<GitHubProfile>>()
const repositoryCache = new Map<string, CacheEntry<GitHubRepository>>()

function readCache<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expires < Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.value
}

function readCacheEntry<T>(cache: Map<string, CacheEntry<T>>, key: string) {
  const entry = cache.get(key)
  if (!entry) return null
  if (entry.expires < Date.now()) {
    cache.delete(key)
    return null
  }
  return entry
}

function writeCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttl: number = CACHE_TTL
) {
  cache.set(key, { expires: Date.now() + ttl, value })
}

function getCachedProfile(username: string): GitHubProfile | null {
  return readCache(profileCache, `profile:${username}`)
}

function setCachedProfile(username: string, profile: GitHubProfile) {
  writeCache(profileCache, `profile:${username}`, profile, PROFILE_CACHE_TTL)
}

function getCachedRepository(
  owner: string,
  repo: string
): GitHubRepository | null {
  return readCache(repositoryCache, `repo:${owner}/${repo}`)
}

function setCachedRepository(
  owner: string,
  repo: string,
  repository: GitHubRepository
) {
  writeCache(
    repositoryCache,
    `repo:${owner}/${repo}`,
    repository,
    REPO_CACHE_TTL
  )
}

async function fetchJsonWithStatus<T>(url: string, accessToken?: string) {
  const response = await fetch(url, {
    headers: getHeaders(accessToken),
    cache: "no-store",
  })

  const remainingHeader = response.headers.get("x-ratelimit-remaining")
  const resetHeader = response.headers.get("x-ratelimit-reset")
  const rateLimited = response.status === 403 && remainingHeader === "0"
  const rateLimitReset = resetHeader ? Number(resetHeader) * 1000 : null

  if (!response.ok) {
    return {
      data: null as T | null,
      rateLimited,
      rateLimitReset,
      status: response.status,
    }
  }

  return {
    data: (await response.json()) as T,
    rateLimited: false,
    rateLimitReset,
    status: response.status,
  }
}

function getLastPageFromLinkHeader(value: string | null) {
  if (!value) return null

  const match = value.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="last"/)
  return match ? Number(match[1]) : null
}

async function fetchJson<T>(url: string, accessToken?: string) {
  const result = await fetchJsonWithStatus<T>(url, accessToken)
  return result.data
}

async function fetchPaginatedJson<T>(url: string, accessToken?: string) {
  const allItems: T[] = []
  let page = 1

  while (true) {
    const paginatedUrl = new URL(url)
    if (!paginatedUrl.searchParams.has("per_page")) {
      paginatedUrl.searchParams.set("per_page", "100")
    }
    paginatedUrl.searchParams.set("page", String(page))

    const items = await fetchJson<T[]>(paginatedUrl.toString(), accessToken)

    if (!items || items.length === 0) {
      break
    }

    allItems.push(...items)

    if (items.length < 100) {
      break
    }

    page += 1
  }

  return allItems
}

export async function getGitHubViewerSettings(sessionUser: SessionUser | null) {
  if (!sessionUser?.accessToken) {
    return null
  }

  const response = await fetch("https://api.github.com/user", {
    cache: "no-store",
    headers: getHeaders(sessionUser.accessToken),
  })

  if (!response.ok) {
    return null
  }

  const scopes = parseScopesHeader(response.headers.get("x-oauth-scopes"))
  const data = (await response.json()) as {
    avatar_url: string | null
    bio: string | null
    blog: string | null
    company: string | null
    email: string | null
    hireable: boolean | null
    html_url: string
    location: string | null
    login: string
    name: string | null
    twitter_username?: string | null
  }

  return {
    avatarUrl: data.avatar_url,
    bio: data.bio,
    blog: data.blog,
    canEditProfile: scopes.includes("user"),
    canReadNotifications: scopes.includes("notifications"),
    company: data.company,
    email: data.email,
    hireable: data.hireable,
    htmlUrl: data.html_url,
    location: data.location,
    login: data.login,
    name: data.name,
    scopes,
    twitterUsername: data.twitter_username ?? null,
  } satisfies GitHubViewerSettings
}

export async function updateGitHubViewerSettings(
  sessionUser: SessionUser | null,
  input: GitHubViewerSettingsUpdateInput
) {
  if (!sessionUser?.accessToken) {
    return { error: "unauthorized" as const, settings: null, status: 401 }
  }

  const response = await fetch("https://api.github.com/user", {
    body: JSON.stringify(input),
    headers: {
      ...getHeaders(sessionUser.accessToken),
      "Content-Type": "application/json",
    },
    method: "PATCH",
  })

  if (!response.ok) {
    return {
      error:
        response.status === 403
          ? ("forbidden" as const)
          : response.status === 422
            ? ("validation_failed" as const)
            : ("request_failed" as const),
      settings: null,
      status: response.status,
    }
  }

  const scopes = parseScopesHeader(response.headers.get("x-oauth-scopes"))
  const data = (await response.json()) as {
    avatar_url: string | null
    bio: string | null
    blog: string | null
    company: string | null
    email: string | null
    hireable: boolean | null
    html_url: string
    location: string | null
    login: string
    name: string | null
    twitter_username?: string | null
  }

  return {
    error: null,
    settings: {
      avatarUrl: data.avatar_url,
      bio: data.bio,
      blog: data.blog,
      canEditProfile: scopes.includes("user"),
      canReadNotifications: scopes.includes("notifications"),
      company: data.company,
      email: data.email,
      hireable: data.hireable,
      htmlUrl: data.html_url,
      location: data.location,
      login: data.login,
      name: data.name,
      scopes,
      twitterUsername: data.twitter_username ?? null,
    } satisfies GitHubViewerSettings,
    status: response.status,
  }
}

export async function createGitHubRepository(
  sessionUser: SessionUser | null,
  input: GitHubCreateRepositoryInput
) {
  if (!sessionUser?.accessToken) {
    return {
      error: "unauthorized" as const,
      repository: null,
      status: 401,
    }
  }

  const response = await fetch("https://api.github.com/user/repos", {
    body: JSON.stringify(input),
    headers: {
      ...getHeaders(sessionUser.accessToken),
      "Content-Type": "application/json",
    },
    method: "POST",
  })

  if (!response.ok) {
    return {
      error:
        response.status === 403
          ? ("forbidden" as const)
          : response.status === 422
            ? ("validation_failed" as const)
            : ("request_failed" as const),
      repository: null,
      status: response.status,
    }
  }

  return {
    error: null,
    repository: (await response.json()) as GitHubRepository,
    status: response.status,
  }
}

export async function updateGitHubRepositoryMetadata(
  sessionUser: SessionUser | null,
  owner: string,
  repo: string,
  input: GitHubRepositoryMetadataUpdateInput
) {
  if (!sessionUser?.accessToken) {
    return {
      error: "unauthorized" as const,
      repository: null,
      status: 401,
    }
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      body: JSON.stringify(input),
      headers: {
        ...getHeaders(sessionUser.accessToken),
        "Content-Type": "application/json",
      },
      method: "PATCH",
    }
  )

  if (!response.ok) {
    return {
      error:
        response.status === 403
          ? ("forbidden" as const)
          : response.status === 422
            ? ("validation_failed" as const)
            : ("request_failed" as const),
      repository: null,
      status: response.status,
    }
  }

  return {
    error: null,
    repository: (await response.json()) as GitHubRepository,
    status: response.status,
  }
}

export async function deleteGitHubRepository(
  sessionUser: SessionUser | null,
  owner: string,
  repo: string
) {
  if (!sessionUser?.accessToken) {
    return {
      error: "unauthorized" as const,
      status: 401,
    }
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: getHeaders(sessionUser.accessToken),
      method: "DELETE",
    }
  )

  if (!response.ok) {
    return {
      error:
        response.status === 403
          ? ("forbidden" as const)
          : ("request_failed" as const),
      status: response.status,
    }
  }

  return {
    error: null,
    status: response.status,
  }
}

export async function isGitHubRepositoryStarred(
  sessionUser: SessionUser | null,
  owner: string,
  repo: string
) {
  if (!sessionUser?.accessToken) {
    return false
  }

  const response = await fetch(
    `https://api.github.com/user/starred/${owner}/${repo}`,
    {
      cache: "no-store",
      headers: getHeaders(sessionUser.accessToken),
    }
  )

  return response.ok
}

export async function starGitHubRepository(
  sessionUser: SessionUser | null,
  owner: string,
  repo: string
) {
  if (!sessionUser?.accessToken) {
    return { error: "unauthorized" as const, status: 401 }
  }

  const response = await fetch(
    `https://api.github.com/user/starred/${owner}/${repo}`,
    {
      headers: {
        ...getHeaders(sessionUser.accessToken),
        "Content-Length": "0",
      },
      method: "PUT",
    }
  )

  return {
    error: response.ok ? null : ("request_failed" as const),
    status: response.status,
  }
}

export async function unstarGitHubRepository(
  sessionUser: SessionUser | null,
  owner: string,
  repo: string
) {
  if (!sessionUser?.accessToken) {
    return { error: "unauthorized" as const, status: 401 }
  }

  const response = await fetch(
    `https://api.github.com/user/starred/${owner}/${repo}`,
    {
      headers: getHeaders(sessionUser.accessToken),
      method: "DELETE",
    }
  )

  return {
    error: response.ok ? null : ("request_failed" as const),
    status: response.status,
  }
}

export async function forkGitHubRepository(
  sessionUser: SessionUser | null,
  owner: string,
  repo: string,
  forkName?: string
) {
  if (!sessionUser?.accessToken) {
    return { error: "unauthorized" as const, status: 401 }
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/forks`,
    {
      headers: getHeaders(sessionUser.accessToken),
      method: "POST",
      body: forkName ? JSON.stringify({ name: forkName }) : undefined,
    }
  )

  return {
    error: response.ok ? null : ("request_failed" as const),
    status: response.status,
  }
}

function notificationUrlFromApiUrl(
  apiUrl: string | null,
  repositoryUrl: string
) {
  if (!apiUrl) return repositoryUrl

  const parsedUrl = new URL(apiUrl)
  const path = parsedUrl.pathname
  const repoMatch = path.match(/^\/repos\/([^/]+)\/([^/]+)\/(.+)$/)

  if (!repoMatch) return repositoryUrl

  const [, owner, repo, rest] = repoMatch
  const base = `https://github.com/${owner}/${repo}`

  if (rest.startsWith("pulls/")) {
    return `${base}/pull/${rest.replace("pulls/", "")}`
  }

  if (rest.startsWith("issues/")) {
    return `${base}/issues/${rest.replace("issues/", "")}`
  }

  if (rest.startsWith("commits/")) {
    return `${base}/commit/${rest.replace("commits/", "")}`
  }

  if (rest.startsWith("discussions/")) {
    return `${base}/discussions/${rest.replace("discussions/", "")}`
  }

  if (rest.startsWith("releases/")) {
    return `${base}/${rest}`
  }

  return repositoryUrl
}

async function resolveRepositoryLanguages(
  repositories: GitHubRepository[],
  accessToken?: string
) {
  const repositoriesMissingLanguage = repositories.filter(
    (repository) => !repository.language
  )

  if (repositoriesMissingLanguage.length === 0) {
    return repositories
  }

  const resolvedLanguages = await Promise.all(
    repositoriesMissingLanguage.map(async (repository) => {
      const languages = await fetchJson<Record<string, number>>(
        repository.languages_url,
        accessToken
      )

      const topLanguage = languages
        ? (Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] ??
          null)
        : null

      if (topLanguage) {
        return [repository.id, topLanguage] as const
      }

      const repositoryDetails = await fetchJson<{ language: string | null }>(
        repository.url,
        accessToken
      )

      if (repositoryDetails?.language) {
        return [repository.id, repositoryDetails.language] as const
      }

      const readme = await fetchJson<unknown>(
        `${repository.url}/readme`,
        accessToken
      )

      if (readme) {
        return [repository.id, "Markdown"] as const
      }

      return [repository.id, null] as const
    })
  )

  const languageMap = new Map(resolvedLanguages)

  return repositories.map((repository) => ({
    ...repository,
    language: repository.language ?? languageMap.get(repository.id) ?? null,
  }))
}

export async function getGitHubViewerRepositories(
  sessionUser: SessionUser | null
) {
  if (!sessionUser) {
    return []
  }

  const endpoint = sessionUser.accessToken
    ? "https://api.github.com/user/repos?sort=updated&per_page=50&visibility=all&affiliation=owner,collaborator,organization_member"
    : `https://api.github.com/users/${sessionUser.login}/repos?sort=updated&per_page=50`

  const repositories =
    (await fetchJson<GitHubRepository[]>(endpoint, sessionUser.accessToken)) ??
    []

  return resolveRepositoryLanguages(repositories, sessionUser.accessToken)
}

export async function getTrendingRepositories(sessionUser: SessionUser | null) {
  const accessToken = sessionUser?.accessToken
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const query = new URLSearchParams({
    order: "desc",
    per_page: "50",
    q: `created:>=${since.toISOString().slice(0, 10)}`,
    sort: "stars",
  })

  const result = await fetchJson<{
    items: GitHubRepository[]
  }>(
    `https://api.github.com/search/repositories?${query.toString()}`,
    accessToken
  )

  return resolveRepositoryLanguages(result?.items ?? [], accessToken)
}

export async function getGitHubProfilePageData(
  username: string,
  sessionUser: SessionUser | null
) {
  const isOwnProfile =
    Boolean(sessionUser?.accessToken) &&
    sessionUser?.login.toLowerCase() === username.toLowerCase()
  const accessToken = sessionUser?.accessToken

  const cachedProfile = !accessToken ? getCachedProfile(username) : null
  if (cachedProfile && !isOwnProfile) {
    const repositoriesEndpoint =
      cachedProfile.type === "Organization"
        ? `https://api.github.com/orgs/${username}/repos?sort=updated&per_page=100&type=public`
        : `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`

    const repositories =
      (await fetchJson<GitHubRepository[]>(
        repositoriesEndpoint,
        accessToken
      )) ?? []

    return {
      isOwnProfile,
      profile: cachedProfile,
      rateLimited: false,
      rateLimitReset: null,
      repositories: await resolveRepositoryLanguages(repositories, accessToken),
    }
  }

  const ownProfileResponse = isOwnProfile
    ? await fetchJsonWithStatus<GitHubProfile>(
        "https://api.github.com/user",
        accessToken
      )
    : null
  const userProfileResponse = !isOwnProfile
    ? await fetchJsonWithStatus<GitHubProfile>(
        `https://api.github.com/users/${username}`,
        accessToken
      )
    : null
  const organizationProfileResponse = !isOwnProfile
    ? await fetchJsonWithStatus<GitHubProfile>(
        `https://api.github.com/orgs/${username}`,
        accessToken
      )
    : null

  const profile =
    ownProfileResponse?.data ??
    userProfileResponse?.data ??
    organizationProfileResponse?.data

  const rateLimited = [
    ownProfileResponse,
    userProfileResponse,
    organizationProfileResponse,
  ].some((response) => response?.rateLimited)
  const rateLimitReset =
    [
      ownProfileResponse?.rateLimitReset,
      userProfileResponse?.rateLimitReset,
      organizationProfileResponse?.rateLimitReset,
    ]
      .filter((value): value is number => typeof value === "number")
      .sort((a, b) => b - a)[0] ?? null

  if (!profile) {
    if (rateLimited) {
      return {
        isOwnProfile,
        profile: buildPlaceholderProfile(username),
        rateLimited: true,
        rateLimitReset,
        repositories: [],
      }
    }

    const statuses = [
      ownProfileResponse?.status,
      userProfileResponse?.status,
      organizationProfileResponse?.status,
    ].filter((status): status is number => typeof status === "number")

    if (statuses.length > 0 && statuses.every((status) => status === 404)) {
      if (rateLimited) {
        return {
          isOwnProfile,
          profile: buildPlaceholderProfile(username),
          rateLimited: true,
          rateLimitReset,
          repositories: [],
        }
      }
      notFound()
    }

    throw new Error(
      `Failed to load GitHub profile for ${username}. Statuses: ${statuses.join(", ")}`
    )
  }

  const repositoriesEndpoint = isOwnProfile
    ? "https://api.github.com/user/repos?sort=updated&per_page=100&visibility=all&affiliation=owner"
    : profile.type === "Organization"
      ? `https://api.github.com/orgs/${username}/repos?sort=updated&per_page=100&type=public`
      : `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`

  const repositories =
    (await fetchJson<GitHubRepository[]>(repositoriesEndpoint, accessToken)) ??
    []

  if (profile && !accessToken) {
    setCachedProfile(username, profile)
  }

  return {
    isOwnProfile,
    profile,
    rateLimited,
    rateLimitReset,
    repositories: await resolveRepositoryLanguages(repositories, accessToken),
  }
}

export async function getGitHubRepository(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null
) {
  const accessToken = sessionUser?.accessToken

  const cachedRepo = !accessToken ? getCachedRepository(owner, repo) : null
  if (cachedRepo) {
    return { repository: cachedRepo, rateLimited: false, rateLimitReset: null }
  }

  const { data, status, rateLimited, rateLimitReset } =
    await fetchJsonWithStatus<GitHubRepository>(
      `https://api.github.com/repos/${owner}/${repo}`,
      accessToken
    )

  if (!data && status === 404) {
    return { repository: null, rateLimited: false, rateLimitReset: null }
  }

  if (!data && rateLimited) {
    return { repository: null, rateLimited: true, rateLimitReset }
  }

  if (data && !accessToken) {
    setCachedRepository(owner, repo, data)
  }

  return { repository: data, rateLimited: false, rateLimitReset: null }
}

export async function getGitHubRepositoryLanguages(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null
) {
  const accessToken = sessionUser?.accessToken

  return (
    (await fetchJson<GitHubRepositoryLanguages>(
      `https://api.github.com/repos/${owner}/${repo}/languages`,
      accessToken
    )) ?? {}
  )
}

function decodeBase64Content(value: string) {
  return Buffer.from(value.replace(/\n/g, ""), "base64").toString("utf8")
}

function encodeBase64Content(value: string) {
  return Buffer.from(value, "utf8").toString("base64")
}

function isImagePath(path: string) {
  return /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico)$/i.test(path)
}

function isVideoPath(path: string) {
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(path)
}

function buildPlaceholderProfile(login: string): GitHubProfile {
  return {
    avatar_url: null,
    bio: null,
    blog: null,
    company: null,
    created_at: new Date(0).toISOString(),
    followers: 0,
    following: 0,
    html_url: `https://github.com/${login}`,
    location: null,
    login,
    name: null,
    public_repos: 0,
    type: "User",
  }
}

export async function getGitHubRepositoryPageData(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null,
  selectedPath?: string,
  branch?: string
) {
  const accessToken = sessionUser?.accessToken
  const {
    repository,
    rateLimited: repoRateLimited,
    rateLimitReset: repoRateLimitReset,
  } = await getGitHubRepository(owner, repo, sessionUser)

  if (!repository) {
    if (repoRateLimited) {
      return {
        contents: [],
        readme: null,
        repository: null,
        selectedItem: null,
        rateLimited: true,
        rateLimitReset: repoRateLimitReset,
      }
    }
    return null
  }

  const refQuery = branch ? `?ref=${encodeURIComponent(branch)}` : ""
  const cacheBase = `${sessionUser?.login ?? "anon"}:${owner}/${repo}:${branch ?? "default"}`
  const contentsCacheKey = `${cacheBase}:contents:root`
  const readmeCacheKey = `${cacheBase}:readme`
  const selectedCacheKey = selectedPath
    ? `${cacheBase}:selected:${selectedPath}`
    : null

  const cachedContents = readCache(contentsCache, contentsCacheKey)
  const readmeEntry = readCacheEntry(readmeCache, readmeCacheKey)
  const cachedReadme = readmeEntry ? readmeEntry.value : null
  const selectedEntry = selectedCacheKey
    ? readCacheEntry(selectedItemCache, selectedCacheKey)
    : null
  const cachedSelected = selectedEntry ? selectedEntry.value : null

  const [contentsResult, readmeResult, selectedItemResult] = await Promise.all([
    cachedContents
      ? Promise.resolve({
          data: cachedContents,
          status: 200,
          rateLimited: false,
          rateLimitReset: null,
        })
      : fetchJsonWithStatus<
          GitHubRepositoryContent[] | GitHubRepositoryContent
        >(
          `https://api.github.com/repos/${owner}/${repo}/contents${refQuery}`,
          accessToken
        ),
    readmeEntry
      ? Promise.resolve({
          data: cachedReadme,
          status: cachedReadme ? 200 : 404,
          rateLimited: false,
          rateLimitReset: null,
        })
      : fetchJsonWithStatus<GitHubRepositoryReadme>(
          `https://api.github.com/repos/${owner}/${repo}/readme${refQuery}`,
          accessToken
        ),
    selectedPath
      ? selectedEntry
        ? Promise.resolve({
            data: cachedSelected,
            status: cachedSelected ? 200 : 404,
            rateLimited: false,
            rateLimitReset: null,
          })
        : fetchJsonWithStatus<GitHubRepositoryContent>(
            `https://api.github.com/repos/${owner}/${repo}/contents/${selectedPath}${refQuery}`,
            accessToken
          )
      : Promise.resolve({
          data: null,
          status: 200,
          rateLimited: false,
          rateLimitReset: null,
        }),
  ])

  if (!cachedContents && Array.isArray(contentsResult.data)) {
    writeCache(contentsCache, contentsCacheKey, contentsResult.data)
  }

  if (!readmeEntry) {
    writeCache(readmeCache, readmeCacheKey, readmeResult.data ?? null)
  }

  if (selectedCacheKey && !selectedEntry) {
    writeCache(
      selectedItemCache,
      selectedCacheKey,
      selectedItemResult.data ?? null
    )
  }

  const contents = Array.isArray(contentsResult.data)
    ? [...contentsResult.data].sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name)
        }

        if (a.type === "dir") return -1
        if (b.type === "dir") return 1
        return a.name.localeCompare(b.name)
      })
    : []

  const rateLimited =
    contentsResult.rateLimited ||
    readmeResult.rateLimited ||
    selectedItemResult.rateLimited
  const rateLimitReset =
    [
      contentsResult.rateLimitReset,
      readmeResult.rateLimitReset,
      selectedItemResult.rateLimitReset,
    ]
      .filter((value): value is number => typeof value === "number")
      .sort((a, b) => b - a)[0] ?? null
  const selectedData = selectedItemResult.data

  return {
    contents,
    rateLimited,
    rateLimitReset,
    selectedItem:
      selectedData && selectedData.type === "file"
        ? {
            downloadUrl: selectedData.download_url,
            htmlUrl: selectedData.html_url,
            isImage: isImagePath(selectedData.name),
            isMarkdown: selectedData.name.toLowerCase().endsWith(".md"),
            isText:
              !isImagePath(selectedData.name) &&
              !isVideoPath(selectedData.name),
            isVideo: isVideoPath(selectedData.name),
            name: selectedData.name,
            path: selectedData.path,
            sha: selectedData.sha ?? "",
            text:
              selectedData.content &&
              selectedData.encoding === "base64" &&
              !isImagePath(selectedData.name) &&
              !isVideoPath(selectedData.name)
                ? decodeBase64Content(selectedData.content)
                : selectedData.content && !selectedData.encoding
                  ? selectedData.content
                  : "",
            type: "file",
          }
        : null,
    readme: readmeResult.data
      ? {
          htmlUrl: readmeResult.data.html_url,
          markdown: decodeBase64Content(readmeResult.data.content),
          name: readmeResult.data.name,
          path: readmeResult.data.path,
          sha: readmeResult.data.sha,
        }
      : null,
    repository,
  } satisfies GitHubRepositoryPageData
}

export async function getGitHubRepositoryContents(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null,
  path?: string,
  branch?: string
) {
  const accessToken = sessionUser?.accessToken
  const refQuery = branch ? `?ref=${encodeURIComponent(branch)}` : ""
  const endpoint = path
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}${refQuery}`
    : `https://api.github.com/repos/${owner}/${repo}/contents${refQuery}`

  const cacheKey = `${sessionUser?.login ?? "anon"}:${owner}/${repo}:${branch ?? "default"}:contents:${path ?? "root"}`
  const cached = readCache(contentsCache, cacheKey)
  if (cached) {
    return cached
  }

  const result = await fetchJson<
    GitHubRepositoryContent[] | GitHubRepositoryContent
  >(endpoint, accessToken)

  const contents = Array.isArray(result)
    ? [...result].sort((a, b) => {
        if (a.type === b.type) {
          return a.name.localeCompare(b.name)
        }

        if (a.type === "dir") return -1
        if (b.type === "dir") return 1
        return a.name.localeCompare(b.name)
      })
    : []

  writeCache(contentsCache, cacheKey, contents)

  return contents
}

export async function updateGitHubRepositoryFile(
  sessionUser: SessionUser | null,
  owner: string,
  repo: string,
  input: GitHubRepositoryFileUpdateInput
) {
  if (!sessionUser?.accessToken) {
    return {
      commit: null,
      error: "unauthorized" as const,
      status: 401,
    }
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${input.path}`,
    {
      body: JSON.stringify({
        branch: input.branch,
        content: encodeBase64Content(input.content),
        message: input.message,
        sha: input.sha,
      }),
      headers: {
        ...getHeaders(sessionUser.accessToken),
        "Content-Type": "application/json",
      },
      method: "PUT",
    }
  )

  if (!response.ok) {
    return {
      commit: null,
      error:
        response.status === 403
          ? ("forbidden" as const)
          : response.status === 409
            ? ("conflict" as const)
            : response.status === 422
              ? ("validation_failed" as const)
              : ("request_failed" as const),
      status: response.status,
    }
  }

  return {
    commit: (await response.json()) as {
      commit?: {
        sha: string
      }
      content?: {
        sha: string
      }
    },
    error: null,
    status: response.status,
  }
}

export async function deleteGitHubRepositoryFile(
  sessionUser: SessionUser | null,
  owner: string,
  repo: string,
  input: GitHubRepositoryFileDeleteInput
) {
  if (!sessionUser?.accessToken) {
    return {
      commit: null,
      error: "unauthorized" as const,
      status: 401,
    }
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${input.path}`,
    {
      body: JSON.stringify({
        branch: input.branch,
        message: input.message,
        sha: input.sha,
      }),
      headers: {
        ...getHeaders(sessionUser.accessToken),
        "Content-Type": "application/json",
      },
      method: "DELETE",
    }
  )

  if (!response.ok) {
    return {
      commit: null,
      error:
        response.status === 403
          ? ("forbidden" as const)
          : response.status === 409
            ? ("conflict" as const)
            : response.status === 422
              ? ("validation_failed" as const)
              : ("request_failed" as const),
      status: response.status,
    }
  }

  return {
    commit: (await response.json()) as {
      commit?: {
        sha: string
      }
      content?: {
        sha: string
      }
    },
    error: null,
    status: response.status,
  }
}

export async function getGitHubRepositoryBranches(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null
) {
  const accessToken = sessionUser?.accessToken

  return fetchPaginatedJson<GitHubBranch>(
    `https://api.github.com/repos/${owner}/${repo}/branches`,
    accessToken
  )
}

export async function getGitHubRepositoryCommits(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null,
  branch?: string
) {
  const accessToken = sessionUser?.accessToken
  const query = new URLSearchParams({ per_page: "20" })

  if (branch) {
    query.set("sha", branch)
  }

  return (
    (await fetchJson<GitHubRepositoryCommit[]>(
      `https://api.github.com/repos/${owner}/${repo}/commits?${query.toString()}`,
      accessToken
    )) ?? []
  )
}

export async function getGitHubRepositoryCommitCount(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null,
  branch?: string
) {
  const accessToken = sessionUser?.accessToken
  const query = new URLSearchParams({ per_page: "1" })

  if (branch) {
    query.set("sha", branch)
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?${query.toString()}`,
    {
      cache: "no-store",
      headers: getHeaders(accessToken),
    }
  )

  if (!response.ok) {
    return 0
  }

  const commits = (await response.json()) as GitHubRepositoryCommit[]
  if (commits.length === 0) {
    return 0
  }

  return (
    getLastPageFromLinkHeader(response.headers.get("link")) ?? commits.length
  )
}

function buildCommitPatch(files: GitHubRepositoryCommitDiffFile[]) {
  return files
    .filter((file) => file.patch)
    .map((file) => {
      const previousPath = file.previousFilename ?? file.filename
      const oldPath =
        file.status === "added" ? "/dev/null" : `a/${previousPath}`
      const newPath =
        file.status === "removed" ? "/dev/null" : `b/${file.filename}`

      return [
        `diff --git a/${previousPath} b/${file.filename}`,
        file.status === "renamed"
          ? `rename from ${previousPath}\nrename to ${file.filename}`
          : null,
        `--- ${oldPath}`,
        `+++ ${newPath}`,
        file.patch,
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n")
}

export async function getGitHubRepositoryCommitDiff(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null,
  sha: string
) {
  const accessToken = sessionUser?.accessToken
  const cacheKey = `${sessionUser?.login ?? "anon"}:${owner}/${repo}:commit:${sha}`
  const cached = readCache(commitDiffCache, cacheKey)
  if (cached) {
    return cached
  }

  const commit = await fetchJson<{
    files?: Array<{
      additions?: number
      changes?: number
      deletions?: number
      filename: string
      patch?: string
      previous_filename?: string
      status: string
    }>
    sha: string
  }>(
    `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(sha)}`,
    accessToken
  )

  const files =
    commit?.files?.map((file) => ({
      additions: file.additions ?? 0,
      changes: file.changes ?? 0,
      deletions: file.deletions ?? 0,
      filename: file.filename,
      patch: file.patch ?? null,
      previousFilename: file.previous_filename ?? null,
      status: file.status,
    })) ?? []

  const diff = {
    files,
    patch: buildCommitPatch(files),
    sha: commit?.sha ?? sha,
  } satisfies GitHubRepositoryCommitDiff

  writeCache(commitDiffCache, cacheKey, diff, REPO_CACHE_TTL)

  return diff
}

export async function getGitHubRepositoryIssues(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null
) {
  const accessToken = sessionUser?.accessToken
  const issues =
    (await fetchJson<GitHubRepositoryIssue[]>(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=20`,
      accessToken
    )) ?? []

  return issues.filter((issue) => !issue.pull_request)
}

export async function getGitHubRepositoryIssueCount(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null
) {
  const accessToken = sessionUser?.accessToken
  const query = encodeURIComponent(`repo:${owner}/${repo} is:issue is:open`)

  const result = await fetchJsonWithStatus<{ total_count: number }>(
    `https://api.github.com/search/issues?q=${query}&per_page=1`,
    accessToken
  )

  return result?.data?.total_count ?? 0
}

export async function getGitHubRepositoryPullRequests(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null
) {
  const accessToken = sessionUser?.accessToken

  return (
    (await fetchJson<GitHubRepositoryPullRequest[]>(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=20`,
      accessToken
    )) ?? []
  )
}

export async function getGitHubRepositoryPullRequestCount(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null
) {
  const accessToken = sessionUser?.accessToken
  const result = await fetchJson<{
    total_count: number
  }>(
    `https://api.github.com/search/issues?q=${encodeURIComponent(`repo:${owner}/${repo} type:pr state:open`)}`,
    accessToken
  )

  return result?.total_count ?? 0
}

export async function getGitHubRepositoryReleases(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null
) {
  const accessToken = sessionUser?.accessToken

  return fetchPaginatedJson<GitHubRepositoryRelease>(
    `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100`,
    accessToken
  )
}

export async function getGitHubRepositoryDiscussions(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null
) {
  const accessToken = sessionUser?.accessToken

  return (
    (await fetchJson<GitHubRepositoryDiscussion[]>(
      `https://api.github.com/repos/${owner}/${repo}/discussions?per_page=20`,
      accessToken
    )) ?? []
  )
}

export async function getGitHubRepositoryDiscussionCount(
  owner: string,
  repo: string,
  sessionUser: SessionUser | null
) {
  const accessToken = sessionUser?.accessToken
  const query = encodeURIComponent(`repo:${owner}/${repo} is:discussion is:open`)

  const result = await fetchJsonWithStatus<{ total_count: number }>(
    `https://api.github.com/search/issues?q=${query}&per_page=1`,
    accessToken
  )

  return result?.data?.total_count ?? 0
}

export async function getGitHubNotifications(
  sessionUser: SessionUser | null,
  options?: {
    unreadOnly?: boolean
  }
) {
  if (!sessionUser?.accessToken) {
    return []
  }

  const unreadOnly = options?.unreadOnly ?? false
  const query = new URLSearchParams({
    all: unreadOnly ? "false" : "true",
    per_page: "50",
  })

  const threads =
    (await fetchJson<GitHubNotificationThread[]>(
      `https://api.github.com/notifications?${query.toString()}`,
      sessionUser.accessToken
    )) ?? []

  return threads.map((thread) => ({
    id: thread.id,
    reason: thread.reason,
    repositoryFullName: thread.repository.full_name,
    repositoryUrl: thread.repository.html_url,
    subjectTitle: thread.subject.title,
    subjectType: thread.subject.type,
    unread: thread.unread,
    updatedAt: thread.updated_at,
    url: notificationUrlFromApiUrl(
      thread.subject.url,
      thread.repository.html_url
    ),
  }))
}

export async function markGitHubNotificationAsRead(
  sessionUser: SessionUser | null,
  threadId: string
) {
  if (!sessionUser?.accessToken) {
    return { error: "unauthorized" as const, status: 401 }
  }

  const response = await fetch(
    `https://api.github.com/notifications/threads/${threadId}`,
    {
      headers: getHeaders(sessionUser.accessToken),
      method: "PATCH",
    }
  )

  return {
    error: response.ok ? null : ("request_failed" as const),
    status: response.status,
  }
}

export async function markGitHubNotificationAsDone(
  sessionUser: SessionUser | null,
  threadId: string
) {
  if (!sessionUser?.accessToken) {
    return { error: "unauthorized" as const, status: 401 }
  }

  const response = await fetch(
    `https://api.github.com/notifications/threads/${threadId}`,
    {
      headers: getHeaders(sessionUser.accessToken),
      method: "DELETE",
    }
  )

  return {
    error: response.ok ? null : ("request_failed" as const),
    status: response.status,
  }
}

export async function unsubscribeFromGitHubNotification(
  sessionUser: SessionUser | null,
  threadId: string
) {
  if (!sessionUser?.accessToken) {
    return { error: "unauthorized" as const, status: 401 }
  }

  const response = await fetch(
    `https://api.github.com/notifications/threads/${threadId}/subscription`,
    {
      body: JSON.stringify({ ignored: true }),
      headers: {
        ...getHeaders(sessionUser.accessToken),
        "Content-Type": "application/json",
      },
      method: "PUT",
    }
  )

  return {
    error: response.ok ? null : ("request_failed" as const),
    status: response.status,
  }
}

function normalizeEvent(event: GitHubEvent): ProfileActivityItem[] {
  switch (event.type) {
    case "PushEvent":
      return [
        {
          category: "Commits",
          createdAt: event.created_at,
          id: event.id,
          repoName: event.repo.name,
          title:
            event.payload.commits && event.payload.commits.length > 0
              ? event.payload.commits[0].message
              : "Pushed new commits",
          url: `https://github.com/${event.repo.name}/commits`,
          internalUrl: `/${event.repo.name}`,
        },
      ]
    case "IssuesEvent":
      return event.payload.issue
        ? [
            {
              category: "Issues",
              createdAt: event.payload.issue.updated_at ?? event.created_at,
              id: event.id,
              repoName: event.repo.name,
              title: `${event.payload.action ?? "updated"}: ${event.payload.issue.title}`,
              url: event.payload.issue.html_url,
              internalUrl: `/${event.repo.name}?tab=issues&issue=${event.payload.issue.number}`,
              status:
                event.payload.issue.state === "closed" ? "closed" : "open",
            },
          ]
        : []
    case "PullRequestEvent":
      return event.payload.pull_request
        ? [
            {
              category: "Pull Requests",
              createdAt:
                event.payload.pull_request.updated_at ?? event.created_at,
              id: event.id,
              repoName: event.repo.name,
              title: `${event.payload.action ?? "updated"}: ${event.payload.pull_request.title}`,
              url: event.payload.pull_request.html_url,
              internalUrl: `/${event.repo.name}?tab=pulls&pr=${event.payload.pull_request.number}`,
              status: event.payload.pull_request.merged
                ? "merged"
                : event.payload.pull_request.state === "closed"
                  ? "closed"
                  : "open",
            },
          ]
        : []
    case "CreateEvent":
      return event.payload.ref_type === "repository"
        ? [
            {
              category: "Repositories Created",
              createdAt: event.created_at,
              id: event.id,
              repoName: event.repo.name,
              title: `Created ${event.repo.name.split("/")[1]}`,
              url: `https://github.com/${event.repo.name}`,
              internalUrl: `/${event.repo.name}`,
            },
          ]
        : []
    case "WatchEvent":
      return [
        {
          category: "Stars",
          createdAt: event.created_at,
          id: event.id,
          repoName: event.repo.name,
          title: `Starred ${event.repo.name}`,
          url: `https://github.com/${event.repo.name}`,
          internalUrl: `/${event.repo.name}`,
        },
      ]
    case "DiscussionEvent":
      return event.payload.discussion
        ? [
            {
              category: "Discussions",
              createdAt:
                event.payload.discussion.updated_at ?? event.created_at,
              id: event.id,
              repoName: event.repo.name,
              title: `${event.payload.discussion.title}`,
              url: event.payload.discussion.html_url,
              internalUrl: `/${event.repo.name}?tab=discussions&discussion=${event.payload.discussion.number}`,
              status: "open",
            },
          ]
        : []
    default:
      return []
  }
}

export async function getGitHubActivity(
  username: string,
  sessionUser: SessionUser | null
) {
  const isOwnProfile =
    Boolean(sessionUser?.accessToken) &&
    sessionUser?.login.toLowerCase() === username.toLowerCase()
  const accessToken = isOwnProfile ? sessionUser?.accessToken : undefined
  const events = isOwnProfile
    ? ((await fetchJson<GitHubEvent[]>(
        `https://api.github.com/users/${username}/events?per_page=100`,
        accessToken
      )) ?? [])
    : ((await fetchJson<GitHubEvent[]>(
        `https://api.github.com/users/${username}/events/public?per_page=100`,
        accessToken
      )) ??
      (await fetchJson<GitHubEvent[]>(
        `https://api.github.com/orgs/${username}/events?per_page=100`,
        accessToken
      )) ??
      [])

  return events
    .flatMap(normalizeEvent)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
}

export async function getGitHubStarredRepositories(
  username: string,
  sessionUser: SessionUser | null
) {
  const isOwnProfile =
    Boolean(sessionUser?.accessToken) &&
    sessionUser?.login.toLowerCase() === username.toLowerCase()
  const accessToken = sessionUser?.accessToken

  const endpoint = isOwnProfile
    ? "https://api.github.com/user/starred?sort=updated&per_page=100"
    : `https://api.github.com/users/${username}/starred?sort=updated&per_page=100`

  const repositories = await fetchPaginatedJson<GitHubRepository>(
    endpoint,
    accessToken
  )

  return resolveRepositoryLanguages(repositories, accessToken)
}
