import { describe, expect, it } from "vitest"

import { GITHUB_OAUTH_SCOPES } from "@/app/api/auth/github/login/route"

describe("GitHub OAuth scopes", () => {
  it("requests all required scopes on the first login", () => {
    expect(GITHUB_OAUTH_SCOPES).toEqual([
      "user",
      "repo",
      "delete_repo",
      "notifications",
    ])
  })
})
