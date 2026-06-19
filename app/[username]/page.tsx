import type { Metadata } from "next"
import { Suspense } from "react"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import Navbar from "@/components/Navbar"
import ProfileShowcase, {
  ProfileShowcaseFallback,
} from "@/components/ProfileShowcase"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  getGitHubNotifications,
  getGitHubProfilePageData,
  getGitHubStarredRepositories,
} from "@/lib/github"
import { getCachedContributions } from "@/lib/get-cached-contributions"
import { getSessionUser } from "@/lib/session"
import A from "@/components/A"

type ProfilePageProps = {
  params: Promise<{
    username: string
  }>
}

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"
export const revalidate = 0

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const sessionUser = await getSessionUser()
  const { profile, rateLimited } = await getGitHubProfilePageData(
    username,
    sessionUser
  )

  if (rateLimited) {
    return { title: username }
  }

  const title = profile.name
    ? `${profile.name} (${profile.login})`
    : profile.login

  return { title }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params
  const sessionUser = await getSessionUser()
  const profileData = await getGitHubProfilePageData(username, sessionUser)
  const profileGitHubUrl = `https://github.com/${encodeURIComponent(username)}`

  if (profileData.rateLimited) {
    const rateLimitTime = profileData.rateLimitReset
      ? new Intl.DateTimeFormat("en", {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(profileData.rateLimitReset))
      : null

    return (
      <BrowserContextMenu triggerClassName="block min-h-screen w-full">
        <div className="min-h-screen bg-background text-foreground">
          <Navbar initialUnreadNotifications={[]} />
          <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-4 pt-50 pb-10 md:px-8">
            <Empty className="w-full">
              <EmptyHeader>
                <EmptyTitle className="text-2xl">Rate limit reached</EmptyTitle>
                <EmptyDescription>
                  GitHub API rate limits were hit.{" "}
                  {rateLimitTime
                    ? `Try again after ${rateLimitTime}.`
                    : "Try again in a few minutes."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button className="px-4" asChild>
                  <A href={profileGitHubUrl}>Open in GitHub</A>
                </Button>
              </EmptyContent>
            </Empty>
            {!sessionUser && (
              <Button className="px-4" asChild>
                <A href="/api/auth/github/login">Continue with GitHub</A>
              </Button>
            )}
          </div>
        </div>
      </BrowserContextMenu>
    )
  }

  const { profile, repositories } = profileData
  const contributions = getCachedContributions(profile.login)

  const [unreadNotifications, starredRepositories] = sessionUser
    ? await Promise.all([
        getGitHubNotifications(sessionUser, { unreadOnly: true }),
        getGitHubStarredRepositories(username, sessionUser),
      ])
    : [undefined, []]

  return (
    <BrowserContextMenu triggerClassName="block min-h-screen w-full">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar initialUnreadNotifications={unreadNotifications} />
        <main className="mx-auto w-full max-w-480 px-3 pt-24 pb-3 md:px-4 md:pb-4">
          <Suspense fallback={<ProfileShowcaseFallback />}>
            <ProfileShowcase
              contributions={contributions}
              profile={profile}
              repositories={repositories}
              starredRepositories={starredRepositories}
            />
          </Suspense>
        </main>
      </div>
    </BrowserContextMenu>
  )
}
