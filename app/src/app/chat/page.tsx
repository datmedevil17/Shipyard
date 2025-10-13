'use client'
import React, { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useSocket } from '@/lib/socket'
import Sidebar from '../../components/Sidebar'
import ChatArea from '../../components/ChatArea'

interface Channel {
  id: string
  name: string
  type: 'text'
  createdAt?: Date
}

const Page = () => {
  const { publicKey, connected, connecting } = useWallet()
  const [activeChannel, setActiveChannel] = useState<string>('general')
  const [isClient, setIsClient] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([
    { id: 'general', name: 'general', type: 'text', createdAt: new Date() },
    { id: 'random', name: 'random', type: 'text', createdAt: new Date() },
    { id: 'dev-talk', name: 'dev-talk', type: 'text', createdAt: new Date() }
  ])

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load channels from localStorage
  useEffect(() => {
    if (isClient) {
      const savedChannels = localStorage.getItem('channels')
      if (savedChannels) {
        try {
          const parsedChannels = JSON.parse(savedChannels).map((ch: Channel) => ({
            ...ch,
            createdAt: ch.createdAt ? new Date(ch.createdAt) : undefined
          }))
          setChannels(parsedChannels)
        } catch (error) {
          console.error('Failed to parse channels from localStorage:', error)
        }
      }
    }
  }, [isClient])

  // Save channels to localStorage whenever they change
  useEffect(() => {
    if (isClient && channels.length > 0) {
      localStorage.setItem('channels', JSON.stringify(channels))
    }
  }, [channels, isClient])

  const handleCreateChannel = (channelName: string) => {
    const channelId = channelName.toLowerCase().replace(/\s+/g, '-')
    
    // Check if channel already exists
    if (channels.some(ch => ch.id === channelId)) {
      alert('Channel already exists!')
      return
    }

    const newChannel: Channel = {
      id: channelId,
      name: channelName,
      type: 'text',
      createdAt: new Date()
    }
    
    const updatedChannels = [...channels, newChannel]
    setChannels(updatedChannels)
    setActiveChannel(channelId)
    console.log('Channel created:', newChannel)
  }

  const handleDeleteChannel = (channelId: string) => {
    // Don't allow deleting default channels
    if (['general', 'random', 'dev-talk'].includes(channelId)) {
      alert('Cannot delete default channels!')
      return
    }

    const updatedChannels = channels.filter(ch => ch.id !== channelId)
    setChannels(updatedChannels)
    
    // If the deleted channel was active, switch to general
    if (activeChannel === channelId) {
      setActiveChannel('general')
    }
    
    console.log('Channel deleted:', channelId)
  }

  // Show loading until client is ready
  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Loading...</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    )
  }

  // Show connection screen if wallet not connected
  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Cypher Chat</h1>
          <p className="text-gray-400 mb-8">Connect your Solana wallet to start chatting</p>
          <WalletMultiButton />
          {connecting && <p className="text-blue-400 mt-4">Connecting...</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Header with Wallet Info */}
      <div className="fixed top-0 right-0 z-50 p-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <p>Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</p>
          </div>
          <WalletMultiButton />
        </div>
      </div>

      {/* Main Chat Area */}
      <Sidebar
        channels={channels}
        activeChannel={activeChannel}
        onChannelSelect={setActiveChannel}
        onCreateChannel={handleCreateChannel}
        onDeleteChannel={handleDeleteChannel}
        userPubKey={publicKey?.toString() || ''}
      />
      <ChatArea
        activeChannel={activeChannel}
        channelName={channels.find(c => c.id === activeChannel)?.name || 'general'}
        userPubKey={publicKey?.toString() || ''}
      />
    </div>
  )
}

export default Page