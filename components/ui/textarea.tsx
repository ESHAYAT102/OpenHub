"use client"

import * as React from "react"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, disabled, readOnly, ...props }, forwardedRef) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const setRefs = (node: HTMLTextAreaElement | null) => {
    textareaRef.current = node

    if (typeof forwardedRef === "function") {
      forwardedRef(node)
      return
    }

    if (forwardedRef) {
      forwardedRef.current = node
    }
  }

  const handleCopy = async () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const text = textarea.value
    await navigator.clipboard.writeText(text)
  }

  const handleCut = async () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const text = textarea.value
    await navigator.clipboard.writeText(text)
    textarea.value = ""
    textarea.dispatchEvent(new Event("input", { bubbles: true }))
  }

  const handlePaste = async () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const text = await navigator.clipboard.readText()
    textarea.value = (textarea.value ?? "") + text
    textarea.dispatchEvent(new Event("input", { bubbles: true }))
  }

  const handleDelete = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.value = ""
    textarea.dispatchEvent(new Event("input", { bubbles: true }))
  }

  const canEdit = !disabled && !readOnly

  return (
    <BrowserContextMenu
      triggerClassName="block w-full"
      menuChildren={
        <>
          <ContextMenuGroup>
            <ContextMenuItem disabled={!canEdit} onClick={handleCut}>
              Cut
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCopy}>Copy</ContextMenuItem>
            <ContextMenuItem disabled={!canEdit} onClick={handlePaste}>
              Paste
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem
              disabled={!canEdit}
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </ContextMenuItem>
          </ContextMenuGroup>
        </>
      }
    >
      <textarea
        ref={setRefs}
        data-slot="textarea"
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "flex min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          className
        )}
        {...props}
      />
    </BrowserContextMenu>
  )
})

Textarea.displayName = "Textarea"

export { Textarea }
