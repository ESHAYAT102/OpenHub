"use client"

import * as React from "react"
import { defineSound, ensureReady, setMasterVolume } from "@web-kits/audio"
import {
  checkbox as checkboxSound,
  click as clickSound,
  collapse as collapseSound,
  copy as copySound,
  deselect as deselectSound,
  expand as expandSound,
  error as errorSound,
  hover as hoverSound,
  info as infoSound,
  keyPress as keyPressSound,
  notification as notificationSound,
  pageEnter as pageEnterSound,
  pageExit as pageExitSound,
  pop as popSound,
  select as selectSound,
  send as sendSound,
  slide as slideSound,
  success as successSound,
  swoosh as swooshSound,
  tabSwitch as tabSwitchSound,
  tap as tapSound,
  toggleOff as toggleOffSound,
  toggleOn as toggleOnSound,
  undo as undoSound,
  warning as warningSound,
  _delete as deleteSound,
} from "@/.web-kits/minimal"

const sounds = {
  checkbox: defineSound(checkboxSound),
  click: defineSound(clickSound),
  collapse: defineSound(collapseSound),
  copy: defineSound(copySound),
  delete: defineSound(deleteSound),
  deselect: defineSound(deselectSound),
  destructive: defineSound(deleteSound),
  error: defineSound(errorSound),
  focus: defineSound(hoverSound),
  hover: defineSound(hoverSound),
  info: defineSound(infoSound),
  keyPress: defineSound(keyPressSound),
  notification: defineSound(notificationSound),
  open: defineSound(expandSound),
  pageEnter: defineSound(pageEnterSound),
  pageExit: defineSound(pageExitSound),
  pop: defineSound(popSound),
  softClick: defineSound(tapSound),
  toggle: defineSound(toggleOnSound),
  toggleOff: defineSound(toggleOffSound),
  select: defineSound(selectSound),
  send: defineSound(sendSound),
  slide: defineSound(slideSound),
  success: defineSound(successSound),
  swoosh: defineSound(swooshSound),
  tabSwitch: defineSound(tabSwitchSound),
  undo: defineSound(undoSound),
  warning: defineSound(warningSound),
}

export type UiSoundName = keyof typeof sounds

export const UI_SOUNDS_DISABLED_KEY = "xenon:ui-sounds-disabled"
export const UI_SOUNDS_CHANGED_EVENT = "xenon:ui-sounds-changed"
export const UI_SOUND_PLAY_EVENT = "xenon:ui-sound-play"

export function areUiSoundsDisabled() {
  if (typeof window === "undefined") return false

  try {
    return window.localStorage.getItem(UI_SOUNDS_DISABLED_KEY) === "true"
  } catch {
    return false
  }
}

export function setUiSoundsDisabled(disabled: boolean) {
  try {
    window.localStorage.setItem(
      UI_SOUNDS_DISABLED_KEY,
      disabled ? "true" : "false"
    )
  } catch {}

  window.dispatchEvent(
    new CustomEvent(UI_SOUNDS_CHANGED_EVENT, { detail: { disabled } })
  )
}

export function playUiSound(name: UiSoundName) {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent(UI_SOUND_PLAY_EVENT, { detail: { name } })
  )
}

const interactiveSelector = [
  "button",
  "a[href]",
  "input[type='button']",
  "input[type='checkbox']",
  "input[type='radio']",
  "input[type='reset']",
  "input[type='submit']",
  "[data-slot='button']",
  "[data-slot='dialog-close']",
  "[data-slot='context-menu-item']",
  "[data-slot='dropdown-menu-item']",
  "[data-slot='dropdown-menu-trigger']",
  "[data-slot='pagination-link']",
  "[data-slot='select-item']",
  "[data-slot='select-trigger']",
  "[data-slot='toggle']",
  "[role='tab']",
  "[role='button']",
  "[role='menuitem']",
  "[role='option']",
  "[cmdk-item]",
].join(",")

const contextMenuSelector = "[data-slot='context-menu-trigger']"

const focusSelector = [
  "input:not([type='button']):not([type='checkbox']):not([type='radio']):not([type='reset']):not([type='submit'])",
  "textarea",
  "[contenteditable='true']",
  "[role='textbox']",
].join(",")

function isDisabled(element: Element) {
  return (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true" ||
    element.closest("[data-ui-sound='off']") !== null
  )
}

function elementText(element: Element) {
  return [
    element.getAttribute("aria-label"),
    element.getAttribute("title"),
    element.textContent,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

function textSound(text: string): UiSoundName | null {
  if (/\b(copy|duplicate|clone)\b/.test(text)) return "copy"
  if (/\b(delete|remove|clear|trash|discard)\b/.test(text)) return "delete"
  if (/\b(error|failed|failure|invalid)\b/.test(text)) return "error"
  if (/\b(warn|warning|caution)\b/.test(text)) return "warning"
  if (/\b(success|done|complete|completed|confirm|confirmed)\b/.test(text)) {
    return "success"
  }
  if (/\b(save|create|new|add|update|apply|submit|merge|commit)\b/.test(text)) {
    return "success"
  }
  if (/\b(send|share|upload|publish|push)\b/.test(text)) return "send"
  if (/\b(download|export)\b/.test(text)) return "slide"
  if (/\b(undo|revert|reset|restore)\b/.test(text)) return "undo"
  if (/\b(close|collapse|hide|dismiss|cancel)\b/.test(text)) return "collapse"
  if (/\b(open|expand|show|more|menu|details|browse)\b/.test(text)) return "open"
  if (/\b(notifications?|inbox|alerts?)\b/.test(text)) return "notification"
  if (/\b(info|help|about|docs|documentation)\b/.test(text)) return "info"

  return null
}

function soundForElement(element: Element): UiSoundName {
  const explicit = element.getAttribute("data-ui-sound")
  const text = elementText(element)

  if (explicit && explicit in sounds) {
    return explicit as UiSoundName
  }

  const semanticSound = textSound(text)
  if (semanticSound) {
    return semanticSound
  }

  if (
    element.getAttribute("data-variant") === "destructive" ||
    element.getAttribute("data-slot")?.includes("destructive")
  ) {
    return "delete"
  }

  if (element.getAttribute("role") === "tab") {
    return "tabSwitch"
  }

  if (element.getAttribute("aria-expanded") === "true") {
    return "collapse"
  }

  if (element.getAttribute("aria-expanded") === "false") {
    return "open"
  }

  if (
    element.matches("input[type='checkbox'], input[type='radio']") ||
    element.getAttribute("role") === "checkbox"
  ) {
    return element.getAttribute("aria-checked") === "true" ? "deselect" : "checkbox"
  }

  if (
    element.getAttribute("data-slot") === "toggle" ||
    element.getAttribute("role") === "switch" ||
    element.hasAttribute("aria-pressed")
  ) {
    return element.getAttribute("aria-pressed") === "true" ||
      element.getAttribute("aria-checked") === "true"
      ? "toggleOff"
      : "toggle"
  }

  if (
    element.getAttribute("data-slot") === "select-trigger" ||
    element.getAttribute("aria-haspopup") === "menu" ||
    element.getAttribute("aria-haspopup") === "dialog" ||
    element.getAttribute("aria-haspopup") === "listbox"
  ) {
    return "open"
  }

  if (element.matches("a[href]")) {
    return "swoosh"
  }

  if (
    element.getAttribute("data-slot")?.includes("item") ||
    element.getAttribute("role") === "option" ||
    element.hasAttribute("cmdk-item")
  ) {
    return "select"
  }

  return "click"
}

export function UiSoundEffects() {
  const masterReady = React.useRef(false)
  const lastFocusTarget = React.useRef<EventTarget | null>(null)
  const lastHoverTarget = React.useRef<Element | null>(null)
  const lastHoverAt = React.useRef(0)

  const play = React.useCallback((name: UiSoundName) => {
    if (typeof navigator !== "undefined" && /Firefox|Zen/i.test(navigator.userAgent)) {
      return
    }

    if (areUiSoundsDisabled()) return

    void ensureReady()
      .then(() => {
        if (areUiSoundsDisabled()) return

        if (!masterReady.current) {
          setMasterVolume(0.42)
          masterReady.current = true
        }

        sounds[name]()
      })
      .catch(() => {
        // Browsers can still refuse audio until a trusted user gesture.
      })
  }, [])

  React.useEffect(() => {
    if (typeof navigator !== "undefined" && /Firefox|Zen/i.test(navigator.userAgent)) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null

      if (event.button === 2) {
        const contextMenuElement = target?.closest(contextMenuSelector)
        if (contextMenuElement && !isDisabled(contextMenuElement)) {
          play("pop")
        }
        return
      }

      if (event.button !== 0) return

      const element = target?.closest(interactiveSelector)
      if (!element || isDisabled(element)) return

      play(soundForElement(element))
    }

    const handleFocusIn = (event: FocusEvent) => {
      if (event.target === lastFocusTarget.current) return
      lastFocusTarget.current = event.target

      const element = (event.target as Element | null)?.closest(focusSelector)
      if (!element || isDisabled(element)) return

      play("focus")
    }

    const handlePointerOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return

      const element = (event.target as Element | null)?.closest(
        interactiveSelector
      )

      if (!element || isDisabled(element)) return
      if (element === lastHoverTarget.current) return

      const now = performance.now()
      if (now - lastHoverAt.current < 45) return

      lastHoverTarget.current = element
      lastHoverAt.current = now
      play("hover")
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return

      const element = event.target as Element | null
      if (element?.closest("[data-ui-sound='off']")) return

      play("keyPress")

      if (event.key === "Escape") {
        play("collapse")
        return
      }

      if (event.key === "Enter") {
        play("select")
        return
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        play("delete")
        return
      }

      if (event.key === "Tab") {
        play("tabSwitch")
        return
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "z"
      ) {
        play("undo")
        return
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "c"
      ) {
        play("copy")
        return
      }

    }

    const handlePlayEvent = (event: Event) => {
      const name = (event as CustomEvent).detail.name
      if (name in sounds) {
        play(name)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("pointerover", handlePointerOver, true)
    document.addEventListener("focusin", handleFocusIn, true)
    document.addEventListener("keydown", handleKeyDown, true)
    window.addEventListener(UI_SOUND_PLAY_EVENT, handlePlayEvent)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("pointerover", handlePointerOver, true)
      document.removeEventListener("focusin", handleFocusIn, true)
      document.removeEventListener("keydown", handleKeyDown, true)
      window.removeEventListener(UI_SOUND_PLAY_EVENT, handlePlayEvent)
    }
  }, [play])

  return null
}
