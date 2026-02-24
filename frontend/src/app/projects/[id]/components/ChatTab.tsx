'use client';

import { useState } from 'react';
import type { Project } from '@/types/project';
import type { AiMessage } from '@/types/project';

interface Props {
  project: Project;
  onProjectUpdate: (p: Project) => void;
}

export default function ChatTab({ project, onProjectUpdate }: Props) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: 'assistant',
      content: `¡Hola! Soy tu asistente de construcción. Tu proyecto "${project.name}" ya fue registrado. Cuéntame más detalles: ¿cuántos metros cuadrados necesitas? ¿tienes preferencia de materiales? ¿alguna restricción de presupuesto?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  void onProjectUpdate;

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: AiMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/ai/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: project.id,
            message: userMsg.content,
            history: messages,
          }),
        }
      );
      const data = await res.json() as { reply: string };
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Error al conectar con el asistente. Verifica que el backend esté corriendo.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl rounded-bl-sm text-sm">
              Escribiendo...
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe tu mensaje..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
