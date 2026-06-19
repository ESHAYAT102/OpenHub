"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "@/components/Image"
import A from "@/components/A"
import VideoPlayer from "@/components/VideoPlayer"

type MarkdownPreviewProps = {
  markdown: string
  repositoryContext?: {
    branch: string
    filePath: string
    owner: string
    repo: string
  }
}

function isVideoUrl(value: string) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(value)
}

function isImageUrl(value: string) {
  return /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(value)
}

function isBadgeImage(value: string) {
  const lowerValue = value.toLowerCase()

  return (
    lowerValue.includes("img.shields.io") ||
    lowerValue.includes("badgen.net") ||
    lowerValue.includes("badge")
  )
}

function isGitHubAttachmentUrl(value: string) {
  return (
    value.includes("github.com/user-attachments/assets/") ||
    value.includes("user-images.githubusercontent.com/") ||
    value.includes("private-user-images.githubusercontent.com/")
  )
}

function isAbsoluteUrl(value: string) {
  return /^[a-z][a-z\d+\-.]*:/i.test(value)
}

function normalizePath(path: string) {
  const parts = path.split("/")
  const normalized: string[] = []

  for (const part of parts) {
    if (!part || part === ".") continue
    if (part === "..") {
      normalized.pop()
      continue
    }

    normalized.push(part)
  }

  return normalized.join("/")
}

function resolveMarkdownUrl(
  value: string,
  repositoryContext?: MarkdownPreviewProps["repositoryContext"]
) {
  if (!value || !repositoryContext) return value
  if (value.startsWith("#") || value.startsWith("mailto:")) return value
  if (isAbsoluteUrl(value)) return value

  const baseDirectory = repositoryContext.filePath.includes("/")
    ? repositoryContext.filePath.split("/").slice(0, -1).join("/")
    : ""
  const relativePath = value.startsWith("/")
    ? value.slice(1)
    : [baseDirectory, value].filter(Boolean).join("/")
  const normalizedPath = normalizePath(relativePath)

  return `https://raw.githubusercontent.com/${repositoryContext.owner}/${repositoryContext.repo}/${repositoryContext.branch}/${normalizedPath}`
}

function splitHash(value: string) {
  const hashIndex = value.indexOf("#")
  if (hashIndex === -1) {
    return { base: value, hash: "" }
  }

  return {
    base: value.slice(0, hashIndex),
    hash: value.slice(hashIndex),
  }
}

function buildRepositoryFileHref({
  branch,
  hash,
  owner,
  path,
  repo,
}: {
  branch?: string
  hash?: string
  owner: string
  path?: string
  repo: string
}) {
  const query = new URLSearchParams()
  if (branch) query.set("branch", branch)
  if (path) query.set("path", path)

  const queryString = query.toString()
  return `/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${
    queryString ? `?${queryString}` : ""
  }${hash ?? ""}`
}

function resolveGitHubRepositoryLink(value: string) {
  try {
    const url = new URL(value)
    const segments = url.pathname.split("/").filter(Boolean)

    if (
      url.hostname === "github.com" &&
      segments.length >= 2 &&
      (segments[2] === "blob" ||
        segments[2] === "tree" ||
        segments[2] === "raw")
    ) {
      const pathSegments = segments.slice(4)
      return buildRepositoryFileHref({
        branch: segments[3] ? decodeURIComponent(segments[3]) : undefined,
        hash: url.hash,
        owner: decodeURIComponent(segments[0]),
        path:
          pathSegments.length > 0
            ? pathSegments.map(decodeURIComponent).join("/")
            : undefined,
        repo: decodeURIComponent(segments[1]),
      })
    }

    if (url.hostname === "raw.githubusercontent.com" && segments.length >= 4) {
      return buildRepositoryFileHref({
        branch: decodeURIComponent(segments[2]),
        hash: url.hash,
        owner: decodeURIComponent(segments[0]),
        path: segments.slice(3).map(decodeURIComponent).join("/"),
        repo: decodeURIComponent(segments[1]),
      })
    }
  } catch {
    return null
  }

  return null
}

function resolveMarkdownLinkUrl(
  value: string,
  repositoryContext?: MarkdownPreviewProps["repositoryContext"]
) {
  if (!value || !repositoryContext) return value
  if (value.startsWith("#") || value.startsWith("mailto:")) return value

  if (isAbsoluteUrl(value)) {
    return resolveGitHubRepositoryLink(value) ?? value
  }

  const { base, hash } = splitHash(value)
  if (!base) return hash

  const baseDirectory = repositoryContext.filePath.includes("/")
    ? repositoryContext.filePath.split("/").slice(0, -1).join("/")
    : ""
  const relativePath = base.startsWith("/")
    ? base.slice(1)
    : [baseDirectory, base].filter(Boolean).join("/")
  const normalizedPath = normalizePath(relativePath)

  return buildRepositoryFileHref({
    branch: repositoryContext.branch,
    hash,
    owner: repositoryContext.owner,
    path: normalizedPath,
    repo: repositoryContext.repo,
  })
}

function toNumber(value?: string | number) {
  if (typeof value === "number") return value
  if (typeof value !== "string") return undefined
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function isSmallMedia({
  height,
  src,
  width,
}: {
  height?: string | number
  src: string
  width?: string | number
}) {
  const iconLikeSources = [
    "devicon",
    "skillicons.dev",
    "simpleicons",
    "simpleicons.org",
    "vectorlogo.zone",
    "icons8.com",
    "iconify.design",
  ]
  if (isBadgeImage(src)) return true
  if (iconLikeSources.some((source) => src.includes(source))) return true
  const numericWidth = toNumber(width)
  const numericHeight = toNumber(height)
  if (numericWidth && numericWidth <= 48) return true
  if (numericHeight && numericHeight <= 48) return true
  return false
}

function SmartMedia({
  alt,
  className,
  height,
  src,
  style,
  variant = "block",
  width,
}: {
  alt: string
  className?: string
  height?: number | string
  src: string
  style?: React.CSSProperties
  variant?: "inline" | "block"
  width?: number | string
}) {
  const isBadge = isBadgeImage(src)
  const explicitVideo = isVideoUrl(src)
  const explicitImage = isImageUrl(src) || isBadge
  const attachment = isGitHubAttachmentUrl(src)
  const [mode, setMode] = useState<"image" | "video" | "fallback">(
    explicitVideo ? "video" : "image"
  )
  const hasExplicitSize = Boolean(width || height)
  const blockMediaStyle: React.CSSProperties =
    variant === "block" && !isBadge
      ? { ...style, width: "min(85vw, 100%)", maxWidth: "100%" }
      : { ...style, maxWidth: "min(85vw, 100%)" }

  if (mode === "fallback") {
    return (
      <a
        href={src}
        className="text-foreground underline underline-offset-4"
        target="_blank"
        rel="noreferrer"
      >
        {src}
      </a>
    )
  }

  if (mode === "video") {
    const baseClassName =
      variant === "inline"
        ? hasExplicitSize
          ? "inline-block max-w-[min(85vw,100%)] rounded-md bg-transparent align-middle object-contain"
          : "inline-block max-h-8 w-auto rounded-md bg-transparent align-middle object-contain"
        : hasExplicitSize
          ? "my-4 w-[min(85vw,100%)] max-w-full rounded-xl bg-transparent object-contain"
          : "my-4 max-h-[32rem] w-[min(85vw,100%)] max-w-full rounded-xl bg-transparent object-contain"
    return (
      <VideoPlayer
        className={[baseClassName, className].filter(Boolean).join(" ")}
        height={height}
        onError={() =>
          setMode(explicitImage || attachment ? "image" : "fallback")
        }
        src={src}
        style={blockMediaStyle}
        title={alt || "Markdown video"}
        width={variant === "block" && !isBadge ? undefined : width}
        videoClassName="max-h-[inherit]"
      />
    )
  }

  const baseClassName =
    variant === "inline"
      ? hasExplicitSize
        ? "inline-block max-w-[min(85vw,100%)] align-middle object-contain"
        : "inline-block max-h-8 w-auto align-middle object-contain"
    : isBadge
        ? "my-1 inline-block h-5 w-auto align-middle object-contain"
        : hasExplicitSize
          ? "my-4 block h-auto w-[min(85vw,100%)] max-w-full object-contain"
          : "my-4 block h-auto max-h-[32rem] w-[min(85vw,100%)] max-w-full object-contain"

  return (
    <Image
      alt={alt}
      className={[baseClassName, className].filter(Boolean).join(" ")}
      onError={() =>
        setMode(explicitVideo || attachment ? "video" : "fallback")
      }
      height={height}
      src={src}
      style={blockMediaStyle}
      width={variant === "block" && !isBadge ? undefined : width}
    />
  )
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success("Code copied")
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error("Could not copy code")
    }
  }

  return (
    <div className="relative w-full max-w-[min(85vw,100%)]">
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        className="absolute top-3 right-3 z-10 rounded-lg border-border/70 bg-background/80 backdrop-blur-sm"
        onClick={handleCopy}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
      <div className="max-w-[min(85vw,100%)] overflow-x-auto rounded-xl border border-border bg-card">
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            background: "transparent",
            margin: 0,
            padding: "14px 56px 14px 16px",
            fontSize: "12px",
            lineHeight: "1.6",
            maxWidth: "min(85vw, 100%)",
            overflowX: "auto",
          }}
          codeTagProps={{
            style: {
              fontFamily: "var(--font-mono)",
            },
          }}
          wrapLongLines={false}
        >
          {code || " "}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

export default function MarkdownPreview({
  markdown,
  repositoryContext,
}: MarkdownPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const container = containerRef.current
    if (!container || !repositoryContext) return

    const hrefs = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('a[href^="/"]')
    )
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href))

    const uniqueHrefs = Array.from(new Set(hrefs)).slice(0, 50)
    if (uniqueHrefs.length === 0) return

    const prefetch = () => {
      for (const href of uniqueHrefs) {
        router.prefetch(href)
      }
    }

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }

    const id = setTimeout(prefetch, 0)
    return () => clearTimeout(id)
  }, [markdown, repositoryContext, router])

  const renderImageRow = (node: React.ReactNode) => {
    if (!node) return false
    const images: Array<{
      height?: string | number
      src: string
      width?: string | number
    }> = []
    if (Array.isArray(node)) {
      const onlyImages = node.every((child) => {
        if (!child) return true
        if (typeof child === "string") {
          return child.trim().length === 0
        }
        if (typeof child === "object" && "type" in child) {
          if (child.type === "img") {
            if (typeof child.props?.src === "string") {
              images.push({
                height: child.props?.height,
                src: resolveMarkdownUrl(child.props.src, repositoryContext),
                width: child.props?.width,
              })
            }
            return true
          }
          if (
            child.type === "a" &&
            typeof child.props?.children === "object" &&
            child.props.children?.type === "img"
          ) {
            if (typeof child.props.children?.props?.src === "string") {
              images.push({
                height: child.props.children.props?.height,
                src: resolveMarkdownUrl(
                  child.props.children.props.src,
                  repositoryContext
                ),
                width: child.props.children.props?.width,
              })
            }
            return true
          }
          return false
        }
        return false
      })
      if (!onlyImages) return false
      if (images.length === 0) return false
      return images.every((image) => isSmallMedia(image))
    }

    if (typeof node === "string") {
      return node.trim().length === 0
    }

    if (typeof node === "object" && "type" in node) {
      const nodeAny = node as {
        type?: unknown
        props?: {
          src?: unknown
          height?: unknown
          width?: unknown
          children?: unknown
        }
      }
      if (nodeAny.type === "img" && typeof nodeAny.props?.src === "string") {
        return isSmallMedia({
          height: nodeAny.props?.height as string | number | undefined,
          src: resolveMarkdownUrl(nodeAny.props.src, repositoryContext),
          width: nodeAny.props?.width as string | number | undefined,
        })
      }
      if (
        nodeAny.type === "a" &&
        typeof nodeAny.props?.children === "object" &&
        (nodeAny.props?.children as { type?: unknown }).type === "img" &&
        typeof (nodeAny.props?.children as { props?: { src?: unknown } }).props
          ?.src === "string"
      ) {
        const childAny = nodeAny.props?.children as {
          props?: { height?: unknown; src?: string; width?: unknown }
        }
        return isSmallMedia({
          height: childAny.props?.height as string | number | undefined,
          src: resolveMarkdownUrl(childAny.props?.src ?? "", repositoryContext),
          width: childAny.props?.width as string | number | undefined,
        })
      }
      return (
        nodeAny.type === "img" ||
        (nodeAny.type === "a" &&
          typeof nodeAny.props?.children === "object" &&
          (nodeAny.props?.children as { type?: unknown }).type === "img")
      )
    }

    return false
  }

  return (
    <div
      ref={containerRef}
      className="max-w-[90vw] min-w-0 space-y-4 overflow-hidden text-sm leading-7 text-muted-foreground **:max-w-[min(85vw,100%)]!"
    >
      <ReactMarkdown
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const resolvedMediaHref = href
              ? resolveMarkdownUrl(href, repositoryContext)
              : href
            const resolvedHref = href
              ? resolveMarkdownLinkUrl(href, repositoryContext)
              : href

            if (
              resolvedMediaHref &&
              (isVideoUrl(resolvedMediaHref) ||
                isImageUrl(resolvedMediaHref) ||
                isGitHubAttachmentUrl(resolvedMediaHref))
            ) {
              return (
                <span className="block">
                  <SmartMedia
                    alt={
                      typeof children === "string" ? children : "Markdown media"
                    }
                    src={resolvedMediaHref}
                    variant="block"
                  />
                </span>
              )
            }

            return (
              <A
                {...props}
                href={resolvedHref ?? "#"}
                className="break-words text-foreground underline underline-offset-4"
                target={resolvedHref?.startsWith("/") ? undefined : "_blank"}
                rel={resolvedHref?.startsWith("/") ? undefined : "noreferrer"}
              >
                {children}
              </A>
            )
          },
          code: ({ className, children, ...props }) => {
            const isBlock = Boolean(className)
            const content = String(children).replace(/\n$/, "")
            const language = className?.replace("language-", "") || undefined

            if (isBlock) {
              return <CodeBlock code={content} language={language} />
            }

            return (
              <code
                {...props}
                className="rounded bg-muted px-1 py-0.5 text-xs break-words text-foreground"
              >
                {children}
              </code>
            )
          },
          h1: (props) => (
            <h1
              {...props}
              className="text-2xl font-semibold break-words text-foreground"
            />
          ),
          h2: (props) => (
            <h2
              {...props}
              className="text-xl font-semibold break-words text-foreground"
            />
          ),
          h3: (props) => (
            <h3
              {...props}
              className="text-lg font-semibold break-words text-foreground"
            />
          ),
          hr: (props) => (
            <hr
              {...props}
              className="my-6 w-[min(85vw,100%)] max-w-full border-border"
            />
          ),
          img: ({ alt, src, width, height, className, style }) => {
            if (typeof src !== "string") return null
            const resolvedSrc = resolveMarkdownUrl(src, repositoryContext)
            const variant = isSmallMedia({
              height,
              src: resolvedSrc,
              width,
            })
              ? "inline"
              : "block"
            return (
              <SmartMedia
                alt={alt ?? "Markdown image"}
                className={className}
                height={height}
                src={resolvedSrc}
                style={style}
                variant={variant}
                width={width}
              />
            )
          },
          li: (props) => (
            <li {...props} className="ml-5 list-disc break-words" />
          ),
          p: ({ children, ...props }) => {
            if (renderImageRow(children)) {
              return (
                <span
                  {...props}
                  className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-3 text-sm leading-7 break-words text-muted-foreground"
                >
                  {Array.isArray(children)
                    ? children.map((child, index) => {
                        if (
                          child &&
                          typeof child === "object" &&
                          "type" in child
                        ) {
                          if (child.type === "img") {
                            return (
                              <SmartMedia
                                key={`img-${index}`}
                                alt={child.props?.alt ?? "Markdown image"}
                                className={child.props?.className}
                                height={child.props?.height}
                                src={resolveMarkdownUrl(
                                  child.props?.src ?? "",
                                  repositoryContext
                                )}
                                style={child.props?.style}
                                variant="inline"
                                width={child.props?.width}
                              />
                            )
                          }
                          if (
                            child.type === "a" &&
                            child.props?.children?.type === "img"
                          ) {
                            const imageNode = child.props.children
                            const href =
                              typeof child.props?.href === "string"
                                ? resolveMarkdownLinkUrl(
                                    child.props.href,
                                    repositoryContext
                                  )
                                : child.props?.href
                            return (
                              <a
                                key={`img-${index}`}
                                href={href}
                                target={
                                  href?.startsWith("/") ? undefined : "_blank"
                                }
                                rel={
                                  href?.startsWith("/")
                                    ? undefined
                                    : "noreferrer"
                                }
                                className="inline-flex max-w-full min-w-0"
                              >
                                <SmartMedia
                                  alt={imageNode.props?.alt ?? "Markdown image"}
                                  className={imageNode.props?.className}
                                  height={imageNode.props?.height}
                                  src={resolveMarkdownUrl(
                                    imageNode.props?.src ?? "",
                                    repositoryContext
                                  )}
                                  style={imageNode.props?.style}
                                  variant="inline"
                                  width={imageNode.props?.width}
                                />
                              </a>
                            )
                          }
                        }

                        if (typeof child === "string") {
                          return child.trim().length === 0 ? null : child
                        }

                        return child
                      })
                    : children}
                </span>
              )
            }

            return (
              <p
                {...props}
                className="max-w-full min-w-0 text-sm leading-7 break-words text-muted-foreground"
              >
                {children}
              </p>
            )
          },
          div: ({ children, ...props }) => {
            if (renderImageRow(children)) {
              return (
                <div
                  {...props}
                  className="flex max-w-full min-w-0 flex-wrap items-center gap-3 text-sm leading-7 break-words text-muted-foreground"
                >
                  {children}
                </div>
              )
            }
            return (
              <div
                {...props}
                className="max-w-full min-w-0 text-sm leading-7 break-words text-muted-foreground"
              >
                {children}
              </div>
            )
          },
          pre: (props) => <pre {...props} className="my-4" />,
          table: (props) => (
            <div className="max-w-full overflow-x-auto">
              <table
                {...props}
                className="w-full min-w-max border-collapse text-left"
              />
            </div>
          ),
          td: (props) => (
            <td {...props} className="border border-border px-3 py-2" />
          ),
          th: (props) => (
            <th
              {...props}
              className="border border-border px-3 py-2 font-medium text-foreground"
            />
          ),
          ul: (props) => <ul {...props} className="space-y-1" />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
