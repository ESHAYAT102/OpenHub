import { NextResponse } from "next/server"

import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

type GitHubSearchRepository = {
  archived: boolean
  clone_url: string
  created_at: string
  id: number
  forks_count: number
  name: string
  owner: {
    avatar_url: string | null
    login: string
  }
  private: boolean
  full_name: string
  description: string | null
  stargazers_count: number
  language: string | null
  html_url: string
  updated_at: string
  url: string
  fork: boolean
  languages_url: string
}

type GitHubSearchUser = {
  login: string
  avatar_url: string | null
  html_url: string
  type: "User" | "Organization" | string
}

async function fetchGitHub<T>(
  url: string,
  accessToken?: string
): Promise<T | null> {
  try {
    const headers: HeadersInit = {
      Accept: "application/vnd.github+json",
    }
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`
    }
    const response = await fetch(url, { headers })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")?.trim() ?? ""

  if (!query) {
    return NextResponse.json({ repositories: [], users: [] })
  }

  const sessionUser = await getSessionUser()
  const accessToken = sessionUser?.accessToken

  const repoParams = new URLSearchParams({
    q: `${query} in:name,owner`,
    per_page: "15",
    sort: "stars",
    order: "desc",
  })

  const userParams = new URLSearchParams({
    q: query,
    per_page: "5",
  })

  const [repoResult, userResult] = await Promise.all([
    fetchGitHub<{ items: GitHubSearchRepository[] }>(
      `https://api.github.com/search/repositories?${repoParams.toString()}`,
      accessToken
    ),
    fetchGitHub<{ items: GitHubSearchUser[] }>(
      `https://api.github.com/search/users?${userParams.toString()}`,
      accessToken
    ),
  ])

  const repositories =
    repoResult?.items.map((repo) => ({
      archived: repo.archived,
      clone_url: repo.clone_url,
      created_at: repo.created_at,
      id: repo.id,
      name: repo.name,
      forks_count: repo.forks_count,
      owner: {
        avatar_url: repo.owner.avatar_url,
        login: repo.owner.login,
      },
      private: repo.private,
      fullName: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      language: repo.language,
      url: repo.html_url,
      updated_at: repo.updated_at,
      api_url: repo.url,
      fork: repo.fork,
      languages_url: repo.languages_url,
    })) ?? []

  let sortedRepositories = repositories

  if (sessionUser?.login) {
    const userRepos = repositories.filter(
      (repo) => repo.owner.login === sessionUser.login
    )
    const otherRepos = repositories.filter(
      (repo) => repo.owner.login !== sessionUser.login
    )
    sortedRepositories = [...userRepos, ...otherRepos]
  }

  return NextResponse.json({
    repositories: sortedRepositories,
    users:
      userResult?.items.map((user) => ({
        login: user.login,
        avatarUrl: user.avatar_url,
        url: user.html_url,
        type: user.type,
      })) ?? [],
  })
}
