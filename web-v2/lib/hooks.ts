import useSWR from 'swr'
import { healthApi, memoriesApi, dreamsApi, statsApi } from './api'

// Health hooks
export function useHealth() {
  return useSWR('health', healthApi.get, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
    fallbackData: undefined, // Will use mock from API client
  })
}

export function useHealthHistory(days = 7) {
  return useSWR(['health-history', days], () => healthApi.getHistory(days))
}

// Memories hooks
export function useMemories(params?: { type?: string; limit?: number; offset?: number }) {
  return useSWR(
    ['memories', JSON.stringify(params)],
    () => memoriesApi.list(params),
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  )
}

export function useMemory(id: string) {
  return useSWR(id ? ['memory', id] : null, () => memoriesApi.get(id))
}

// Dreams hooks
export function useDreams(limit = 10) {
  return useSWR(['dreams', limit], () => dreamsApi.list(limit), {
    refreshInterval: 60000,
  })
}

// Stats hooks
export function useStats() {
  return useSWR('stats', statsApi.get, {
    refreshInterval: 30000,
  })
}

// Action hooks
export async function triggerDream(mode = 'standard') {
  return dreamsApi.trigger(mode)
}
