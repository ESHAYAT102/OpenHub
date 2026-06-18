"use client"

import * as React from "react"
import Link from "next/link"

type AProps = React.ComponentProps<"a"> & {
  href: string
  prefetch?: React.ComponentProps<typeof Link>["prefetch"]
}

export default function A({
  href,
  children,
  className,
  prefetch = false,
  ...props
}: AProps) {
  const isInternalHref = href.startsWith("/")

  return (
    <>
      {isInternalHref ? (
        <Link href={href} className={className} prefetch={prefetch} {...props}>
          {children}
        </Link>
      ) : (
        <a href={href} className={className} {...props}>
          {children}
        </a>
      )}
    </>
  )
}
