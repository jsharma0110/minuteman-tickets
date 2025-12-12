"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { MessageRow } from "./page";

type ConversationClientProps = {
  conversationId: string;
  userId: string;
  initialMessages: MessageRow[];
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function ConversationClient({
  conversationId,
  userId,
  initialMessages,
}: ConversationClientProps) {
  const supabase = createClient();

  const [messages, setMessages] = useState<MessageRow[]>(initialMessages);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simple polling to keep chat up to date
  useEffect(() => {
    let isCancelled = false;

    const poll = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          content,
          created_at,
          sender_id,
          attachment_url,
          attachment_name,
          attachment_type,
          attachment_size
        `
        )
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!isCancelled) {
        if (error) {
          console.error("Messages poll error:", error);
        } else if (data) {
          setMessages(data as MessageRow[]);
        }
      }
    };

    poll();
    const id = setInterval(poll, 3000);
    return () => {
      isCancelled = true;
      clearInterval(id);
    };
  }, [conversationId, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      return;
    }

    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError("File is too large (max 5MB).");
      e.target.value = "";
      return;
    }

    setError(null);
    setFile(f);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !file) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      let attachment_url: string | null = null;
      let attachment_name: string | null = null;
      let attachment_type: string | null = null;
      let attachment_size: number | null = null;

      if (file) {
        const fileExt = file.name.split(".").pop() ?? "bin";
        const filePath = `${conversationId}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("conversation-uploads")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          setError("Failed to upload attachment.");
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("conversation-uploads")
          .getPublicUrl(filePath);

        attachment_url = publicUrl;
        attachment_name = file.name;
        attachment_type = file.type || "application/octet-stream";
        attachment_size = file.size;
      }

      const trimmed = content.trim();
      const finalContent = trimmed || (file ? "" : null);

      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: finalContent,
          attachment_url,
          attachment_name,
          attachment_type,
          attachment_size,
        })
        .select(
          `
          id,
          content,
          created_at,
          sender_id,
          attachment_url,
          attachment_name,
          attachment_type,
          attachment_size
        `
        )
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        setError(insertError.message ?? "Failed to send message.");
        return;
      }

      setMessages((prev) => [...prev, data as MessageRow]);
      setContent("");
      setFile(null);

      const fileInput = document.getElementById(
        "chat-file-input"
      ) as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
    } finally {
      setSending(false);
    }
  };

  const isImage = (msg: MessageRow) =>
    msg.attachment_type?.startsWith("image/") ?? false;

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.6)]">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto border-b border-zinc-800 pb-3 text-sm">
        {messages.length === 0 ? (
          <p className="text-[14px] text-zinc-500">
            No messages yet. Say hi to start the conversation.
          </p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs sm:text-sm ${
                    isMe
                      ? "bg-emerald-700 text-emerald-50"
                      : "bg-zinc-800 text-zinc-50"
                  }`}
                >
                  {msg.content && (
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  )}

                  {msg.attachment_url && (
                    <div className="mt-2 space-y-1">
                      {isImage(msg) && (
                        <img
                          src={msg.attachment_url}
                          alt={msg.attachment_name ?? "Attachment"}
                          className="max-h-64 rounded-lg border border-zinc-700 bg-black object-contain"
                        />
                      )}

                      <a
                        href={msg.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[14px] underline"
                      >
                        📎 {msg.attachment_name ?? "Download attachment"}
                      </a>
                    </div>
                  )}

                  <p className="mt-1 text-[13px] opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="pt-2 text-[11px] text-red-500">{error}</p>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-2">
          <textarea
            className="h-20 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            placeholder="Type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="flex items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-[14px] text-zinc-400">
              <span className="inline-flex h-7 items-center rounded-full border border-zinc-700 bg-zinc-900 px-3 text-[14px] hover:border-zinc-500 hover:bg-zinc-800">
                + Add file
              </span>
              <input
                id="chat-file-input"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              {file && (
                <span className="truncate text-[14px] text-zinc-300">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </span>
              )}
            </label>
          </div>
        </div>

        <div className="flex justify-end sm:ml-2">
          <Button
            type="submit"
            size="sm"
            className="h-9 px-4 text-14px"
            disabled={sending || (!content.trim() && !file)}
          >
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
