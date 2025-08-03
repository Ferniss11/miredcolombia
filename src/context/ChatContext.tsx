'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ChatContextType = {
  isChatOpen: boolean;
  setChatOpen: (isOpen: boolean) => void;
  openChat: () => void;
  chatContext: {
    businessId: string;
    businessName: string;
  } | null;
  setChatContext: (context: { businessId: string; businessName: string } | null) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isChatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<{ businessId: string; businessName: string } | null>(null);

  const openChat = () => setChatOpen(true);

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        setChatOpen,
        openChat,
        chatContext,
        setChatContext,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
