import { NextResponse } from "next/server"

import {
  deleteGitHubRepository,
  updateGitHubRepositoryMetadata,
} from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

export async function PATCH(request: Request) {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    archived?: boolean
    default_branch?: string | null
    description?: string | null
    has_discussions?: boolean
    has_downloads?: boolean
    has_wiki?: boolean
    homepage?: string | null
    name?: string
    owner?: string
    private?: boolean
    repo?: string
  }

  if (!body.owner || !body.repo) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 })
  }

  const result = await updateGitHubRepositoryMetadata(
    sessionUser,
    body.owner,
    body.repo,
    {
      archived: body.archived,
      default_branch: body.default_branch,
      description: body.description ?? null,
      has_discussions: body.has_discussions,
      has_downloads: body.has_downloads,
      has_wiki: body.has_wiki,
      homepage: body.homepage ?? null,
      name: body.name,
      private: body.private,
    }
  )

  if (!result.repository) {
    return NextResponse.json(
      { error: result.error ?? "request_failed" },
      { status: result.status }
    )
  }

  return NextResponse.json({ repository: result.repository })
}

export async function DELETE(request: Request) {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    owner?: string
    repo?: string
  }

  if (!body.owner || !body.repo) {
    return NextResponse.json({ error: "validation_failed" }, { status: 422 })
  }

  const result = await deleteGitHubRepository(
    sessionUser,
    body.owner,
    body.repo
  )

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    )
  }

  return NextResponse.json({ ok: true })
}
