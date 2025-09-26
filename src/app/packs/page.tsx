
'use client';

import PackagesSection from "@/components/home/PackagesSection";
import AiAssistantSection from "@/components/home/AiAssistantSection";
import { useChat } from "@/context/ChatContext";

export default function PacksPage() {
  const { openChat } = useChat();
  
  return (
    <div className="bg-background">
      {/* PackagesSection now provides the main title and content */}
      <PackagesSection />
      
      {/* The AI Assistant section is added below to help undecided users */}
      <AiAssistantSection onOpenChatModal={openChat} />
    </div>
  );
}
