import { describe, expect, it } from "vitest"

import {
  extractSummarySource,
  normalizeSummary,
} from "@/lib/readme-summary"

describe("readme summary helpers", () => {
  it("keeps the prose paragraph and drops README chrome", () => {
    const input =
      '<p align="center"> <img src="docs/odysseus-wordmark.png" alt="Odysseus" width="280"> </p> <p align="center"> A self-hosted AI workspace for chat, agents, research, documents, email, notes, calendar, and local model workflows. </p> <p align="center"> <a href="#quick-start">Quick Start</a> · <a href="docs/setup.md">Setup Guide</a> </p>'

    expect(extractSummarySource(input)).toBe(
      "A self-hosted AI workspace for chat, agents, research, documents, email, notes, calendar, and local model workflows."
    )
  })

  it("cleans malformed html fragments and entities", () => {
    const input =
      "<emHe says nothing. He writes one line. It works.</em <strong~54% less code &middot; ~20% cheaper &middot; ~27% faster &middot; 100% safe</strong"

    const summary = normalizeSummary(input)

    expect(summary).toContain("He says nothing. He writes one line. It works.")
    expect(summary).toContain("·")
    expect(summary).not.toContain("<")
    expect(summary).not.toContain("&middot;")
  })

  it("returns an empty summary source for navigation-only markdown", () => {
    expect(
      extractSummarySource(
        '<p align="center"><a href="#quick-start">Quick Start</a></p>'
      )
    ).toBe("")
  })
})
