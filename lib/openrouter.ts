import { normalizeSummary } from "@/lib/readme-summary"

export type RepositorySummaryInput = {
  description: string | null
  forks: number
  fullName: string
  hasMedia: boolean
  key: string
  language: string | null
  ownerName: string
  readme: string | null
  stars: number
  topics: string[]
}

export const DEFAULT_OPENROUTER_MODEL = "google/gemma-4-31b-it:free"

function extractJsonBlock(value: string) {
  const start = value.indexOf("{")
  const end = value.lastIndexOf("}")

  if (start === -1 || end === -1 || end <= start) {
    return null
  }

  return value.slice(start, end + 1)
}

function parseSummaries(content: string) {
  const parsedInputs = [content, extractJsonBlock(content)].filter(
    (value): value is string => Boolean(value)
  )

  for (const candidate of parsedInputs) {
    try {
      const parsed = JSON.parse(candidate) as
        | { summaries?: Array<{ key?: string; summary?: string }> }
        | Record<string, string>

      if (
        parsed &&
        typeof parsed === "object" &&
        "summaries" in parsed &&
        Array.isArray(parsed.summaries)
      ) {
        return new Map(
          parsed.summaries
            .map((entry) =>
              entry.key && entry.summary
                ? [entry.key, normalizeSummary(entry.summary)] as const
                : null
            )
            .filter((value): value is readonly [string, string] => Boolean(value))
        )
      }

      if (parsed && typeof parsed === "object") {
        return new Map(
          Object.entries(parsed).map(([key, summary]) => [
            key,
            normalizeSummary(String(summary)),
          ])
        )
      }
    } catch {
      continue
    }
  }

  return new Map<string, string>()
}

export async function generateRepositorySummaries(
  inputs: RepositorySummaryInput[]
) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (!apiKey || inputs.length === 0) {
    return new Map<string, string>()
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    body: JSON.stringify({
      model: DEFAULT_OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You write short, plain-text social post summaries for repositories. Use the provided repository prose, not README layout noise, headings, HTML tags, image markup, link lists, navigation text, badges, or raw URLs. Return only JSON with a top-level summaries array. Each summary must be 1-2 sentences, no markdown, no bullets, no hashtags, no emojis, and no invented details.",
        },
        {
          role: "user",
          content: JSON.stringify({
            repos: inputs,
          }),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.25,
      max_tokens: 512,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": "Repository Feed",
    },
    method: "POST",
  })

  if (!response.ok) {
    return new Map<string, string>()
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content?.trim() ?? ""
  if (!content) {
    return new Map<string, string>()
  }

  return parseSummaries(content)
}
