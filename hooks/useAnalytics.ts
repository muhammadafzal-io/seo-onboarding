// hooks/useAnalytics.ts
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  AnalyticsDashboard, 
  ClientWithGa, 
  DashboardState, 
  DATE_RANGES, 
  DateRangeKey, 
  RealtimeData 
} from '../types/analytics'

const REALTIME_INTERVAL_MS = 30_000   // poll realtime every 30s
const CLIENTS_CACHE_TTL_MS = 60_000   // re-fetch clients list every 60s

export function useAnalytics() {
  const [state, setState] = useState<DashboardState>({
    selectedClientId: null,
    dateRangeKey:     '28d',
    isLoading:         false,
    error:             null,
    data:              null,
    realtimeData:      null,
    clients:           [],
  })

  const realtimeTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const clientsCachedAt = useRef<number>(0)

  // 1. Load clients list
  const loadClients = useCallback(async (force = false) => {
    if (!force && Date.now() - clientsCachedAt.current < CLIENTS_CACHE_TTL_MS) return

    try {
      const res = await fetch('/api/analytics/clients')
      if (!res.ok) throw new Error('Failed to load clients')
      const clients: ClientWithGa[] = await res.json()
      clientsCachedAt.current = Date.now()

      setState(prev => {
        const firstWithGa = clients.find(c => c.ga_property?.is_active)
        const selectedClientId = prev.selectedClientId ?? firstWithGa?.id ?? null
        return { ...prev, clients, selectedClientId }
      })
    } catch (e: any) {
      console.error('[useAnalytics] loadClients error:', e.message)
    }
  }, [])

  // 2. Fetch Dashboard Data (Historical)
  const fetchData = useCallback(async (
    clientId: number,
    rangeKey: DateRangeKey,
    forceRefresh = false
  ) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const bust = forceRefresh ? '&bust=1' : ''
      const res = await fetch(`/api/analytics/clients?clientId=${clientId}&range=${rangeKey}${bust}`)
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid format (Not JSON). Please delete the old [clientId] folder.");
      }

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`)
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        data: json as AnalyticsDashboard,
        error: null,
      }))
    } catch (e: any) {
      console.error("[fetchData] Error:", e.message);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: e.message,
        data: null,
      }))
    }
  }, [])

  // 3. Fetch Real-time Data (Live)
// 3. Fetch Real-time Data (Live)
  const fetchRealtime = useCallback(async (clientId: number) => {
    try {
      const res = await fetch(`/api/analytics/realtime?clientId=${clientId}`)
      if (!res.ok) return
      
      const json = await res.json()
      
      setState(prev => ({ 
        ...prev, 
        realtimeData: {
          activeUsers: json.activeUsers || 0,
          fetchedAt: json.fetchedAt || new Date().toISOString(),
          // Missing properties ko yahan initialize karein taake TS error khatam ho jaye
          topPages: [], 
          topCountries: json.details?.map((row: any) => ({
            country: row.dimensionValues?.[0]?.value || 'Unknown',
            count: parseInt(row.metricValues?.[0]?.value || '0')
          })) || []
        } as RealtimeData
      }))
    } catch (e) {
      console.warn("Realtime fetch failed (non-fatal)", e)
    }
  }, [])

  // ── Handlers ──
  const selectClient = useCallback((clientId: number) => {
    setState(prev => ({
      ...prev,
      selectedClientId: clientId,
      data: null, 
      realtimeData: null,
      error: null,
    }))
  }, [])

  const setDateRange = useCallback((key: DateRangeKey) => {
    setState(prev => ({ ...prev, dateRangeKey: key, data: null }))
  }, [])

  const refresh = useCallback(() => {
    if (state.selectedClientId) {
      fetchData(state.selectedClientId, state.dateRangeKey, true)
    }
  }, [state.selectedClientId, state.dateRangeKey, fetchData])

  // ── Effects ──
  useEffect(() => {
    loadClients(true)
  }, [loadClients])

  useEffect(() => {
    if (!state.selectedClientId) return
    fetchData(state.selectedClientId, state.dateRangeKey)
  }, [state.selectedClientId, state.dateRangeKey, fetchData])

  useEffect(() => {
    if (realtimeTimer.current) clearInterval(realtimeTimer.current)
    if (!state.selectedClientId) return

    fetchRealtime(state.selectedClientId)
    realtimeTimer.current = setInterval(
      () => state.selectedClientId && fetchRealtime(state.selectedClientId),
      REALTIME_INTERVAL_MS
    )

    return () => {
      if (realtimeTimer.current) clearInterval(realtimeTimer.current)
    }
  }, [state.selectedClientId, fetchRealtime])

  // ── Helpers ──
  const selectedClient = state.clients.find(c => c.id === state.selectedClientId) || null
  const dateRange      = DATE_RANGES.find(d => d.key === state.dateRangeKey) || DATE_RANGES[1]
  const clientsWithGa  = state.clients.filter(c => c.ga_property?.is_active)

  return {
    ...state,
    selectedClient,
    dateRange,
    clientsWithGa,
    selectClient,
    setDateRange,
    refresh,
    loadClients,
  }
}