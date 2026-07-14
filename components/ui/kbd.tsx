import { cn } from "@/lib/utils"
import { Smooth } from "@/components/ui/smooth-corners"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <Smooth radius={8}>
      <kbd
        data-slot="kbd"
        className={cn(
          "pointer-events-none inline-flex h-5.5 w-fit min-w-5.5 items-center justify-center gap-1 rounded-lg bg-muted px-1.5 font-sans text-xs font-medium text-muted-foreground select-none in-data-[slot=input-group]:bg-input in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
          className
        )}
        {...props}
      />
    </Smooth>
  )
}

function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
