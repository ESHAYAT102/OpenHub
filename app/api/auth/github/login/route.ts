import { NextRequest, NextResponse } from "next/server"

import {
  createOAuthState,
  OAUTH_STATE_COOKIE_NAME,
  oauthStateCookieOptions,
} from "@/lib/session"

export const runtime = "nodejs"

export const GITHUB_OAUTH_SCOPES = [
  "user",
  "repo",
  "delete_repo",
  "notifications",
] as const

const DEFAULT_GITHUB_OAUTH_SCOPE = GITHUB_OAUTH_SCOPES.join(" ")

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID

  if (!clientId) {
    return NextResponse.redirect(new URL("/?authError=missing_client_id", request.url))
  }

  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/"
  const redirectUri = new URL("/api/auth/github/callback", request.nextUrl.origin)
  const { cookieValue, state } = createOAuthState(callbackUrl)

  const githubUrl = new URL("https://github.com/login/oauth/authorize")
  githubUrl.searchParams.set("client_id", clientId)
  githubUrl.searchParams.set("redirect_uri", redirectUri.toString())
  githubUrl.searchParams.set("scope", DEFAULT_GITHUB_OAUTH_SCOPE)
  githubUrl.searchParams.set("state", state)

  const response = NextResponse.redirect(githubUrl)
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, cookieValue, oauthStateCookieOptions)

  return response
}
