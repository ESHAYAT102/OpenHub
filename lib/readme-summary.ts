export const SUMMARY_CACHE_VERSION = 2

const KNOWN_TAG_NAMES = [
  "article",
  "aside",
  "audio",
  "a",
  "abbr",
  "b",
  "blockquote",
  "br",
  "button",
  "caption",
  "code",
  "details",
  "div",
  "em",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "i",
  "img",
  "input",
  "label",
  "li",
  "main",
  "nav",
  "ol",
  "option",
  "p",
  "picture",
  "pre",
  "section",
  "select",
  "source",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
  "video",
].sort((a, b) => b.length - a.length)

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&middot;/gi, "·")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&hellip;/gi, "…")
}

function findTagPrefix(value: string) {
  const lower = value.toLowerCase()

  for (const tag of KNOWN_TAG_NAMES) {
    if (lower === tag) {
      return tag
    }

    if (!lower.startsWith(tag) || value.length <= tag.length) {
      continue
    }

    const nextChar = value[tag.length]
    if (/[A-Z0-9:_-]/.test(nextChar ?? "")) {
      return tag
    }
  }

  return null
}

function stripLooseMarkup(value: string) {
  let result = ""
  let index = 0

  while (index < value.length) {
    if (value[index] === "<") {
      let cursor = index + 1
      if (value[cursor] === "/") {
        cursor += 1
      }

      const nameStart = cursor
      while (cursor < value.length && /[A-Za-z0-9:-]/.test(value[cursor])) {
        cursor += 1
      }

      const rawName = value.slice(nameStart, cursor)
      const tagName = findTagPrefix(rawName)
      if (tagName) {
        const suffixStart = nameStart + tagName.length
        if (suffixStart < cursor) {
          index = suffixStart
          continue
        }

        while (cursor < value.length && !/\s/.test(value[cursor])) {
          cursor += 1
        }

        index = cursor
        continue
      }
    }

    result += value[index]
    index += 1
  }

  return result
}

export function normalizeSummary(value: string) {
  return stripLooseMarkup(decodeHtmlEntities(value))
    .replace(/\bhttps?:\/\/\S+/gi, " ")
    .replace(/[*_`>]/g, " ")
    .replace(/\s*·\s*/g, " · ")
    .replace(/\s+/g, " ")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim()
}

export function stripReadmeMarkup(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, "\n")
    .replace(/<!--[\s\S]*?-->/g, "\n")
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(
      /<\/(?:p|div|section|article|header|footer|main|aside|nav|blockquote|pre|figure|figcaption|table|thead|tbody|tfoot|tr|td|th|ul|ol|li|h[1-6])>/gi,
      "\n"
    )
    .replace(
      /<(?:p|div|section|article|header|footer|main|aside|nav|blockquote|pre|figure|figcaption|table|thead|tbody|tfoot|tr|td|th|ul|ol|li|h[1-6])[^>]*>/gi,
      "\n"
    )
    .replace(/<picture[^>]*>/gi, "\n")
    .replace(/<\/picture>/gi, "\n")
    .replace(/<img[^>]*>/gi, "\n")
    .replace(/<source[^>]*>/gi, "\n")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "\n")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s*(.+)$/gm, "\n$1\n")
}

export function extractReadableBlocks(markdown: string) {
  return stripReadmeMarkup(markdown)
    .replace(/<\/?[A-Za-z][A-Za-z0-9:-]*(?:\s[^<>]*?)?>/g, " ")
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((block) => normalizeSummary(block))
    .filter(Boolean)
}

export function isBoilerplateBlock(block: string) {
  if (block.length <= 1) return true

  if (
    /^(quick start|quickstart|setup guide|table of contents|contents|read more|readme|read the docs|documentation|docs?|installation|install|usage|features|changelog|contributing|contribute|license|roadmap|full writeup|reproduce it|example prompt|overview|demo|faq|english|中文)$/i.test(
      block
    )
  ) {
    return true
  }

  if (/^[\d\s|./_-]+$/.test(block)) return true
  if (block.includes("|") && block.split(/\s+/).length <= 5) return true
  if (/\b(?:href|src|alt|align|width|height|title|class)=/i.test(block)) return true
  if (/\b(?:shields\.io|badge|badge\.sh|github-readme)\b/i.test(block)) return true

  return false
}

export function isDescriptiveBlock(block: string) {
  const words = block.split(/\s+/).filter(Boolean)
  return words.length >= 6 || /[.!?]/.test(block)
}

export function extractSummarySource(markdown: string) {
  const blocks = extractReadableBlocks(markdown)
  if (blocks.length === 0) return ""

  const candidates = blocks.filter(
    (block) => !isBoilerplateBlock(block) && isDescriptiveBlock(block)
  )
  if (candidates.length === 0) {
    return ""
  }

  return candidates.slice(0, 2).join(" ")
}
