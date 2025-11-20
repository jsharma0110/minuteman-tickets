// hooks/useChat.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client'; // We will ensure this file exists in Step 4

// Define the shape of a Message for TypeScript
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const useChat = (conversationId: string, currentUserId: string) => {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    // 1. Load initial messages from the database
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) console.error('Error loading messages:', error);
      else setMessages(data || []);
      
      setLoading(false);
    };

    fetchMessages();

    // 2. Set up the Realtime Listener
    // This listens for ANY new 'INSERT' into the 'messages' table
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // When a new message arrives, add it to the state immediately
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Cleanup: Unsubscribe when the user leaves the page
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  // 3. Function to send a message
  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Optimistically update UI could happen here, but we'll rely on Realtime for now
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: content,
    });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  return { messages, loading, sendMessage };
};