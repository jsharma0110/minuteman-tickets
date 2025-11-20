import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ChatWindow from './ChatWindow';

export default async function ChatPage({ params }: { params: { id: string } }) {
  // 1. FIX: Add 'await' here. createClient() returns a Promise.
  const supabase = await createClient();

  // 2. Now 'supabase' is the actual client, so .auth works
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // 3. Verify access to the conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', params.id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-gray-500">You do not have permission to view this conversation.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversation</h1>
        <p className="text-gray-500 text-sm">Chat ID: {conversation.id}</p>
      </div>
      
      <ChatWindow conversationId={conversation.id} currentUserId={user.id} />
    </div>
  );
}