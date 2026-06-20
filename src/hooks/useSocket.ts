'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/socket'

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let _socket: TypedSocket | null = null

function getSocket(): TypedSocket {
  if (!_socket) {
    _socket = io({ path: '/api/socket', autoConnect: false }) as TypedSocket
  }
  return _socket
}

export function useSocket() {
  const socketRef = useRef<TypedSocket>(getSocket())

  useEffect(() => {
    const socket = socketRef.current
    if (!socket.connected) socket.connect()
    return () => {
      // Keep socket alive across route changes — only disconnect on full unmount of root
    }
  }, [])

  const emit = useCallback(<Ev extends keyof ClientToServerEvents>(
    event: Ev,
    ...args: Parameters<ClientToServerEvents[Ev]>
  ) => {
    socketRef.current.emit(event, ...args)
  }, [])

  const on = useCallback(<Ev extends keyof ServerToClientEvents>(
    event: Ev,
    handler: ServerToClientEvents[Ev],
  ): (() => void) => {
    const s = socketRef.current
    s.on(event as any, handler as any)
    return () => { s.off(event as any, handler as any) }
  }, [])

  return { socket: socketRef.current, emit, on }
}
