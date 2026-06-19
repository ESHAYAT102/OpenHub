"use client"

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type UIEvent,
} from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Copy,
  Download,
  Edit3,
  Loader2,
  MoreHorizontal,
  SquareArrowOutUpRight,
  X,
} from "lucide-react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { toast } from "sonner"

import A from "@/components/A"
import Image from "@/components/Image"
import MarkdownPreview from "@/components/MarkdownPreview"
import { getRepositoryItemIcon } from "@/components/RepositoryFileTree"
import VideoPlayer from "@/components/VideoPlayer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Textarea } from "./ui/textarea"
import { handleTextareaVsCodeKeydown } from "@/lib/textarea-vscode-shortcuts"

type RepositoryFilePreviewProps = {
  branch: string
  canEdit: boolean
  owner: string
  readme: {
    htmlUrl: string
    markdown: string
    name: string
    path: string
    sha: string
  } | null
  repo: string
  selectedItem: {
    downloadUrl: string | null
    htmlUrl: string | null
    isImage: boolean
    isMarkdown: boolean
    isText: boolean
    isVideo: boolean
    name: string
    path: string
    sha: string
    text: string
    type: "file"
  } | null
}

type PreviewTarget = {
  downloadUrl: string | null
  htmlUrl: string | null
  isImage: boolean
  isMarkdown: boolean
  isText: boolean
  isVideo: boolean
  name: string
  path: string
  sha: string
  text: string
}

type PreviewMode = "preview" | "code"

function getLanguageFromPath(path: string) {
  const normalizedPath = path.toLowerCase()

  if (normalizedPath.endsWith(".tsx")) return "tsx"
  if (normalizedPath.endsWith(".ts")) return "typescript"
  if (normalizedPath.endsWith(".jsx")) return "jsx"
  if (normalizedPath.endsWith(".js") || normalizedPath.endsWith(".mjs")) {
    return "javascript"
  }
  if (normalizedPath.endsWith(".json")) return "json"
  if (normalizedPath.endsWith(".css")) return "css"
  if (normalizedPath.endsWith(".html")) return "html"
  if (normalizedPath.endsWith(".md")) return "markdown"
  if (normalizedPath.endsWith(".py")) return "python"
  if (normalizedPath.endsWith(".sh")) return "bash"
  if (normalizedPath.endsWith(".yml") || normalizedPath.endsWith(".yaml")) {
    return "yaml"
  }
  if (normalizedPath.endsWith(".rs")) return "rust"
  if (normalizedPath.endsWith(".go")) return "go"
  if (normalizedPath.endsWith(".java")) return "java"

  return "text"
}

function ToggleButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="xs"
      className={cn(
        "rounded-lg px-2.5",
        !active && "text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export default function RepositoryFilePreview({
  branch,
  canEdit,
  owner,
  readme,
  repo,
  selectedItem,
}: RepositoryFilePreviewProps) {
  const target: PreviewTarget | null = selectedItem
    ? {
        downloadUrl: selectedItem.downloadUrl,
        htmlUrl: selectedItem.htmlUrl,
        isImage: selectedItem.isImage,
        isMarkdown: selectedItem.isMarkdown,
        isText: selectedItem.isText,
        isVideo: selectedItem.isVideo,
        name: selectedItem.name,
        path: selectedItem.path,
        sha: selectedItem.sha,
        text: selectedItem.text,
      }
    : readme
      ? {
          downloadUrl: null,
          htmlUrl: readme.htmlUrl,
          isImage: false,
          isMarkdown: true,
          isText: true,
          isVideo: false,
          name: readme.name,
          path: readme.path,
          sha: readme.sha,
          text: readme.markdown,
        }
      : null

  if (!target) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="px-5 py-16 text-center text-sm text-muted-foreground">
          Select a file to preview it here.
        </CardContent>
      </Card>
    )
  }

  const targetKey = `${target.path}:${target.sha}`

  return (
    <RepositoryFilePreviewContent
      key={targetKey}
      branch={branch}
      canEdit={canEdit}
      owner={owner}
      repo={repo}
      target={target}
    />
  )
}

function RepositoryFilePreviewContent({
  branch,
  canEdit,
  owner,
  repo,
  target,
}: {
  branch: string
  canEdit: boolean
  owner: string
  repo: string
  target: PreviewTarget
}) {
  const router = useRouter()
  const [previewMode, setPreviewMode] = useState<PreviewMode>("preview")
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editorScrollTop, setEditorScrollTop] = useState(0)
  const [content, setContent] = useState(target.text)
  const [currentSha, setCurrentSha] = useState(target.sha)
  const [commitMessage, setCommitMessage] = useState(`Update ${target.path}`)
  const [commitDescription, setCommitDescription] = useState("")

  const handleCopy = async () => {
    if (!target) return

    try {
      await navigator.clipboard.writeText(content)
      toast.success("File copied")
    } catch {
      toast.error("Could not copy file")
    }
  }

  const handleDownload = () => {
    if (!target) return

    if (target.downloadUrl) {
      window.open(target.downloadUrl, "_blank", "noopener,noreferrer")
      toast.success("Download started")
      return
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = objectUrl
    link.download = target.name
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
    toast.success("Download started")
  }

  const handleOpenGitHub = () => {
    if (!target.htmlUrl) return
    window.open(target.htmlUrl, "_blank", "noopener,noreferrer")
  }

  const handleCopyFilePath = async () => {
    if (!target) return

    try {
      await navigator.clipboard.writeText(target.path)
      toast.success("File path copied")
    } catch {
      toast.error("Could not copy file path")
    }
  }

  const handleCopyAppUrl = async () => {
    if (!target) return

    try {
      const appUrl = `${window.location.origin}/${owner}/${repo}?branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(target.path)}`
      await navigator.clipboard.writeText(appUrl)
      toast.success("File URL copied")
    } catch {
      toast.error("Could not copy file URL")
    }
  }

  const activeMode = useMemo<PreviewMode>(() => {
    if (!target?.isMarkdown) return "code"
    return previewMode
  }, [previewMode, target?.isMarkdown])
  const language = useMemo(
    () => (target ? getLanguageFromPath(target.path) : "text"),
    [target]
  )
  const isDirty = Boolean(target && content !== target.text)
  const lineCount = useMemo(
    () => Math.max(1, content.split("\n").length),
    [content]
  )
  const showsCodeActions = target?.isText ?? false
  const showsPreviewToggle =
    (target?.isMarkdown ?? false) &&
    !(target?.isImage ?? false) &&
    !(target?.isVideo ?? false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== "s"
      ) {
        return
      }

      if (!isEditing || !isDirty || isSaving) {
        return
      }

      event.preventDefault()
      setIsCommitDialogOpen(true)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isDirty, isEditing, isSaving])

  const handleStartEditing = () => {
    if (!target || !canEdit) return
    setIsEditing(true)
    setPreviewMode("code")
  }

  const handleCancelEditing = () => {
    if (!target) return
    setContent(target.text)
    setCommitMessage(`Update ${target.path}`)
    setCommitDescription("")
    setIsEditing(false)
    setIsCommitDialogOpen(false)
    setIsDiscardDialogOpen(false)
  }

  const handleRequestCancelEditing = () => {
    if (!isDirty) {
      handleCancelEditing()
      return
    }

    setIsDiscardDialogOpen(true)
  }

  const handleEditorScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    setEditorScrollTop(event.currentTarget.scrollTop)
  }

  const handleSave = async () => {
    if (!target || isSaving) return
    if (!commitMessage.trim()) {
      toast.error("Commit message is required")
      return
    }

    setIsSaving(true)

    const fullMessage = commitDescription.trim()
      ? `${commitMessage.trim()}\n\n${commitDescription.trim()}`
      : commitMessage.trim()

    const response = await fetch("/api/repository-file", {
      body: JSON.stringify({
        branch,
        content,
        message: fullMessage,
        owner,
        path: target.path,
        repo,
        sha: currentSha,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })

    const data = (await response.json()) as {
      commit?: {
        content?: {
          sha: string
        }
      }
      error?: string
    }

    setIsSaving(false)

    if (!response.ok) {
      toast.error(
        data.error === "conflict"
          ? "The file changed on GitHub. Reload the file and try again."
          : data.error === "forbidden"
            ? "You do not have permission to edit this file."
            : "Could not save file changes."
      )
      return
    }

    if (data.commit?.content?.sha) {
      setCurrentSha(data.commit.content.sha)
    }

    toast.success("File saved to GitHub")
    setIsEditing(false)
    setIsCommitDialogOpen(false)
    router.refresh()
  }

  const handleCommitSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSave()
  }

  const handleDelete = async () => {
    if (!target || !canEdit || isDeleting) return
    setIsDeleting(true)

    const response = await fetch("/api/repository-file", {
      body: JSON.stringify({
        branch,
        message: `Delete ${target.path}`,
        owner,
        path: target.path,
        repo,
        sha: currentSha,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "DELETE",
    })

    const data = (await response.json()) as { error?: string }

    if (!response.ok) {
      setIsDeleting(false)
      toast.error(
        data.error === "forbidden"
          ? "You do not have permission to delete this file."
          : "Could not delete file."
      )
      return
    }

    toast.success("File deleted")
    setIsDeleteDialogOpen(false)
    setIsDeleting(false)
    router.push(`/${owner}/${repo}?branch=${encodeURIComponent(branch)}`)
    router.refresh()
  }

  return (
    <Card className="w-80vw max-w-[90vw] min-w-0 rounded-2xl">
      <CardHeader className="border-b border-border px-3 py-3 sm:px-5">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <CardTitle className="flex min-w-0 items-center gap-3 text-sm sm:text-base">
              {getRepositoryItemIcon({
                name: target.name,
                type: "file",
              })}
              <span className="truncate">{target.path}</span>
            </CardTitle>

            <div className="ml-auto sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="rounded-xl"
                    title="File actions"
                    aria-label="File actions"
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {showsCodeActions && isEditing ? (
                    <>
                      <DropdownMenuItem
                        disabled={!isDirty || isSaving}
                        onClick={() => setIsCommitDialogOpen(true)}
                      >
                        {isSaving ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Check />
                        )}
                        Commit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleRequestCancelEditing}>
                        <X />
                        Cancel editing
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  ) : showsCodeActions ? (
                    <>
                      <DropdownMenuItem
                        disabled={!canEdit}
                        onClick={handleStartEditing}
                      >
                        <Edit3 />
                        Edit file
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  ) : null}

                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy />
                    Copy file
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download />
                    Download file
                  </DropdownMenuItem>
                  {target.htmlUrl ? (
                    <DropdownMenuItem onClick={handleOpenGitHub}>
                      <SquareArrowOutUpRight />
                      Open in GitHub
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyFilePath}>
                    <Copy />
                    Copy file path
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyAppUrl}>
                    <SquareArrowOutUpRight />
                    Copy file URL
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={!canEdit}
                  >
                    <X />
                    Delete file
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {showsPreviewToggle ? (
            <div className="inline-flex w-fit min-w-0 items-center gap-1 rounded-lg border border-border bg-muted/20 p-1 sm:hidden">
              <ToggleButton
                active={activeMode === "preview"}
                onClick={() => setPreviewMode("preview")}
              >
                Preview
              </ToggleButton>
              <ToggleButton
                active={activeMode === "code"}
                onClick={() => setPreviewMode("code")}
              >
                Code
              </ToggleButton>
            </div>
          ) : null}

          <div className="ml-auto hidden w-full flex-wrap items-center gap-2 sm:flex md:w-auto md:justify-end">
            {showsPreviewToggle ? (
              <div className="inline-flex min-w-0 items-center gap-1 rounded-lg border border-border bg-muted/20 p-1">
                <ToggleButton
                  active={activeMode === "preview"}
                  onClick={() => setPreviewMode("preview")}
                >
                  Preview
                </ToggleButton>
                <ToggleButton
                  active={activeMode === "code"}
                  onClick={() => setPreviewMode("code")}
                >
                  Code
                </ToggleButton>
              </div>
            ) : null}

            {showsCodeActions && isEditing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={!isDirty || isSaving}
                  onClick={() => setIsCommitDialogOpen(true)}
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
                  Commit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-xl"
                  onClick={handleRequestCancelEditing}
                  title="Cancel editing"
                  aria-label="Cancel editing"
                >
                  <X />
                </Button>
              </>
            ) : showsCodeActions ? (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="rounded-xl"
                disabled={!canEdit}
                onClick={handleStartEditing}
                title="Edit file"
                aria-label="Edit file"
              >
                <Edit3 />
              </Button>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="rounded-xl"
                onClick={handleCopy}
                title="Copy file"
                aria-label="Copy file"
              >
                <Copy />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="rounded-xl"
                onClick={handleDownload}
                title="Download file"
                aria-label="Download file"
              >
                <Download />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="rounded-xl"
                    title="More actions"
                    aria-label="More actions"
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={handleCopyFilePath}>
                    <Copy />
                    Copy file path
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopyAppUrl}>
                    <SquareArrowOutUpRight />
                    Copy file URL
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    disabled={!canEdit}
                  >
                    <X />
                    Delete file
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {target.htmlUrl ? (
                <A
                  href={target.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-8 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label="Open file on GitHub"
                  title="Open file on GitHub"
                >
                  <SquareArrowOutUpRight className="size-4" />
                </A>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="max-w-[90vw] min-w-0 overflow-hidden px-3 py-3 sm:px-5 sm:py-5">
        {target.isImage && target.downloadUrl ? (
          <div className="flex max-w-full justify-center overflow-hidden">
            <Image
              alt={target.name}
              src={target.downloadUrl}
              className="block h-auto max-h-[70vh] max-w-full object-contain"
            />
          </div>
        ) : target.isVideo && target.downloadUrl ? (
          <VideoPlayer
            src={target.downloadUrl}
            className="max-h-[70vh] max-w-full"
            title={target.name}
          />
        ) : activeMode === "preview" ? (
          <MarkdownPreview
            markdown={content}
            repositoryContext={{
              branch,
              filePath: target.path,
              owner,
              repo,
            }}
          />
        ) : isEditing ? (
          <div className="h-[64vh] overflow-hidden rounded-xl border border-border bg-[#151515] sm:h-[70vh]">
            <div className="flex h-full">
              <div
                aria-hidden="true"
                className="h-full w-14 shrink-0 overflow-hidden border-r border-border/70 bg-black/10 px-3 py-4 text-right font-mono text-[13px] leading-normal text-muted-foreground/60 select-none"
              >
                <div
                  style={{ transform: `translateY(-${editorScrollTop}px)` }}
                  className="will-change-transform"
                >
                  {Array.from({ length: lineCount }, (_, index) => (
                    <div key={index + 1}>{index + 1}</div>
                  ))}
                </div>
              </div>
              <textarea
                spellCheck={false}
                wrap="off"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onKeyDown={handleTextareaVsCodeKeydown}
                onScroll={handleEditorScroll}
                className="h-full w-full resize-none overflow-auto border-0 bg-transparent p-4 font-mono text-[13px] leading-normal whitespace-pre text-foreground outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="relative min-h-[64vh] w-full max-w-[min(90vw,100%)] overflow-hidden rounded-xl border border-border bg-[#151515] sm:min-h-[70vh]">
            <div
              aria-hidden="true"
              className="absolute inset-0 overflow-auto select-text"
            >
              <SyntaxHighlighter
                language={language}
                style={oneDark}
                customStyle={{
                  background: "transparent",
                  margin: 0,
                  minHeight: "100%",
                  padding: "16px",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  userSelect: "text",
                  WebkitUserSelect: "text",
                }}
                codeTagProps={{
                  style: {
                    fontFamily: "var(--font-mono)",
                    userSelect: "text",
                    WebkitUserSelect: "text",
                  },
                }}
                lineNumberStyle={{
                  minWidth: "2.5em",
                  opacity: 0.45,
                }}
                showLineNumbers
                wrapLongLines={false}
              >
                {content || " "}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isCommitDialogOpen} onOpenChange={setIsCommitDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Commit changes</DialogTitle>
            <DialogDescription>
              Committing changes to{" "}
              <code className="rounded-sm border px-1 font-bold">{branch}</code>{" "}
              branch.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleCommitSubmit}>
            <div className="space-y-2">
              <label className="font-medium text-foreground">
                Commit message
              </label>
              <Input
                className="mt-2"
                disabled={isSaving}
                value={commitMessage}
                onChange={(event) => setCommitMessage(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="font-medium text-foreground">Description</label>
              <Textarea
                disabled={isSaving}
                value={commitDescription}
                onChange={(event) => setCommitDescription(event.target.value)}
                className="mt-2 min-h-28 w-full resize-none rounded-xl border border-border px-3 py-2 text-sm text-foreground outline-none"
                placeholder="Add an optional extended description"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setIsCommitDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl">
                {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
                Commit changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) setIsDeleteDialogOpen(open)
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete{" "}
              <code className="rounded-sm border px-1 font-bold">
                {target.path}
              </code>{" "}
              from{" "}
              <code className="rounded-sm border px-1 font-bold">{branch}</code>
              . This creates a commit on GitHub.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              className="rounded-xl"
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {isDeleting ? <Loader2 className="animate-spin" /> : <X />}
              Delete file
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDiscardDialogOpen} onOpenChange={setIsDiscardDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              Your edits to{" "}
              <code className="rounded-sm border px-1 font-bold">
                {target.path}
              </code>{" "}
              have not been committed and will be lost.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => setIsDiscardDialogOpen(false)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={handleCancelEditing}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
