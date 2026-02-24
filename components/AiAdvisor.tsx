
import React from 'react';
import LightbulbIcon from './icons/LightbulbIcon';
import ReactMarkdown from 'react-markdown';

interface AiAdvisorProps {
  onGetAdvice: () => void;
  advice: string | null;
  isLoading: boolean;
  error: string | null;
  hasItems: boolean;
}

const AiAdvisor: React.FC<AiAdvisorProps> = ({ onGetAdvice, advice, isLoading, error, hasItems }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-2 rounded-full">
            <LightbulbIcon className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Asistente IA</h3>
            <p className="text-sm text-slate-500">Obtén consejos sobre tu lista de materiales.</p>
          </div>
        </div>
        <button
          onClick={onGetAdvice}
          disabled={!hasItems || isLoading}
          className="w-full sm:w-auto bg-yellow-400 text-yellow-900 font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-500 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analizando...
            </>
          ) : (
            'Obtener Consejos'
          )}
        </button>
      </div>
      
      {(isLoading || error || advice) && (
        <div className="mt-4 pt-4 border-t border-slate-200">
            {error && <p className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</p>}
            {advice && !error && (
            <div className="prose prose-slate max-w-none p-4 bg-slate-50 rounded-lg animate__animated animate__fadeIn">
                <ReactMarkdown>{advice}</ReactMarkdown>
            </div>
            )}
        </div>
      )}
    </div>
  );
};

export default AiAdvisor;
