import React, { useState } from 'react';
import SparklesIcon from './icons/SparklesIcon';
import AiPlannerAssistant from './AiPlannerAssistant';

interface ProjectPlannerProps {
  onGenerate: (description: string) => Promise<void>;
}

const ProjectPlanner: React.FC<ProjectPlannerProps> = ({ onGenerate }) => {
  const [formData, setFormData] = useState({
    projectType: '',
    dimensions: '',
    mainSpaces: '',
    keyMaterials: '',
    additionalDetails: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSuggestionUpdate = (fieldName: keyof typeof formData, value: string) => {
    setFormData(prev => {
        const currentFieldValue = prev[fieldName];
        // Append with a comma if the field is not empty, otherwise just set the value.
        const newValue = currentFieldValue ? `${currentFieldValue}, ${value}` : value;
        return { ...prev, [fieldName]: newValue };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { projectType, mainSpaces, dimensions, keyMaterials, additionalDetails } = formData;
    
    if (projectType.trim().length === 0 || mainSpaces.trim().length === 0) {
      setError('Por favor, completa al menos el "Tipo de Proyecto" y los "Espacios Principales".');
      return;
    }
    
    setError(null);
    setIsLoading(true);

    // Construct a coherent paragraph for the AI
    const description = `
      Quiero un proyecto para: ${projectType}.
      Las dimensiones generales son: ${dimensions || 'las estándar de bajo costo'}.
      Los espacios requeridos son: ${mainSpaces}.
      Los materiales clave a considerar son: ${keyMaterials || 'los estándar de bajo costo como block y lámina'}.
      Detalles adicionales: ${additionalDetails || 'ninguno'}.
    `.replace(/\s+/g, ' ').trim();

    try {
      await onGenerate(description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const labelClass = "block text-sm font-medium text-slate-600 mb-1";

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-100 p-2 rounded-full">
            <SparklesIcon className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Planifica tu Proyecto con IA</h2>
            <p className="text-sm text-slate-500">Describe tu obra en las secciones o usa el asistente para generar la cotización y una vista previa.</p>
          </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Planner Form */}
          <div className="lg:w-2/3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="projectType" className={labelClass}>Tipo de Proyecto *</label>
                <input type="text" id="projectType" name="projectType" value={formData.projectType} onChange={handleInputChange} className={inputClass} placeholder="Ej: Vivienda, ampliación, muro" required disabled={isLoading} />
              </div>
              <div>
                <label htmlFor="dimensions" className={labelClass}>Dimensiones Generales</label>
                <input type="text" id="dimensions" name="dimensions" value={formData.dimensions} onChange={handleInputChange} className={inputClass} placeholder="Ej: 8x10 metros, 70m²" disabled={isLoading} />
              </div>
            </div>
            <div>
              <label htmlFor="mainSpaces" className={labelClass}>Espacios Principales *</label>
              <input type="text" id="mainSpaces" name="mainSpaces" value={formData.mainSpaces} onChange={handleInputChange} className={inputClass} placeholder="Ej: 2 cuartos, 1 baño, sala-comedor" required disabled={isLoading} />
            </div>
            <div>
              <label htmlFor="keyMaterials" className={labelClass}>Materiales Clave</label>
              <input type="text" id="keyMaterials" name="keyMaterials" value={formData.keyMaterials} onChange={handleInputChange} className={inputClass} placeholder="Ej: Paredes de block, techo de lámina" disabled={isLoading} />
            </div>
            <div>
              <label htmlFor="additionalDetails" className={labelClass}>Detalles Adicionales</label>
              <textarea id="additionalDetails" name="additionalDetails" rows={3} value={formData.additionalDetails} onChange={handleInputChange} className={inputClass} placeholder="Ej: Con un pequeño patio, acabados sencillos" disabled={isLoading}></textarea>
            </div>
          </div>

          {/* AI Assistant */}
          <div className="lg:w-1/3">
              <AiPlannerAssistant onUpdateField={handleSuggestionUpdate} />
          </div>
        </div>
        
        <div className="mt-6">
            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}
            <button
            type="submit"
            disabled={isLoading || !formData.projectType || !formData.mainSpaces}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center gap-2 transition-all transform hover:scale-105 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none"
            >
            {isLoading ? (
                <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Construyendo Visualización...
                </>
            ) : (
                <>
                <SparklesIcon className="w-5 h-5" />
                Generar Proyecto con IA
                </>
            )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectPlanner;