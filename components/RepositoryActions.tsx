"use client"

import { useMemo, useState } from "react"
import { Check, Copy, Download, Laptop, Link2 } from "lucide-react"

import A from "@/components/A"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type RepositoryActionsProps = {
  branch: string
  fullName: string
  htmlUrl: string
}

export default function RepositoryActions({
  branch,
  fullName,
  htmlUrl,
}: RepositoryActionsProps) {
  const [protocol, setProtocol] = useState<"https" | "ssh" | "gh">("https")
  const [copied, setCopied] = useState(false)

  const cloneUrl = useMemo(() => {
    if (protocol === "ssh") {
      return `git clone git@github.com:${fullName}.git`
    }
    if (protocol === "gh") {
      return `gh repo clone ${fullName}`
    }

    return `git clone ${htmlUrl}.git`
  }, [fullName, htmlUrl, protocol])

  const zipUrl = `${htmlUrl}/archive/refs/heads/${branch}.zip`
  const desktopUrl = `x-github-client://openRepo/${htmlUrl}`

  const copyCloneUrl = async () => {
    try {
      await navigator.clipboard.writeText(cloneUrl)
      setCopied(true)
      toast.success("Clone URL copied")
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
      toast.error("Could not copy clone URL")
    }
  }

  const copyRepoUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${htmlUrl}.git`)
      toast.success("Git URL copied")
    } catch {
      toast.error("Could not copy Git URL")
    }
  }

  const downloadZip = () => {
    window.open(zipUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
      <button
        type="button"
        className="sr-only"
        data-repo-action-copy-url
        onClick={copyRepoUrl}
      >
        Copy GitHub URL
      </button>
      <button
        type="button"
        className="sr-only"
        data-repo-action-download-zip
        onClick={downloadZip}
      >
        Download ZIP
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full rounded-xl sm:w-auto"
            data-repo-action-clone
            data-ui-sound="click"
          >
            <Copy />
            Clone
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[min(92vw,26rem)] rounded-2xl border border-border/70 bg-card/80 p-4 shadow-2xl supports-backdrop-filter:backdrop-blur-sm"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/70 bg-background/40 p-1">
              <button
                type="button"
                onClick={() => setProtocol("https")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  protocol === "https"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                HTTPS
              </button>
              <button
                type="button"
                onClick={() => setProtocol("ssh")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  protocol === "ssh"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                SSH
              </button>
              <button
                type="button"
                onClick={() => setProtocol("gh")}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  protocol === "gh"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                CLI
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                Clone with {protocol}
              </p>
              <div className="flex items-center gap-2">
                <Input value={cloneUrl} readOnly className="h-11 rounded-xl" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-xl"
                  onClick={copyCloneUrl}
                  data-ui-sound="copy"
                >
                  {copied ? <Check /> : <Copy />}
                </Button>
              </div>
            </div>

            <div className="border-t border-border/60 pt-3">
              <div className="flex flex-col gap-2">
                <A
                  href={htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <Link2 className="size-4" />
                  Open on GitHub
                </A>
                <A
                  href={desktopUrl}
                  className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  <Laptop className="size-4" />
                  Open with GitHub Desktop
                </A>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button asChild variant="outline" className="w-full rounded-xl sm:w-auto">
        <A href={zipUrl}>
          <Download />
          ZIP
        </A>
      </Button>
    </div>
  )
}
