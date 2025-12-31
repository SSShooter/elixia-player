"use client"

import { QueryClient } from "@tanstack/react-query"
import { PersistQueryClientProvider, type Persister } from "@tanstack/react-query-persist-client"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import { useState } from "react"

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 60 * 24, // 24 hours
            gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      })
  )

  const [persister] = useState<Persister>(() => {
    return createAsyncStoragePersister({
      storage: {
        getItem: async (key) => {
          if (typeof window === "undefined") return null
          return window.localStorage.getItem(key)
        },
        setItem: async (key, value) => {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, value)
          }
        },
        removeItem: async (key) => {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem(key)
          }
        },
      },
    })
  })

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
