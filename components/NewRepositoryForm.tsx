"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"

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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type NewRepositoryFormProps = {
  canCreateRepositories: boolean
}

export default function NewRepositoryForm({
  canCreateRepositories,
}: NewRepositoryFormProps) {
  const router = useRouter()
  const [formState, setFormState] = useState({
    autoInit: false,
    description: "",
    homepage: "",
    name: "",
    private: false,
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!formState.name.trim()) {
      const message = "Repository name is required."
      setError(message)
      toast.error(message)
      return
    }

    setIsCreating(true)
    setError(null)

    const response = await fetch("/api/repositories", {
      body: JSON.stringify({
        auto_init: formState.autoInit,
        description: formState.description || null,
        homepage: formState.homepage || null,
        name: formState.name.trim(),
        private: formState.private,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    const data = (await response.json()) as {
      error?: string
      repository?: {
        name: string
        owner: {
          login: string
        }
      }
    }

    setIsCreating(false)

    if (!response.ok || !data.repository) {
      const message =
        data.error === "forbidden"
          ? "Your current GitHub token cannot create repositories. Reconnect to refresh the repo scope."
          : data.error === "validation_failed"
            ? "GitHub rejected this repository setup. The name may already be taken in your account, or one of the values is invalid."
            : "Repository creation failed. Please try again."
      setError(message)
      toast.error(message)
      return
    }

    toast.success("Repository created")
    router.push(`/${data.repository.owner.login}/${data.repository.name}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Create a new repository</CardTitle>
          <CardDescription>
            Start a fresh GitHub repository without leaving Xenon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!canCreateRepositories ? (
            <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              Creating repositories needs the <code>repo</code> OAuth scope.
              If you signed in before this update, sign out and back in once
              to refresh access.
              <div className="mt-3">
                <Button asChild variant="outline" className="rounded-xl">
                  <A href="/api/auth/github/login?callbackUrl=/new">
                    <RefreshCw />
                    Reconnect GitHub
                  </A>
                </Button>
              </div>
            </div>
          ) : null}

          <FieldGroup>
            <Field>
              <FieldLabel>Repository name</FieldLabel>
              <FieldContent>
                <Input
                  autoFocus
                  disabled={!canCreateRepositories || isCreating}
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="my-awesome-project"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <Textarea
                  disabled={!canCreateRepositories || isCreating}
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="A short summary of what this repo is for."
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Homepage URL</FieldLabel>
              <FieldContent>
                <Input
                  disabled={!canCreateRepositories || isCreating}
                  value={formState.homepage}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      homepage: event.target.value,
                    }))
                  }
                  placeholder="https://eshayat.com"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Visibility</FieldLabel>
              <FieldContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={!formState.private ? "secondary" : "outline"}
                    className="rounded-xl"
                    disabled={!canCreateRepositories || isCreating}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        private: false,
                      }))
                    }
                  >
                    Public
                  </Button>
                  <Button
                    type="button"
                    variant={formState.private ? "secondary" : "outline"}
                    className="rounded-xl"
                    disabled={!canCreateRepositories || isCreating}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        private: true,
                      }))
                    }
                  >
                    Private
                  </Button>
                </div>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Initialize</FieldLabel>
              <FieldContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={formState.autoInit ? "secondary" : "outline"}
                    className="rounded-xl"
                    disabled={!canCreateRepositories || isCreating}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        autoInit: true,
                      }))
                    }
                  >
                    Create with README
                  </Button>
                  <Button
                    type="button"
                    variant={!formState.autoInit ? "secondary" : "outline"}
                    className="rounded-xl"
                    disabled={!canCreateRepositories || isCreating}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        autoInit: false,
                      }))
                    }
                  >
                    Empty repository
                  </Button>
                </div>
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full">
              {formState.private ? "Private" : "Public"}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              {formState.autoInit ? "README included" : "Empty repo"}
            </Badge>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end">
            <Button
              className="rounded-xl"
              disabled={!canCreateRepositories || isCreating}
              onClick={handleCreate}
            >
              {isCreating ? <Loader2 className="animate-spin" /> : <Plus />}
              Create repository
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
