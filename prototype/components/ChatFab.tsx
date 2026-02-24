import React from 'react';

interface ChatFabProps {
  onClick: () => void;
}

const ChatFab: React.FC<ChatFabProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-blue-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-110 animate__animated animate__fadeInUp"
      aria-label="Abrir asistente de IA"
    >
      <span className="text-4xl" role="img" aria-label="Constructor">👷</span>
    </button>
  );
};

export default ChatFab;
