"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ImageProps = React.ComponentProps<"img"> & {
  src: string
  alt: string
}

export default function Image({
  src,
  alt,
  className,
  style,
  ...props
}: ImageProps) {
  return (
      <img
        src={src}
        alt={alt}
        className={cn("h-auto max-w-full", className)}
        style={{ maxWidth: "100%", ...style }}
        {...props}
      />
  )
}
