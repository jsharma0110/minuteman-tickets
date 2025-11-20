// app/chat/[id]/ChatWindow.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { useChat } from '@/hooks/useChat'; // Imports the hook you just created

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
}

export default function ChatWindow({ conversationId, currentUserId }: ChatWindowProps) {
  // Use the custom hook to handle logic
  const { messages, loading, sendMessage } = useChat(conversationId, currentUserId);
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom whenever a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await sendMessage(newMessage);
    setNewMessage(''); // Clear input after sending
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading conversation...</div>;
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-xl bg-white shadow-sm overflow-hidden">
      
      {/* 1. Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-10">No messages yet. Say hello!</div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                }`}
              >
                <p>{msg.content}</p>
                <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* 2. Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}