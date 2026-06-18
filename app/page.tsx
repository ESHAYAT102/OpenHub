import Navbar from "@/components/Navbar"
import { headers } from "next/headers"
import { getSessionUser } from "@/lib/session"
import { isFirefoxLikeUserAgent } from "@/lib/browser"

import HomeActivity from "@/components/HomeActivity"
import TrendingFeed from "@/components/TrendingFeed"
import { LoginForm } from "@/components/login-form"

type HomePageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function Page({ searchParams }: HomePageProps) {
  await searchParams
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get("user-agent")
  const disableBrowserExtras = isFirefoxLikeUserAgent(userAgent)
  const user = await getSessionUser()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        disableBrowserInteractions={disableBrowserExtras}
        initialUnreadNotifications={[]}
      />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pt-24 pb-10 md:px-8">
        {user ? (
          <>
            <div className="space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Your activity
                </h1>
              </div>
              <HomeActivity />
            </div>

            <div className="space-y-6">
              <TrendingFeed />
            </div>
          </>
        ) : (
          <div className="flex min-h-[60vh] items-center justify-center">
            <LoginForm />
          </div>
        )}
      </main>
    </div>
  )
}
