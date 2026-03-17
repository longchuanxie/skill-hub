import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border-2 border-gray-200 bg-transparent px-3 py-2 text-base text-black transition-all duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 hover:border-gray-300 focus:border-black focus:ring-2 focus:ring-black focus:ring-opacity-10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-500 aria-invalid:ring-opacity-10 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
