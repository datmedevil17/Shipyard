'use client'
import React, { useEffect, useState } from 'react'
import { useSocket } from '@/lib/socket'

interface ChatAreaProps {
  activeChannel: string
  channelName: string
  userPubKey: string
}

interface Message {
  pubKey: string
  text: string
  timestamp: string
}

const ChatArea = ({ activeChannel, channelName, userPubKey }: ChatAreaProps) => {
  const { socket } = useSocket()
  const [messages, setMessages] = useState<{ [key: string]: Message[] }>({})
  const [input, setInput] = useState('')

  // Join the active channel
  useEffect(() => {
    if (!socket) return
    socket.emit('join-channel', activeChannel)

    socket.on('channel-messages', (msgs) => {
      setMessages(prev => ({ ...prev, [activeChannel]: msgs }))
    })

    socket.on('receive-message', (message: Message) => {
      setMessages(prev => ({
        ...prev,
        [activeChannel]: [...(prev[activeChannel] || []), message]
      }))
    })

    return () => {
      socket.emit('leave-channel', activeChannel)
      socket.off('receive-message')
      socket.off('channel-messages')
    }
  }, [socket, activeChannel])

  const sendMessage = () => {
    if (!input.trim() || !socket) return
    socket.emit('send-message', {
      channelId: activeChannel,
      message: { text: input }
    })
    setInput('')
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">#{channelName}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {(messages[activeChannel] || []).map((msg, i) => (
          <div key={i} className="text-gray-300">
            <span className="font-semibold text-blue-400">{msg.pubKey.slice(0, 8)}:</span>{' '}
            {msg.text}
            <span className="text-xs text-gray-500 ml-2">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-700 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={`Message #${channelName}`}
          className="flex-1 bg-gray-800 text-white px-3 py-2 rounded focus:outline-none"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatArea
