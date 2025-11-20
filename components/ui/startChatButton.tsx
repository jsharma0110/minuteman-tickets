// components/StartChatButton.tsx
'use client';

import { useRouter } from 'next/navigation';

type StartChatButtonProps = {
  ticketId: string;
  sellerId: string;
  eventName?: string;
};

export default function StartChatButton({ ticketId, sellerId, eventName }: StartChatButtonProps) {
  const router = useRouter();

  const startChat = () => {
    // For mock data phase: just create a unique chat ID and navigate
    // Later in Phase 2: this will check/create actual conversation in database
    const mockChatId = `${ticketId}-${sellerId}`;
    router.push(`/chat/${mockChatId}`);
  };

  return (
    <button
      onClick={startChat}
      className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      Message Seller
    </button>
  );
}