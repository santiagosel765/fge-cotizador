'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '@/lib/api';
import { Archive } from 'lucide-react';

type MessageRole = 'user' | 'assistant';

interface ChatMessage {
  role: MessageRole;
  content: string;
}

interface ChatResponse {
  response: string;
  conversationId: string;
}

interface ChatPopupProps {
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onNewAssistantMessage: () => void;
}

const WELCOME_MESSAGE = 'Hola, soy tu asistente de arquitectura FGE. ¿En qué te ayudo con tu proyecto?';

export function ChatPopup({ projectId, isOpen, onClose, onNewAssistantMessage }: ChatPopupProps): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSendMessage() {
    const trimmedMessage = inputValue.trim();

    if (!trimmedMessage || isLoading) {
      return;
    }

    if (!projectId) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Selecciona un proyecto para usar el asistente' }]);
      setInputValue('');
      onNewAssistantMessage();
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: trimmedMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const result = await api.post<ChatResponse>('/ai/chat', {
        projectId,
        message: trimmedMessage,
        ...(conversationId ? { conversationId } : {}),
      });

      setConversationId(result.conversationId);
      setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      onNewAssistantMessage();
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'No fue posible contactar al asistente. Verifica la conexión con el backend.',
      }]);
      onNewAssistantMessage();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`fixed bottom-24 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[380px] h-[520px] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col transition-all duration-200 ${
        isOpen ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-3'
      }`}
    >
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
            FGE
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Asistente FGE</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Arquitectura y cotización
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Cerrar chat"
        >
          <Archive size={16} />
        </button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-3">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`rounded-2xl p-3 text-sm ${
                message.role === 'user'
                  ? 'ml-auto max-w-[75%] rounded-br-sm bg-blue-600 text-white'
                  : 'max-w-[85%] rounded-bl-sm border border-gray-100 bg-white text-gray-800 shadow-sm leading-relaxed'
              }`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    ul: ({ children }) => <ul className="list-disc list-inside mt-1 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mt-1 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
              Escribiendo...
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

       <footer className="border-t border-gray-200 bg-white p-3">
        {!projectId && (
          <p className="mb-2 text-xs text-amber-700">Selecciona un proyecto para usar el asistente</p>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={event => setInputValue(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                void handleSendMessage();
              }
            }}
            placeholder="Escribe tu mensaje..."
            className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => void handleSendMessage()}
            disabled={isLoading || !inputValue.trim()}
            className="h-10 rounded-xl bg-slate-900 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Enviar
          </button>
        </div>
      </footer>
    </div>
  );
}
