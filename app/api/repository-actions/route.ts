import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import {
  forkGitHubRepository,
  starGitHubRepository,
  unstarGitHubRepository,
} from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const sessionUser = await getSessionUser()

  if (!sessionUser) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as {
    action?: "fork" | "star" | "unstar"
    owner?: string
    repo?: string
    forkName?: string
  }

  if (!body.owner || !body.repo || !body.action) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 })
  }

  const result =
    body.action === "star"
      ? await starGitHubRepository(sessionUser, body.owner, body.repo)
      : body.action === "unstar"
        ? await unstarGitHubRepository(sessionUser, body.owner, body.repo)
        : await forkGitHubRepository(sessionUser, body.owner, body.repo, body.forkName)

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    )
  }

  revalidatePath(`/${sessionUser.login}`)
  revalidatePath(`/${body.owner}/${body.repo}`)

  return NextResponse.json({ ok: true })
}
