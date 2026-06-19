import { describe, expect, it } from "vitest"

import { buildReadmeCaption } from "@/lib/trending-feed"

describe("trending feed README captions", () => {
  it("uses the first readable README lines as the caption", () => {
    const readme = {
      htmlUrl: "https://github.com/esh/xenon/blob/main/README.md",
      markdown: `
# Xenon

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://example.com)

A fast feed for GitHub repos.
It keeps captions grounded in README text.
`,
      name: "README.md",
      path: "README.md",
      sha: "abc123",
    }

    expect(buildReadmeCaption(readme)).toBe(
      "Xenon\nA fast feed for GitHub repos.\nIt keeps captions grounded in README text."
    )
  })

  it("returns an empty caption when the README has no useful prose", () => {
    const readme = {
      htmlUrl: "https://github.com/esh/xenon/blob/main/README.md",
      markdown: `
## Installation

## Usage
`,
      name: "README.md",
      path: "README.md",
      sha: "abc123",
    }

    expect(buildReadmeCaption(readme)).toBe("")
    expect(buildReadmeCaption(null)).toBe("")
  })
})
