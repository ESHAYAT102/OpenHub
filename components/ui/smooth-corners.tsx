"use client"

import { SmoothCorners } from "@lisse/react"
import type { ReactElement } from "react"

export function Smooth({
  children,
  radius,
  smoothing = 1,
}: {
  children: ReactElement
  radius: number
  smoothing?: number
}) {
  return (
    <SmoothCorners
      asChild
      autoEffects
      corners={{ radius, smoothing }}
    >
      {children}
    </SmoothCorners>
  )
}
