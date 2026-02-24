'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { Project, AiMessage } from '@/types/project';

interface Props {
  project: Project;
  onProjectUpdate: (p: Project) => void;
}

export default function ChatTab({ project, onProjectUpdate }: Props) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de construcción. ¿Deseas que te ayude a refinar espacios, materiales y presupuesto?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState(false);

  void onProjectUpdate;

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: AiMessage = { role: 'user', content: input };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const data = await api.post<{ reply: string }>('/ai/chat', {
        projectId: project.id,
        message: userMsg.content,
        history: messages,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
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
      await api.post('/ai/plan', { projectId: project.id });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Plan completo solicitado. Cuando termine la generación, actualiza la página para ver resultados.',
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
    <div className="bg-white rounded-xl shadow-lg flex flex-col h-[560px]">
      <header className="bg-slate-700 text-white p-4 rounded-t-xl">
        <h3 className="font-bold text-lg">Asistente de Diseño</h3>
        <p className="text-sm text-slate-200">Preguntas guiadas y chat con IA para tu proyecto.</p>
      </header>

      <div className="px-4 py-3 border-b bg-slate-50">
        <button
          onClick={generatePlan}
          disabled={planning}
          className="w-full text-sm bg-yellow-100 text-yellow-800 font-semibold py-2 px-4 rounded-lg hover:bg-yellow-200 disabled:bg-slate-200 disabled:text-slate-500 transition-colors"
        >
          {planning ? 'Generando plan...' : 'Generar Plan Completo'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-slate-200 text-slate-800 rounded-bl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <p className="text-sm text-slate-500">Escribiendo...</p>}
      </div>

      <footer className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe tu pregunta..."
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Enviar
        </button>
      </footer>
    </div>
  );
}
