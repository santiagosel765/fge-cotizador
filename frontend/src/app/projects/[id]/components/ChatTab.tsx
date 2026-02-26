'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { AiMessage } from '@/types/project';

interface ChatTabProps {
  projectId: string;
  onGeneratePlan?: () => void;
}

export default function ChatTab({ projectId, onGeneratePlan }: ChatTabProps) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de construcción. ¿Deseas que te ayude a refinar espacios, materiales y presupuesto?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: AiMessage = { role: 'user', content: input };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const result = await api.post<{ reply: string }>('/ai/chat', {
        projectId,
        message: userMsg.content,
        history: nextHistory
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role, content: m.content })),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'No fue posible responder en este momento. Verifica conexión con backend.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan() {
    if (planning) return;
    setPlanning(true);
    try {
      await onGeneratePlan?.();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Plan completo solicitado. Cuando termine la generación, verás los resultados en esta página.',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'No se pudo solicitar el plan completo en este momento.',
      }]);
    } finally {
      setPlanning(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50 origin-bottom-right">
        <div
          className={`w-[calc(100vw-3rem)] sm:w-96 h-[520px] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white flex flex-col transition-all duration-200 ease-out ${
            isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
          }`}
        >
          <header className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <div>
                <p className="font-semibold text-sm">Asistente de Diseño</p>
                <p className="text-xs text-slate-300">IA activa</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
              aria-label="Cerrar chat"
            >
              ×
            </button>
          </header>

          <div className="bg-slate-50 border-b px-3 py-2">
            <button
              onClick={generatePlan}
              disabled={planning}
              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium py-1.5 px-3 rounded-lg border border-amber-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {planning ? 'Generando...' : '⚡ Generar Plan Completo'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-white">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-2xl rounded-br-sm max-w-[85%] shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="flex justify-start gap-2">
                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs">🏗</span>
                    </div>
                    <div className="bg-slate-100 text-slate-800 text-sm px-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%] shadow-sm">
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start gap-2">
                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">🏗</span>
                </div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <footer className="border-t bg-white px-3 py-2 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent bg-slate-50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 transition-colors"
              aria-label="Enviar mensaje"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          </footer>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 group">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="relative w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 shadow-2xl transition-all duration-200 flex items-center justify-center"
          aria-label="Asistente de Diseño"
        >
          {!isOpen && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-white">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          </svg>
        </button>
        <div className="pointer-events-none absolute bottom-16 right-0 mb-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          Asistente de Diseño
        </div>
      </div>
    </>
  );
}
