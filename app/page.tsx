import BrowserContextMenu from "@/components/BrowserContextMenu"
import Navbar from "@/components/Navbar"
import {
  getGitHubActivity,
  getGitHubNotifications,
  getTrendingRepositories,
} from "@/lib/github"
import { getSessionUser } from "@/lib/session"

import HomeActivity from "@/components/HomeActivity"
import TrendingRepositories from "@/components/TrendingRepositories"
import { LoginForm } from "@/components/login-form"

type HomePageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function Page({ searchParams }: HomePageProps) {
  await searchParams
  const user = await getSessionUser()

  const [unreadNotifications, trending, activity] = user
    ? await Promise.all([
        getGitHubNotifications(user, { unreadOnly: true }),
        getTrendingRepositories(user),
        getGitHubActivity(user.login, user),
      ])
    : [null, await getTrendingRepositories(user), []]

  return (
    <BrowserContextMenu triggerClassName="block min-h-screen w-full">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar initialUnreadNotifications={unreadNotifications ?? []} />
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pt-24 pb-10 md:px-8">
          {user ? (
            <>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Your activity
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Recent commits, issues, and pull requests
                  </p>
                </div>
                <HomeActivity activity={activity} />
              </div>

              <div className="space-y-6">
                <TrendingRepositories repositories={trending} />
              </div>
            </>
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center">
              <LoginForm />
            </div>
          )}
        </main>
      </div>
    </BrowserContextMenu>
  )
}
