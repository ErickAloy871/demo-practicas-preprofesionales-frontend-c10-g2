import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[104px] w-full resize-y rounded-lg border border-line bg-surface px-[13px] py-3 text-14 leading-relaxed text-ink shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all placeholder:text-inkMute hover:border-stamp/40 focus-visible:border-stamp focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stamp/20 disabled:cursor-not-allowed disabled:bg-soft disabled:text-inkSoft aria-[invalid=true]:border-void",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
