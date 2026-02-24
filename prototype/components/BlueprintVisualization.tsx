import React from 'react';
import BlueprintIcon from './icons/BlueprintIcon';

interface BlueprintVisualizationProps {
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
}

const BlueprintVisualization: React.FC<BlueprintVisualizationProps> = ({ imageUrl, isLoading, error }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-cyan-100 p-2 rounded-full">
                    <BlueprintIcon className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Plano Arquitectónico 2D</h2>
                    <p className="text-sm text-slate-500">Un plano técnico generado por IA.</p>
                </div>
            </div>
            <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border">
                {isLoading && (
                    <div className="text-center text-slate-500">
                        <svg className="animate-spin mx-auto h-10 w-10 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 font-semibold">Diseñando plano...</p>
                        <p className="text-sm">Esto puede tardar un momento.</p>
                    </div>
                )}
                {error && !isLoading && (
                    <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg w-full">
                        <p className="font-bold">Error de Diseño</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {imageUrl && !isLoading && !error && (
                    <img
                        src={imageUrl}
                        alt="Plano arquitectónico del proyecto generado por IA"
                        className="w-full h-full object-contain bg-white animate__animated animate__fadeIn"
                    />
                )}
                 {!imageUrl && !isLoading && !error && (
                     <div className="text-center text-slate-400 p-4">
                        <BlueprintIcon className="w-12 h-12 mx-auto" />
                        <p className="mt-2 font-semibold">El plano aparecerá aquí</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlueprintVisualization;
