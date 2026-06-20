'use client'

import { useState, useEffect, useRef } from 'react'
import { useSocket } from '@/hooks/useSocket'
import { sendMessage } from '@/app/actions/messages'

type Message = {
  id: string
  content: string
  createdAt: Date
  sender: { id: string; firstName: string; lastName: string; role: string }
}

export default function TripChat({
  tripId,
  currentUserId,
  receiverId,
  initialMessages,
}: {
  tripId: string
  currentUserId: string
  receiverId: string
  initialMessages: Message[]
}) {
  const { emit, on } = useSocket()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const QUICK_REPLIES = ["I'm on my way", 'Running 5 min late', "I've arrived", 'On my way to you']

  const sendQuick = (msg: string) => setText(msg)

  // Listen for real-time incoming messages
  useEffect(() => {
    const off = on('new-message', (data) => {
      if (data.senderId === currentUserId) return // already added optimistically
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          content: data.content,
          createdAt: new Date(data.timestamp),
          sender: { id: data.senderId, firstName: '...', lastName: '', role: '' },
        },
      ])
    })
    return off
  }, [on, currentUserId])

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)

    // Optimistic update
    const optimistic: Message = {
      id: crypto.randomUUID(),
      content: text.trim(),
      createdAt: new Date(),
      sender: { id: currentUserId, firstName: 'You', lastName: '', role: '' },
    }
    setMessages((prev) => [...prev, optimistic])
    setText('')

    // Emit via socket for real-time
    emit('send-message', {
      tripId,
      senderId: currentUserId,
      receiverId,
      content: optimistic.content,
    })

    // Persist to DB
    await sendMessage(tripId, optimistic.content, receiverId)
    setSending(false)
  }

  return (
    <div className="card flex flex-col h-96">
      <h3 className="font-semibold text-gray-900 pb-3 border-b mb-3">💬 Trip Chat</h3>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Say hi!</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender.id === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-3 py-2 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs font-medium mb-0.5 opacity-70">
                      {msg.sender.firstName}
                    </p>
                  )}
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-0.5 ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="flex gap-1.5 flex-wrap mt-2">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendQuick(q)}
            className="text-xs px-2 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-700 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 mt-2 pt-3 border-t">
        <input
          type="text"
          className="input flex-1 text-sm"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="btn-primary px-4 py-2 text-sm"
        >
          Send
        </button>
      </form>
    </div>
  )
}
