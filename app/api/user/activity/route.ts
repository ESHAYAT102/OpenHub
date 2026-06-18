import { NextResponse } from "next/server"

import { getGitHubActivity } from "@/lib/github"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const sessionUser = await getSessionUser()
  if (!sessionUser?.login) {
    return NextResponse.json({ activity: [] })
  }

  const activity = await getGitHubActivity(sessionUser.login, sessionUser)

  return NextResponse.json({ activity })
}
