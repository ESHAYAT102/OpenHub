import ProfileRepositories from "@/components/ProfileRepositories"
import type { GitHubRepository } from "@/lib/github"

type HomeRepositoriesProps = {
  initialQuery?: string
  isUsingPrivateRepoAccess: boolean
  repositories: GitHubRepository[]
  starredRepositories?: GitHubRepository[]
}

export default function HomeRepositories({
  initialQuery,
  isUsingPrivateRepoAccess,
  repositories,
  starredRepositories = [],
}: HomeRepositoriesProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Repositories</h1>

      {!isUsingPrivateRepoAccess ? (
        <div className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          Private repositories need a refreshed GitHub session. Sign out and
          sign back in once if you signed in before this update.
        </div>
      ) : null}

      <ProfileRepositories
        initialQuery={initialQuery}
        repositories={repositories}
        starredRepositories={starredRepositories}
      />
    </div>
  )
}
