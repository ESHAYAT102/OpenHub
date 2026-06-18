"use client"

import * as React from "react"

type TextProps = {
  children: React.ReactNode
  className?: string
}

export default function Text({ children }: TextProps) {
  return <>{children}</>
}
