"use client"

import * as React from "react"

import BrowserContextMenu from "@/components/BrowserContextMenu"
import { ContextMenuGroup, ContextMenuItem } from "@/components/ui/context-menu"
import { ClipboardPaste, Copy, Scissors, Trash } from "lucide-react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { onClear?: () => void }
>(
  (
    { className, type, disabled, readOnly, onClear, ...props },
    forwardedRef
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)

    const setRefs = (node: HTMLInputElement | null) => {
      inputRef.current = node

      if (typeof forwardedRef === "function") {
        forwardedRef(node)
        return
      }

      if (forwardedRef) {
        forwardedRef.current = node
      }
    }

    const handleCopy = async () => {
      const input = inputRef.current
      if (!input) return

      const text = input.value
      await navigator.clipboard.writeText(text)
    }

    const handleCut = async () => {
      const input = inputRef.current
      if (!input) return

      const text = input.value
      await navigator.clipboard.writeText(text)
      input.value = ""
      input.dispatchEvent(new Event("input", { bubbles: true }))
    }

    const handlePaste = async () => {
      const input = inputRef.current
      if (!input) return

      const text = await navigator.clipboard.readText()
      input.value = (input.value ?? "") + text
      input.dispatchEvent(new Event("input", { bubbles: true }))
    }

    const handleDelete = () => {
      const input = inputRef.current
      if (!input) return

      input.value = ""
      input.dispatchEvent(new Event("input", { bubbles: true }))
      onClear?.()
    }

    const canEdit = !disabled && !readOnly

    return (
      <BrowserContextMenu
        triggerClassName="block w-full"
        menuChildren={
          <>
            <ContextMenuGroup>
              <ContextMenuItem disabled={!canEdit} onClick={handleCut}>
                <Scissors />
                Cut
              </ContextMenuItem>
              <ContextMenuItem onClick={handleCopy}>
                <Copy />
                Copy
              </ContextMenuItem>
              <ContextMenuItem disabled={!canEdit} onClick={handlePaste}>
                <ClipboardPaste />
                Paste
              </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuGroup>
              <ContextMenuItem
                disabled={!canEdit}
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash />
                Clear
              </ContextMenuItem>
            </ContextMenuGroup>
          </>
        }
      >
        <input
          ref={setRefs}
          type={type}
          data-slot="input"
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs transition outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
            className
          )}
          {...props}
        />
      </BrowserContextMenu>
    )
  }
)

Input.displayName = "Input"

export { Input }
