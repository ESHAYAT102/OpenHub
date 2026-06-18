import { NextResponse, type NextRequest } from "next/server"

import { chooseRepresentation } from "@/lib/http-accept"

function shouldNegotiate(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/agent-markdown") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/.well-known") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/llms.txt" ||
    pathname === "/llms-full.txt" ||
    pathname === "/openapi.json"
  ) {
    return false
  }

  return !/\.[a-z0-9]+$/i.test(pathname)
}

export function proxy(request: NextRequest) {
  if (!shouldNegotiate(request)) {
    return NextResponse.next()
  }

  const representation = chooseRepresentation(request.headers.get("accept"))

  if (!representation) {
    return new NextResponse("Not Acceptable", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
    })
  }

  if (representation === "text/markdown") {
    const rewriteUrl = new URL("/agent-markdown", request.url)
    rewriteUrl.search = request.nextUrl.search
    rewriteUrl.searchParams.set("xenon_path", request.nextUrl.pathname)

    return NextResponse.rewrite(rewriteUrl, {
      headers: {
        Vary: "Accept",
      },
    })
  }

  const response = NextResponse.next({
    headers: {
      Vary: "Accept",
    },
  })

  return response
}

export const config = {
  matcher: ["/((?!_next|agent-markdown|api|.well-known|favicon\\.ico|robots\\.txt|sitemap\\.xml|llms?|openapi).*)"],
}
