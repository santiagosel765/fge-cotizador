'use client';

import { useState } from 'react';
import { ChatPopup } from '@/components/chat/ChatPopup';

interface ChatFabProps {
  projectId?: string;
}

export function ChatFab({ projectId }: ChatFabProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  function togglePopup() {
    setIsOpen(prev => {
      const next = !prev;
      if (next) {
        setHasUnread(false);
      }
      return next;
    });
  }

  return (
    <>
      <ChatPopup
        projectId={projectId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNewAssistantMessage={() => {
          if (!isOpen) {
            setHasUnread(true);
          }
        }}
      />

      <button
        type="button"
        onClick={togglePopup}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-2xl text-white shadow-xl transition-colors hover:bg-slate-700"
        aria-label="Abrir asistente de chat"
      >
        💬
        {hasUnread && <span className="absolute right-1.5 top-1.5 h-3 w-3 rounded-full bg-red-500" />}
      </button>
    </>
  );
}
