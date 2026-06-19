import BrowserContextMenu from "@/components/BrowserContextMenu"
import Navbar from "@/components/Navbar"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import A from "@/components/A"

export default function NotFoundPage() {
  return (
    <BrowserContextMenu triggerClassName="block min-h-screen w-full">
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <Empty className="flex h-screen flex-col items-center justify-center align-middle">
          <EmptyHeader>
            <EmptyTitle className="text-9xl font-black">404</EmptyTitle>
            <EmptyDescription>
              <p className="mb-2">Page Not Found</p>
              The page you&apos;re looking for doesn&apos;t exist.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              asChild
              className="rounded-full px-4"
              title="View repositories"
            >
              <A href="/">Go home</A>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </BrowserContextMenu>
  )
}
