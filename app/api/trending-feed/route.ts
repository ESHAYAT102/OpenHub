import { NextResponse } from "next/server"

import { getTrendingFeedPage } from "@/lib/trending-feed"
import { getSessionUser } from "@/lib/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Number.parseInt(searchParams.get("cursor") ?? "1", 10)
  const limit = Number.parseInt(searchParams.get("limit") ?? "5", 10)
  const sessionUser = await getSessionUser()

  const feed = await getTrendingFeedPage(sessionUser, {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    perPage: Number.isFinite(limit) && limit > 0 ? limit : 5,
  })

  return NextResponse.json(feed)
}
