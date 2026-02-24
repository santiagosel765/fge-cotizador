import React, { useState } from 'react';
import LightbulbIcon from './icons/LightbulbIcon';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';
import RefreshIcon from './icons/RefreshIcon';

interface AiPlannerAssistantProps {
  onUpdateField: (fieldName: string, value: string) => void;
}

const SUGGESTIONS = [
    { question: '¿Tu proyecto es para una vivienda de un solo nivel?', field: 'projectType', value: 'Vivienda de un solo nivel' },
    { question: '¿Necesitas que tenga 2 dormitorios?', field: 'mainSpaces', value: '2 dormitorios' },
    { question: '¿Es suficiente con un solo baño completo?', field: 'mainSpaces', value: '1 baño completo' },
    { question: '¿Te gustaría un espacio combinado para la sala y el comedor?', field: 'mainSpaces', value: 'sala y comedor combinados' },
    { question: '¿Prefieres un techo de lámina, que es más económico?', field: 'keyMaterials', value: 'techo de lámina' },
    { question: '¿Quieres usar block de cemento para las paredes?', field: 'keyMaterials', value: 'paredes de block de cemento' }
];

const AiPlannerAssistant: React.FC<AiPlannerAssistantProps> = ({ onUpdateField }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleAnswer = (addText: boolean) => {
        if (currentIndex < SUGGESTIONS.length) {
            if (addText) {
                const { field, value } = SUGGESTIONS[currentIndex];
                onUpdateField(field, value);
            }
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleReset = () => {
        setCurrentIndex(0);
    };

    const isFinished = currentIndex >= SUGGESTIONS.length;

    return (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl h-full flex flex-col">
             <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 p-2 rounded-full">
                    <LightbulbIcon className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Asistente de Diseño</h3>
                    <p className="text-sm text-slate-500">Responde para definir tu proyecto.</p>
                </div>
            </div>

            <div className="flex-grow flex items-center justify-center text-center min-h-[100px]">
                {isFinished ? (
                     <div className="flex flex-col items-center gap-2 text-slate-600 animate__animated animate__fadeIn">
                        <CheckIcon className="w-10 h-10 text-green-500"/>
                        <p className="font-semibold">¡Listo!</p>
                        <p className="text-sm">Puedes refinar los detalles o generar el proyecto.</p>
                    </div>
                ) : (
                    <p className="text-slate-700 text-base animate__animated animate__fadeIn">{SUGGESTIONS[currentIndex].question}</p>
                )}
            </div>

            <div className="mt-4 space-y-2">
                 {isFinished ? (
                     <button onClick={handleReset} className="w-full bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2">
                        <RefreshIcon className="w-4 h-4" />
                        Empezar de Nuevo
                    </button>
                 ) : (
                    <div className="flex gap-3">
                        <button onClick={() => handleAnswer(true)} className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                           <CheckIcon className="w-5 h-5" /> Sí
                        </button>
                        <button onClick={() => handleAnswer(false)} className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                           <XIcon className="w-5 h-5" /> No
                        </button>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default AiPlannerAssistant;