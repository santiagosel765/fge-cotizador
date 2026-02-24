import React, { useState, useRef, useEffect } from 'react';
import SendIcon from './icons/SendIcon';
import XIcon from './icons/XIcon';
import ReactMarkdown from 'react-markdown';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface ChatPopupProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onGetAdvice: () => void;
  isLoading: boolean;
  hasItems: boolean;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ isOpen, onClose, messages, onSendMessage, onGetAdvice, isLoading, hasItems }) => {
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if(isOpen) {
        setTimeout(scrollToBottom, 100);
    }
  }, [isOpen, messages, isLoading]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() && !isLoading) {
      onSendMessage(userInput);
      setUserInput('');
    }
  };

  const handleGetAdviceClick = () => {
    if (!isLoading) {
        onGetAdvice();
    }
  }

  if (!isOpen) return null;

  return (
    <div 
        className="fixed bottom-0 right-0 sm:bottom-24 sm:right-6 sm:left-auto z-50 w-full max-w-sm h-[70vh] sm:h-[60vh] animate__animated animate__fadeInUp"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
    >
      <div className="bg-white h-full rounded-t-xl sm:rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <header className="bg-slate-700 text-white p-4 rounded-t-xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label="Constructor">👷</span>
            <h3 id="chat-title" className="font-bold text-lg">Asistente IA</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white transition-colors" aria-label="Cerrar chat">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-sm lg:max-w-md rounded-2xl px-4 py-2 shadow-sm ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                   <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 text-inherit">
                     <ReactMarkdown components={{ a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-200 hover:underline" /> }}>{msg.text}</ReactMarkdown>
                   </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-200 text-slate-800 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce"></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <footer className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
           <button
                onClick={handleGetAdviceClick}
                disabled={!hasItems || isLoading}
                className="w-full text-sm mb-3 bg-yellow-100 text-yellow-800 font-semibold py-2 px-4 rounded-lg hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-yellow-400 disabled:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-500 transition-colors"
            >
                Obtener consejos sobre mi cotización
            </button>
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              className="flex-1 w-full p-2 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !userInput.trim()}
              className="bg-blue-600 text-white p-2.5 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shrink-0"
              aria-label="Enviar mensaje"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default ChatPopup;
