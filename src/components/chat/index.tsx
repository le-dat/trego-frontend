"use client";

import AuthContent from "@/components/wallet/AuthContent";
import { cn } from "@/lib/utils";
import { chatService } from "@/service/chatService";
import { useWalletStore } from "@/store/useWalletStore";
import type { IMessage } from "@/types/chat";
import { ACTION_TYPE } from "@/types/chat";
import { useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useState } from "react";
import { NoWallet } from "../wallet/NoWallet";
import ChatInput from "./ChatInput";
import ChatContainer from "./message/ChatContainer";

interface ChatPanelProps {
  className?: string;
  selectedConversationId?: string;
}

export function ChatPanel({ className, selectedConversationId }: ChatPanelProps) {
  const { user, isLoaded } = useUser();
  const { account } = useWalletStore();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isLoading] = useState(false);
  const [hasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);

  useEffect(() => {
    if (!user || !account) return;
    if (selectedConversationId) {
      setConversationId(selectedConversationId);
      loadConversationMessages(selectedConversationId);
    } else if (!conversationId) {
      initializeConversation();
    }
  }, [selectedConversationId, conversationId, user]);

  async function loadConversationMessages(_convId: string) {
    // try {
    //   setIsLoading(true);
    //   const response = await chatService.getMessages(convId, 1, 50);
    //   if (response.success) {
    //     setMessages(response.data.messages);
    //     setHasMore(response.data.hasMore);
    //   }
    // } catch (error) {
    //   console.error("Failed to load conversation messages:", error);
    //   setError("Failed to load conversation");
    // } finally {
    //   setIsLoading(false);
    // }
  }

  async function initializeConversation() {
    // try {
    //   const response = await chatService.createConversation();
    //   if (response.success) {
    //     setConversationId(response.data.conversationId);
    //   }
    // } catch (error) {
    //   console.error("Failed to create conversation:", error);
    //   setError("Failed to initialize chat");
    // }
  }

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || isLoading) return;
    // setIsLoading(true);
    // try {
    //   const response = await chatService.getMessages(conversationId, 1, 20);
    //   if (response.success) {
    //     setMessages((prev) => [...response.data.messages, ...prev]);
    //     setHasMore(response.data.hasMore);
    //   }
    // } catch (error) {
    //   console.error("Failed to load messages:", error);
    //   setError("Failed to load messages");
    // } finally {
    //   setIsLoading(false);
    // }
  }, [conversationId, isLoading]);

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isWaitingForResponse || !conversationId) return;

      setIsWaitingForResponse(true);
      setError(null);

      const userMessage: IMessage = {
        id: `user-${Date.now()}`,
        content: message.trim(),
        type: ACTION_TYPE.USER,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        const {
          message: botReply,
          data,
          intent,
        } = await chatService.sendMessage({
          user_address: account?.address ?? "0x1",
          content: message.trim(),
        });

        if (botReply) {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              content: botReply,
              type: intent?.actionType as ACTION_TYPE,
              timestamp: new Date().toISOString(),
              data,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        setError("Failed to send message. Please try again.");
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
      } finally {
        setIsWaitingForResponse(false);
      }
    },
    [conversationId, isWaitingForResponse, account?.address],
  );

  // Auth not loaded yet
  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex flex-col h-full items-center justify-center bg-gradient-to-br from-slate-900/50 to-slate-950/50",
          className,
        )}
      >
        <span className="text-slate-400 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/30">Ai agent</div>

      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <span>⚠️</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-400">
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {!user ? (
          <div className="flex h-full w-full items-center justify-center">
            <AuthContent />
          </div>
        ) : !account ? (
          <div className="flex h-full w-full items-center justify-center">
            <NoWallet />
          </div>
        ) : !conversationId ? (
          <div className="flex flex-col items-center justify-center h-full px-4 pb-2">
            <p className="text-xs text-slate-400 text-center">Setting up chat...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Start your DeFi AI chat</h3>
            <p className="text-slate-400 max-w-md">
              Ask about swap, staking, unstaking, on-chain analytics, or get AI-powered insights for your crypto
              portfolio.
            </p>
            {!conversationId && <p className="text-sm text-slate-400 mt-2">Connecting to your DeFi AI assistant...</p>}
          </div>
        ) : (
          <ChatContainer
            messages={messages}
            onLoadMore={loadMoreMessages}
            hasMore={hasMore}
            isLoading={isLoading}
            isWaitingForResponse={isWaitingForResponse}
          />
        )}
      </div>

      <div className="border-t border-slate-700/50">
        <ChatInput
          onSend={handleSendMessage}
          value={inputValue}
          setValue={setInputValue}
          isLoading={isWaitingForResponse}
          disabled={isWaitingForResponse || !conversationId || !account}
        />
      </div>
    </div>
  );
}

export default ChatPanel;
