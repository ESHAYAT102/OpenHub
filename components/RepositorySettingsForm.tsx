"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import type { GitHubBranch, GitHubRepository } from "@/lib/github"

type RepositorySettingsFormProps = {
  branches: GitHubBranch[]
  repository: GitHubRepository
}

export default function RepositorySettingsForm({
  branches,
  repository,
}: RepositorySettingsFormProps) {
  const router = useRouter()
  const availableBranches =
    branches.length > 0
      ? branches
      : [{ name: repository.default_branch ?? "main" }]
  const [formState, setFormState] = useState({
    archived: repository.archived,
    defaultBranch:
      repository.default_branch ?? availableBranches[0]?.name ?? "main",
    description: repository.description ?? "",
    has_discussions: repository.has_discussions,
    has_downloads: repository.has_downloads,
    has_wiki: repository.has_wiki,
    homepage: repository.homepage ?? "",
    name: repository.name,
    private: repository.private,
  })
  const [deleteConfirmName, setDeleteConfirmName] = useState("")
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)

    const response = await fetch("/api/repository", {
      body: JSON.stringify({
        archived: formState.archived,
        default_branch: formState.defaultBranch,
        description: formState.description || null,
        has_discussions: formState.has_discussions,
        has_downloads: formState.has_downloads,
        has_wiki: formState.has_wiki,
        homepage: formState.homepage || null,
        name: formState.name.trim(),
        owner: repository.owner.login,
        private: formState.private,
        repo: repository.name,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    const data = (await response.json()) as {
      error?: string
      repository?: GitHubRepository
    }

    setIsSaving(false)

    if (!response.ok || !data.repository) {
      toast.error(
        data.error === "forbidden"
          ? "Your current GitHub session cannot change these repository settings."
          : data.error === "validation_failed"
            ? "GitHub rejected one of the values. Check the fields and try again."
            : "Could not save repository settings."
      )
      return
    }

    const nextRepository = data.repository
    setFormState({
      archived: nextRepository.archived,
      defaultBranch: nextRepository.default_branch ?? formState.defaultBranch,
      description: nextRepository.description ?? "",
      has_discussions: nextRepository.has_discussions,
      has_downloads: nextRepository.has_downloads,
      has_wiki: nextRepository.has_wiki,
      homepage: nextRepository.homepage ?? "",
      name: nextRepository.name,
      private: nextRepository.private,
    })

    toast.success("Repository settings saved")
    router.push(
      `/${nextRepository.owner.login}/${nextRepository.name}?tab=settings`
    )
    router.refresh()
  }

  const handleDelete = async () => {
    if (isDeleting) return

    if (deleteConfirmName !== repository.name) {
      toast.error("Type the repository name exactly to confirm deletion")
      return
    }

    setIsDeleting(true)
    setDeleteConfirmName("")
    setIsDeleteOpen(false)

    const deleteRequest = fetch("/api/repository", {
      body: JSON.stringify({
        owner: repository.owner.login,
        repo: repository.name,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      method: "DELETE",
    })

    router.push(`/${repository.owner.login}`)
    toast.success("Deleting repository in background")

    void deleteRequest
      .then(async (response) => {
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            error?: string
          }

          toast.error(
            data.error === "forbidden"
              ? "GitHub denied repository deletion. Sign out and sign back in to grant delete permissions."
              : "Could not delete repository"
          )
          return
        }

        toast.success("Repository deleted")
        router.refresh()
      })
      .catch(() => {
        toast.error("Could not delete repository")
      })
  }

  const handleDeleteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleDelete()
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="px-5 py-4">
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>
            Update the repository details GitHub lets this app manage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-5 pb-5">
          <FieldGroup>
            <Field>
              <FieldLabel>Repository name</FieldLabel>
              <FieldContent>
                <Input
                  disabled={isSaving}
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <FieldDescription>
                  Renaming changes the repository URL.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <Textarea
                  disabled={isSaving}
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Website</FieldLabel>
              <FieldContent>
                <Input
                  disabled={isSaving}
                  placeholder="https://example.com"
                  value={formState.homepage}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      homepage: event.target.value,
                    }))
                  }
                />
              </FieldContent>
            </Field>

            <Field orientation="responsive">
              <FieldContent>
                <FieldLabel>Visibility</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={!formState.private ? "secondary" : "outline"}
                    className="rounded-xl"
                    disabled={isSaving}
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
                    disabled={isSaving}
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

              <FieldContent>
                <FieldLabel>Default branch</FieldLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={isSaving}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between rounded-xl"
                    >
                      {formState.defaultBranch}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="min-w-56 rounded-2xl"
                  >
                    <DropdownMenuRadioGroup
                      value={formState.defaultBranch}
                      onValueChange={(value) =>
                        setFormState((current) => ({
                          ...current,
                          defaultBranch: value,
                        }))
                      }
                    >
                      {availableBranches.map((branch) => (
                        <DropdownMenuRadioItem
                          key={branch.name}
                          value={branch.name}
                        >
                          {branch.name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Repository state</FieldLabel>
              <FieldContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={!formState.archived ? "secondary" : "outline"}
                    className="rounded-xl"
                    disabled={isSaving}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        archived: false,
                      }))
                    }
                  >
                    Active
                  </Button>
                  <Button
                    type="button"
                    variant={formState.archived ? "secondary" : "outline"}
                    className="rounded-xl"
                    disabled={isSaving}
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        archived: true,
                      }))
                    }
                  >
                    Archived
                  </Button>
                </div>
                <FieldDescription>
                  Archived repositories become read-only on GitHub.
                </FieldDescription>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Features</FieldLabel>
              <FieldContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="has_discussions"
                    checked={formState.has_discussions}
                    onCheckedChange={(checked) =>
                      setFormState((current) => ({
                        ...current,
                        has_discussions: checked === true,
                      }))
                    }
                  />
                  <label
                    htmlFor="has_discussions"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Discussions
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="has_wiki"
                    checked={formState.has_wiki}
                    onCheckedChange={(checked) =>
                      setFormState((current) => ({
                        ...current,
                        has_wiki: checked === true,
                      }))
                    }
                  />
                  <label
                    htmlFor="has_wiki"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Wiki
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="has_downloads"
                    checked={formState.has_downloads}
                    onCheckedChange={(checked) =>
                      setFormState((current) => ({
                        ...current,
                        has_downloads: checked === true,
                      }))
                    }
                  />
                  <label
                    htmlFor="has_downloads"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Releases
                  </label>
                </div>
              </FieldContent>
            </Field>
          </FieldGroup>

          <div className="flex justify-end">
            <Button
              className="rounded-xl"
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-destructive/30">
        <CardHeader className="px-5 py-4">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="size-4" />
            Danger zone
          </CardTitle>
          <CardDescription>
            These actions are permanent and affect the repository on GitHub.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <Button
            variant="destructive"
            className="rounded-xl"
            data-repo-action-delete-repository
            onClick={() => {
              setDeleteConfirmName("")
              setIsDeleteOpen(true)
            }}
          >
            <Trash2 />
            Delete repository
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open)
          if (!open) {
            setDeleteConfirmName("")
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete repository</DialogTitle>
            <DialogDescription>
              This permanently deletes{" "}
              <code>
                {repository.owner.login}/{repository.name}
              </code>
              . Type the repository name to confirm.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-3" onSubmit={handleDeleteSubmit}>
            <Input
              disabled={isDeleting}
              placeholder={repository.name}
              value={deleteConfirmName}
              onChange={(event) => setDeleteConfirmName(event.target.value)}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setIsDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                className="rounded-xl"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Delete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
