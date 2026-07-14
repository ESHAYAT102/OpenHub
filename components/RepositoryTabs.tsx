"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  CircleDot,
  Code,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquare,
  Settings,
  Tag,
} from "lucide-react"

type RepositoryTab =
  | "code"
  | "commits"
  | "discussions"
  | "issues"
  | "pulls"
  | "releases"
  | "settings"

type RepositoryTabsProps = {
  canManageRepository: boolean
  commitCount: number
  currentTab: RepositoryTab
  discussionCount: number
  hasDiscussions: boolean
  hasReleases: boolean
  issueCount: number
  latestRelease: { tag_name: string } | null
  pullRequestCount: number
  repo: string
  resolvedBranch: string
  username: string
  codeContent: React.ReactNode
  commitsContent: React.ReactNode
  discussionsContent: React.ReactNode
  issuesContent: React.ReactNode
  pullsContent: React.ReactNode
  releasesContent: React.ReactNode
  settingsContent: React.ReactNode
}

export default function RepositoryTabs({
  canManageRepository,
  commitCount,
  currentTab,
  discussionCount,
  hasDiscussions,
  hasReleases,
  issueCount,
  latestRelease,
  pullRequestCount,
  repo,
  resolvedBranch,
  username,
  codeContent,
  commitsContent,
  discussionsContent,
  issuesContent,
  pullsContent,
  releasesContent,
  settingsContent,
}: RepositoryTabsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<RepositoryTab>(currentTab)

  const tabLinkClass = (isActive: boolean) =>
    [
      "inline-flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm transition",
      isActive
        ? "border-foreground text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground",
    ].join(" ")

  const handleTabClick = (tab: RepositoryTab) => {
    setActiveTab(tab)
    const params = new URLSearchParams({ tab })
    if (resolvedBranch) params.set("branch", resolvedBranch)
    router.replace(`/${username}/${repo}?${params.toString()}`, {
      scroll: false,
    })
  }

  return (
    <>
      <div className="border-b border-border">
        <div className="-mx-4 flex w-full items-center gap-3 overflow-x-auto px-4 whitespace-nowrap [scrollbar-width:none] md:-mx-8 md:gap-5 md:px-8">
          <button
            onClick={() => handleTabClick("code")}
            className={tabLinkClass(activeTab === "code")}
            data-repo-tab
            data-repo-tab-code
          >
            <Code className="size-4" />
            Code
          </button>
          <button
            onClick={() => handleTabClick("commits")}
            className={tabLinkClass(activeTab === "commits")}
            data-repo-tab
            data-repo-tab-commits
          >
            <GitCommitHorizontal className="size-4" />
            Commits
            <span className="text-xs text-muted-foreground">{commitCount}</span>
          </button>
          <button
            onClick={() => handleTabClick("issues")}
            className={tabLinkClass(activeTab === "issues")}
            data-repo-tab
            data-repo-tab-issues
          >
            <CircleDot className="size-4" />
            Issues
            <span className="text-xs text-muted-foreground">{issueCount}</span>
          </button>
          {hasDiscussions && (
            <button
              onClick={() => handleTabClick("discussions")}
              className={tabLinkClass(activeTab === "discussions")}
              data-repo-tab
              data-repo-tab-discussions
            >
              <MessageSquare className="size-4" />
              Discussions
              <span className="text-xs text-muted-foreground">
                {discussionCount}
              </span>
            </button>
          )}
          <button
            onClick={() => handleTabClick("pulls")}
            className={tabLinkClass(activeTab === "pulls")}
            data-repo-tab
            data-repo-tab-pulls
          >
            <GitPullRequest className="size-4" />
            Pull Requests
            <span className="text-xs text-muted-foreground">
              {pullRequestCount}
            </span>
          </button>
          {hasReleases && (
            <button
              onClick={() => handleTabClick("releases")}
              className={tabLinkClass(activeTab === "releases")}
              data-repo-tab
              data-repo-tab-releases
            >
              <Tag className="size-4" />
              Releases
              {latestRelease && (
                <span className="text-xs text-muted-foreground">
                  {latestRelease.tag_name}
                </span>
              )}
            </button>
          )}
          {canManageRepository && (
            <button
              onClick={() => handleTabClick("settings")}
              className={tabLinkClass(activeTab === "settings")}
              data-repo-tab
              data-repo-tab-settings
            >
              <Settings className="size-4" />
              Settings
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6">
        <section className="space-y-6">
          <div className={activeTab === "code" ? "block" : "hidden"}>
            {codeContent}
          </div>
          <div className={activeTab === "commits" ? "block" : "hidden"}>
            {commitsContent}
          </div>
          <div className={activeTab === "issues" ? "block" : "hidden"}>
            {issuesContent}
          </div>
          <div className={activeTab === "discussions" ? "block" : "hidden"}>
            {discussionsContent}
          </div>
          <div className={activeTab === "pulls" ? "block" : "hidden"}>
            {pullsContent}
          </div>
          {hasReleases && (
            <div className={activeTab === "releases" ? "block" : "hidden"}>
              {releasesContent}
            </div>
          )}
          <div className={activeTab === "settings" ? "block" : "hidden"}>
            {settingsContent}
          </div>
        </section>
      </div>
    </>
  )
}
