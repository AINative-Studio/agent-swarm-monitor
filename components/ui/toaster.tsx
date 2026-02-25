"use client"

import * as React from "react"
import { Toast, addToastListener } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  React.useEffect(() => {
    // Subscribe to toast events
    const unsubscribe = addToastListener((toast) => {
      setToasts((prev) => [...prev, toast])

      // Auto-remove after 3 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, 3000)
    })

    return unsubscribe
  }, [])

  return (
    <div className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
            "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
            "animate-in slide-in-from-top-full sm:slide-in-from-bottom-full",
            toast.variant === "destructive"
              ? "destructive group border-red-500 bg-red-600 text-white"
              : "border-gray-200 bg-white text-gray-900",
            "mb-2"
          )}
        >
          <div className="grid gap-1">
            {toast.title && (
              <div className={cn(
                "text-sm font-semibold",
                toast.variant === "destructive" ? "text-white" : "text-gray-900"
              )}>
                {toast.title}
              </div>
            )}
            {toast.description && (
              <div className={cn(
                "text-sm opacity-90",
                toast.variant === "destructive" ? "text-white" : "text-gray-700"
              )}>
                {toast.description}
              </div>
            )}
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className={cn(
              "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
              toast.variant === "destructive"
                ? "text-red-100 hover:text-white focus:ring-red-400"
                : "text-gray-500 hover:text-gray-900 focus:ring-gray-400"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
