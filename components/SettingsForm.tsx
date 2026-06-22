"use client"

import { useState } from "react"
import { Loader2, RefreshCw, Save } from "lucide-react"

import A from "@/components/A"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { GitHubViewerSettings } from "@/lib/github"

type SettingsFormProps = {
  settings: GitHubViewerSettings
}

function scopeLabel(scope: string) {
  switch (scope) {
    case "user":
      return "Profile editing"
    case "repo":
      return "Repositories"
    case "notifications":
      return "Notifications"
    default:
      return scope
  }
}

export default function SettingsForm({ settings }: SettingsFormProps) {
  const [formState, setFormState] = useState({
    bio: settings.bio ?? "",
    blog: settings.blog ?? "",
    company: settings.company ?? "",
    hireable: settings.hireable ?? false,
    location: settings.location ?? "",
    name: settings.name ?? "",
    twitterUsername: settings.twitterUsername ?? "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canEdit = settings.canEditProfile

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setNotice(null)

    const response = await fetch("/api/settings", {
      body: JSON.stringify({
        bio: formState.bio || null,
        blog: formState.blog || null,
        company: formState.company || null,
        hireable: formState.hireable,
        location: formState.location || null,
        name: formState.name || null,
        twitter_username: formState.twitterUsername || null,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    const data = (await response.json()) as {
      error?: string
      settings?: GitHubViewerSettings
    }

    setIsSaving(false)

    if (!response.ok) {
      setError(
        data.error === "forbidden"
          ? "Your current GitHub token cannot edit profile settings yet. Sign out and reconnect to grant the user scope."
          : data.error === "validation_failed"
            ? "GitHub rejected one of the values. Check the fields and try again."
            : "Saving failed. Please try again."
      )
      return
    }

    if (data.settings) {
      setFormState({
        bio: data.settings.bio ?? "",
        blog: data.settings.blog ?? "",
        company: data.settings.company ?? "",
        hireable: data.settings.hireable ?? false,
        location: data.settings.location ?? "",
        name: data.settings.name ?? "",
        twitterUsername: data.settings.twitterUsername ?? "",
      })
    }

    setNotice("Settings saved to GitHub.")
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>OAuth Access</CardTitle>
          <CardDescription>
            This is what your current GitHub OAuth token can access right now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {settings.scopes.length > 0 ? (
              settings.scopes.map((scope) => (
                <Badge key={scope} variant="outline" className="rounded-full">
                  {scopeLabel(scope)}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="rounded-full">
                No scopes detected
              </Badge>
            )}
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              Profile editing:{" "}
              <span className="text-foreground">
                {settings.canEditProfile ? "Allowed" : "Not granted"}
              </span>
            </div>
            <div>
              Notifications:{" "}
              <span className="text-foreground">
                {settings.canReadNotifications ? "Allowed" : "Not granted"}
              </span>
            </div>
          </div>
          {!settings.canEditProfile ? (
            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Editing GitHub profile settings needs the `user` OAuth scope.
              If you signed in before this update, sign out and back in once
              to upgrade the token.
              <div className="mt-3">
                <Button asChild variant="outline" className="rounded-xl">
                  <A href="/api/auth/github/login?callbackUrl=/settings">
                    <RefreshCw />
                    Reconnect GitHub
                  </A>
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            These fields sync directly with your GitHub profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldContent>
                <Input
                  disabled={!canEdit}
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Bio</FieldLabel>
              <FieldContent>
                <Textarea
                  disabled={!canEdit}
                  value={formState.bio}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel>Website</FieldLabel>
                <Input
                  disabled={!canEdit}
                  value={formState.blog}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      blog: event.target.value,
                    }))
                  }
                />
              </FieldContent>
              <FieldContent>
                <FieldLabel>Company</FieldLabel>
                <Input
                  disabled={!canEdit}
                  value={formState.company}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      company: event.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel>Location</FieldLabel>
                <Input
                  disabled={!canEdit}
                  value={formState.location}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </FieldContent>
              <FieldContent>
                <FieldLabel>Twitter Username</FieldLabel>
                <Input
                  disabled={!canEdit}
                  value={formState.twitterUsername}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      twitterUsername: event.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Connected Email</FieldLabel>
              <FieldContent>
                <Input
                  readOnly
                  value={settings.email ?? "No public email available"}
                />
                <FieldDescription>
                  GitHub email address editing is not managed from this app.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {notice ? <p className="text-sm text-emerald-500">{notice}</p> : null}

          <div className="flex justify-end">
            <Button
              className="rounded-xl"
              disabled={!canEdit || isSaving}
              onClick={handleSave}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
