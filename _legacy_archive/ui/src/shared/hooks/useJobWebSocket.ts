/**
 * useJobWebSocket — Real-time job progress hook
 *
 * Connects to the Gateway WebSocket for job progress updates.
 * Uses JWT from auth store as query parameter (standard pattern for WS auth).
 * Automatically reconnects on disconnect.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@features/auth/store/authStore';

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export type JobEvent = {
  event_type: string;
  job_id: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

interface UseJobWebSocketOptions {
  jobId: string | null;
  onEvent: (event: JobEvent) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useJobWebSocket({
  jobId,
  onEvent,
  onConnected,
  onDisconnected,
}: UseJobWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const token = useAuthStore((s) => s.token);

  const connect = useCallback(() => {
    if (!jobId || !token) return;

    const url = `${WS_BASE}/ws/jobs/${jobId}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectAttempts.current = 0;
      onConnected?.();
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as JobEvent;
        onEvent(parsed);
      } catch {
        console.warn('Failed to parse WebSocket message:', event.data);
      }
    };

    ws.onclose = () => {
      onDisconnected?.();
      wsRef.current = null;

      // Reconnect with backoff
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts.current += 1;
        const delay = RECONNECT_DELAY_MS * reconnectAttempts.current;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      ws.close();
    };

    wsRef.current = ws;
  }, [jobId, token, onEvent, onConnected, onDisconnected]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);
}
