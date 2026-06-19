import { ExternalLink, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import Navbar from "@/components/Navbar"
import SettingsForm from "@/components/SettingsForm"
import { LoginForm } from "@/components/login-form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getGitHubNotifications, getGitHubViewerSettings } from "@/lib/github"
import { getSessionUser } from "@/lib/session"
import A from "@/components/A"

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Settings" }
}

export default async function SettingsPage() {
  const sessionUser = await getSessionUser()
  const unreadNotifications = await getGitHubNotifications(sessionUser, {
    unreadOnly: true,
  })
  const settings = await getGitHubViewerSettings(sessionUser)

  if (!sessionUser || !settings) {
    return (
      <BrowserContextMenu triggerClassName="block min-h-screen w-full">
        <div className="min-h-screen bg-background text-foreground">
          <Navbar initialUnreadNotifications={[]} />
          <main className="mx-auto max-w-5xl px-5 pt-24 pb-10">
            <div className="flex min-h-[60vh] items-center justify-center">
              <LoginForm />
            </div>
          </main>
        </div>
      </BrowserContextMenu>
    )
  }

  const fallbackInitial = settings.login.charAt(0).toUpperCase()

  return (
    <BrowserContextMenu triggerClassName="block min-h-screen w-full">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar initialUnreadNotifications={unreadNotifications} />
        <main className="mx-auto max-w-6xl px-5 pt-24 pb-10">
          <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight">
                Settings
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage the GitHub account details and permissions this OAuth app
                can currently access.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <Card className="rounded-3xl">
                <CardContent className="space-y-4 p-6">
                  <Avatar
                    size="lg"
                    className="mt-4 mb-8 ml-4 scale-200 rounded-3xl"
                  >
                    <AvatarImage
                      src={settings.avatarUrl ?? undefined}
                      alt={settings.login}
                    />
                    <AvatarFallback className="rounded-3xl text-2xl">
                      {fallbackInitial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="text-xl font-semibold">
                      {settings.name || settings.login}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{settings.login}
                    </div>
                  </div>
                  <A
                    href={settings.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                  >
                    <ExternalLink className="size-4" />
                    Open GitHub profile
                  </A>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="size-4" />
                    App Access
                  </CardTitle>
                  <CardDescription>
                    A quick summary of what the current token can do.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-3">
                    <span>Profile</span>
                    <span className="text-foreground">
                      {settings.canEditProfile ? "Read / write" : "Read only"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Repositories</span>
                    <span className="text-foreground">
                      {settings.scopes.includes("repo")
                        ? "Private + public"
                        : "Public only"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Notifications</span>
                    <span className="text-foreground">
                      {settings.canReadNotifications
                        ? "Enabled"
                        : "Not granted"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <section>
              <SettingsForm settings={settings} />
            </section>
          </div>
        </main>
      </div>
    </BrowserContextMenu>
  )
}
