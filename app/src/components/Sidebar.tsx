import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useSocket } from '@/lib/socket'


type Channel = {
  id: string
  name: string
  type?: string
}

type SidebarProps = {
  channels: Channel[]
  activeChannel: string
  onChannelSelect: (channelId: string) => void
  onCreateChannel: (channelName: string) => void
  onDeleteChannel: (channelId: string) => void
  userPubKey: string
}

const Sidebar = ({
  channels,
  activeChannel,
  onChannelSelect,
  onCreateChannel,
  onDeleteChannel,
  userPubKey
}: SidebarProps) => {
  const { socket } = useSocket()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null)

  // Listen for new channels created by others
  useEffect(() => {
    if (!socket) return
    socket.on('channel-created', (newChannel) => {
      onCreateChannel(newChannel.name)
    })
    return () => {
      socket.off('channel-created')
    }
  }, [socket])

  // Handle joining channels
  const handleChannelSelect = (channelId: string) => {
    if (socket) {
      socket.emit('leave-channel', activeChannel)
      socket.emit('join-channel', channelId)
    }
    onChannelSelect(channelId)
  }

  const handleCreateChannel = () => {
    if (newChannelName.trim()) {
      const channelId = newChannelName.toLowerCase().replace(/\s+/g, '-')
      if (socket) {
        socket.emit('create-channel', {
          id: channelId,
          name: newChannelName,
          type: 'text'
        })
      }
      setNewChannelName('')
      setShowCreateModal(false)
    }
  }

  const isDefaultChannel = (channelId: string) => {
    return ['general', 'random', 'dev-talk'].includes(channelId)
  }

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Channels</h1>
        <p className="text-xs text-gray-400 mt-2 truncate">{userPubKey}</p>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto">
        {channels.length === 0 ? (
          <div className="p-4 text-center text-gray-400 text-sm">
            <p>No channels yet</p>
          </div>
        ) : (
          channels.map((channel) => (
            <div
              key={channel.id}
              onMouseEnter={() => setHoveredChannel(channel.id)}
              onMouseLeave={() => setHoveredChannel(null)}
              className="relative"
            >
              <button
                onClick={() => handleChannelSelect(channel.id)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition flex items-center justify-between ${
                  activeChannel === channel.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300'
                }`}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <span className="mr-2">#</span>
                  <div className="min-w-0">
                    <p className="truncate">{channel.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      ID: {channel.id}
                    </p>
                  </div>
                </div>
              </button>

              {/* Delete Button */}
              {hoveredChannel === channel.id && !isDefaultChannel(channel.id) && (
                <button
                  onClick={() => {
                    if (confirm(`Delete channel "${channel.name}"?`)) {
                      onDeleteChannel(channel.id)
                    }
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-600 transition"
                  title="Delete channel"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Channel Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
        >
          + Create Channel
        </button>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-lg font-bold text-white mb-4">Create New Channel</h2>
            <p className="text-xs text-gray-400 mb-3">
              Channel ID will be auto-generated from the name
            </p>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Channel name (e.g., announcements)"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateChannel()}
              autoFocus
            />
            <p className="text-xs text-gray-500 mb-4">
              ID: {newChannelName.toLowerCase().replace(/\s+/g, '-') || 'channel-name'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewChannelName('')
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar