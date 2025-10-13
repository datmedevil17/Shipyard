'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  pubKey: string | null
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  pubKey: null
})

export const useSocket = () => {
  return useContext(SocketContext)
}

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { publicKey, connected } = useWallet()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [pubKey, setPubKey] = useState<string | null>(null)

  useEffect(() => {
    if (!connected || !publicKey) {
      console.log('Wallet not connected, skipping socket initialization')
      return
    }

    const walletPubKey = publicKey.toString()
    console.log('Initializing socket with pubKey:', walletPubKey)
    setPubKey(walletPubKey)

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: {
        pubKey: walletPubKey
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    socketInstance.on('connect', () => {
      console.log('Socket connected with pubKey:', walletPubKey)
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.close()
    }
  }, [connected, publicKey])

  return (
    <SocketContext.Provider value={{ socket, isConnected, pubKey }}>
      {children}
    </SocketContext.Provider>
  )
}