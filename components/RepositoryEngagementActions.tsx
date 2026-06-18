"use client"

import { useState } from "react"
import { Copy, GitFork, Star } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type RepositoryEngagementActionsProps = {
  canFork?: boolean
  cloneUrl?: string
  compact?: boolean
  initialForkCount: number
  initialIsStarred: boolean
  initialStarCount: number
  owner: string
  repo: string
}

export default function RepositoryEngagementActions({
  canFork = true,
  cloneUrl,
  compact = false,
  initialForkCount,
  initialIsStarred,
  initialStarCount,
  owner,
  repo,
}: RepositoryEngagementActionsProps) {
  const [isStarred, setIsStarred] = useState(initialIsStarred)
  const [starCount, setStarCount] = useState(initialStarCount)
  const [forkCount, setForkCount] = useState(initialForkCount)
  const [isTogglingStar, setIsTogglingStar] = useState(false)
  const [isForking, setIsForking] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [forkName, setForkName] = useState(repo)

  const handleStarToggle = async () => {
    if (isTogglingStar) return

    const nextStarred = !isStarred
    setIsTogglingStar(true)
    setIsStarred(nextStarred)
    setStarCount((current) => current + (nextStarred ? 1 : -1))

    const response = await fetch("/api/repository-actions", {
      body: JSON.stringify({
        action: nextStarred ? "star" : "unstar",
        owner,
        repo,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    if (!response.ok) {
      setIsStarred(!nextStarred)
      setStarCount((current) => current + (nextStarred ? -1 : 1))
      toast.error(
        nextStarred
          ? "Could not star repository"
          : "Could not unstar repository"
      )
    } else {
      toast.success(nextStarred ? "Repository starred" : "Repository unstarred")
    }

    setIsTogglingStar(false)
  }

  const handleFork = () => {
    setForkName(repo)
    setIsDialogOpen(true)
  }

  const handleForkSubmit = async () => {
    if (isForking) return

    setIsForking(true)
    setIsDialogOpen(false)

    const response = await fetch("/api/repository-actions", {
      body: JSON.stringify({
        action: "fork",
        owner,
        repo,
        forkName,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    if (response.ok) {
      setForkCount((current) => current + 1)
      toast.success("Fork started on GitHub")
    } else {
      toast.error("Could not fork repository")
    }

    setIsForking(false)
  }

  const handleCloneCopy = async () => {
    try {
      const repositoryCloneUrl =
        cloneUrl ?? `${window.location.origin}/${owner}/${repo}.git`
      await navigator.clipboard.writeText(`git clone ${repositoryCloneUrl}`)
      toast.success("Clone command copied")
    } catch {
      toast.error("Could not copy clone command")
    }
  }

  return (
    <>
      {compact ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={[
              "rounded-full px-3 text-sm",
              isStarred ? "text-yellow-500" : "text-muted-foreground",
            ].join(" ")}
            onClick={handleStarToggle}
            data-repo-action-star
          >
            <Star className={isStarred ? "fill-current" : undefined} />
            Star
            <span className="tabular-nums">{starCount}</span>
          </Button>

          {canFork ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full px-3 text-sm text-muted-foreground"
              disabled={isForking}
              onClick={handleFork}
              data-repo-action-fork
            >
              <GitFork />
              Fork
              <span className="tabular-nums">{forkCount}</span>
            </Button>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full px-3 text-sm text-muted-foreground"
            onClick={handleCloneCopy}
            data-repo-action-clone
          >
            <Copy />
            Clone
          </Button>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-2 min-[440px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button
            type="button"
            variant={isStarred ? "secondary" : "outline"}
            className="w-full rounded-xl sm:w-auto"
            onClick={handleStarToggle}
            data-repo-action-star
          >
            <Star className={isStarred ? "fill-current" : undefined} />
            Star
            <span className="text-muted-foreground">{starCount}</span>
          </Button>

          {canFork ? (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl sm:w-auto"
              disabled={isForking}
              onClick={handleFork}
              data-repo-action-fork
            >
              <GitFork />
              Fork
              <span className="text-muted-foreground">{forkCount}</span>
            </Button>
          ) : null}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fork repository</DialogTitle>
            <DialogDescription>
              Enter a name for the forked repository.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={forkName}
            onChange={(e) => setForkName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleForkSubmit()
              }
            }}
            placeholder="Repository name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleForkSubmit} disabled={!forkName.trim()}>
              Fork
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
