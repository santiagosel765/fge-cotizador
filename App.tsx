import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { QuoteItem, Material } from './types';
import { MATERIALS_DB } from './constants';
import { getMaterialSuggestions, createChatSession, sendMessageToChat, generateRenderImage, generateBlueprintImage, generate360Image, generateProjectPlan } from './services/geminiService';
import MaterialForm from './components/MaterialForm';
import QuoteTable from './components/QuoteTable';
import Summary from './components/Summary';
import ProjectPlanner from './components/ProjectPlanner';
import LocationManager from './components/LocationManager';
import CreditModal from './components/CreditModal';
import ChatFab from './components/ChatFab';
import ChatPopup, { ChatMessage } from './components/ChatPopup';
import { Chat } from '@google/genai';
import BlueprintVisualization from './components/BlueprintVisualization';
import VirtualTourViewer from './components/ProjectVisualization';
import StaticRenderVisualization from './components/StaticRenderVisualization';
import TrashIcon from './components/icons/TrashIcon';
import ExportButton from './components/ExportButton';


const App: React.FC = () => {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  
  // Static Render State
  const [renderImageUrl, setRenderImageUrl] = useState<string | null>(null);
  const [isRenderLoading, setIsRenderLoading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Blueprint State
  const [blueprintImageUrl, setBlueprintImageUrl] = useState<string | null>(null);
  const [isBlueprintLoading, setIsBlueprintLoading] = useState(false);
  const [blueprintError, setBlueprintError] = useState<string | null>(null);

  // 360 Pano State
  const [panoImageUrl, setPanoImageUrl] = useState<string | null>(null);
  const [isPanoLoading, setIsPanoLoading] = useState(false);
  const [panoError, setPanoError] = useState<string | null>(null);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const materialsMap = useMemo(() => {
    return new Map<string, Material>(MATERIALS_DB.map(m => [m.id, m]));
  }, []);

  useEffect(() => {
    try {
        const session = createChatSession();
        setChatSession(session);
        setChatMessages([
            { role: 'model', text: '¡Hola! Soy tu asistente de construcción. ¿En qué puedo ayudarte hoy?' }
        ]);
    } catch (e) {
        console.error(e);
        setChatMessages([
            { role: 'model', text: 'Lo siento, no pude conectar con el asistente de IA en este momento.' }
        ]);
    }
  }, []);

  const handleAddItem = useCallback((materialId: string, quantity: number) => {
    const material = materialsMap.get(materialId);
    if (material) {
      setQuoteItems(prevItems => {
        const existingItem = prevItems.find(item => item.material.id === materialId);
        if (existingItem) {
          return prevItems.map(item =>
            item.material.id === materialId ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prevItems, { material, quantity }];
      });
    }
  }, [materialsMap]);

  const handleRemoveItem = useCallback((materialId: string) => {
    setQuoteItems(prevItems => prevItems.filter(item => item.material.id !== materialId));
  }, []);

  const handleClearQuote = useCallback(() => {
    setQuoteItems([]);
    setRenderImageUrl(null);
    setIsRenderLoading(false);
    setRenderError(null);
    setBlueprintImageUrl(null);
    setBlueprintError(null);
    setIsBlueprintLoading(false);
    setPanoImageUrl(null);
    setIsPanoLoading(false);
    setPanoError(null);
  }, []);
  
  const handleSendMessage = useCallback(async (message: string) => {
    if (!chatSession || !message.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', text: message };
    setChatMessages(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);

    try {
        const responseText = await sendMessageToChat(chatSession, message);
        const newAiMessage: ChatMessage = { role: 'model', text: responseText };
        setChatMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
        const errorMessage: ChatMessage = { role: 'model', text: 'Lo siento, ocurrió un error. Inténtalo de nuevo.' };
        setChatMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsChatLoading(false);
    }
  }, [chatSession]);

  const handleGetAdviceInChat = useCallback(async () => {
    if (!chatSession) return;
    
    if (quoteItems.length === 0) {
        const adviceMessage: ChatMessage = { role: 'model', text: "Para darte consejos, primero agrega algunos materiales a tu cotización usando el planificador o el formulario." };
        setChatMessages(prev => [...prev, adviceMessage]);
        return;
    }

    const materialList = quoteItems.map(item => `- ${item.quantity} ${item.material.unit} de ${item.material.name}`).join('\n');
    const prompt = `Por favor, analiza la siguiente lista de materiales y dame tus recomendaciones como un experto en construcción.
        Lista de Materiales:
        ${materialList}
        Dame un resumen breve del posible proyecto, consejos de optimización, y sugiere 1 o 2 materiales que podrían faltar. Sé breve y directo.`;

    const userAdviceRequest: ChatMessage = { role: 'user', text: "Analiza mi lista de materiales y dame consejos." };
    setChatMessages(prev => [...prev, userAdviceRequest]);
    setIsChatLoading(true);

    try {
        const responseText = await sendMessageToChat(chatSession, prompt);
        const newAiMessage: ChatMessage = { role: 'model', text: responseText };
        setChatMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
        const errorMessage: ChatMessage = { role: 'model', text: 'Lo siento, ocurrió un error al generar los consejos.' };
        setChatMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsChatLoading(false);
    }
  }, [chatSession, quoteItems]);


  const handleGenerateProject = useCallback(async (description: string) => {
    handleClearQuote();
    setIsRenderLoading(true);
    setIsBlueprintLoading(true);
    setIsPanoLoading(true);

    try {
        const plan = await generateProjectPlan(description);

        const [materialsResult, imageResult, blueprintResult, panoResult] = await Promise.allSettled([
            getMaterialSuggestions(plan.detailedConcept),
            generateRenderImage(plan.renderPrompt),
            generateBlueprintImage(plan.blueprintPrompt),
            generate360Image(plan.panoPrompt),
        ]);

        if (materialsResult.status === 'fulfilled') {
            const suggestions = materialsResult.value;
            const newQuoteItems = suggestions
              .map((item: { id: string, quantity: number }) => {
                const material = materialsMap.get(item.id);
                if (material && item.quantity > 0) {
                  return { material, quantity: item.quantity };
                }
                return null;
              })
              .filter((item): item is QuoteItem => item !== null);
            setQuoteItems(newQuoteItems);
        } else {
            console.error("Material generation failed:", materialsResult.reason);
        }

        if (imageResult.status === 'fulfilled') {
            setRenderImageUrl(imageResult.value);
        } else {
            console.error("Image generation failed:", imageResult.reason);
            setRenderError(imageResult.reason instanceof Error ? imageResult.reason.message : 'No se pudo generar la imagen.');
        }
        
        if (blueprintResult.status === 'fulfilled') {
            setBlueprintImageUrl(blueprintResult.value);
        } else {
            console.error("Blueprint generation failed:", blueprintResult.reason);
            setBlueprintError(blueprintResult.reason instanceof Error ? blueprintResult.reason.message : 'No se pudo generar el plano.');
        }

        if (panoResult.status === 'fulfilled') {
            setPanoImageUrl(panoResult.value);
        } else {
            console.error("360 Pano generation failed:", panoResult.reason);
            setPanoError(panoResult.reason instanceof Error ? panoResult.reason.message : 'No se pudo generar el tour virtual.');
        }
    } catch(e) {
        const errorMessage = e instanceof Error ? e.message : 'No se pudo generar el plan del proyecto.';
        console.error("Project plan generation failed:", e);
        setRenderError(errorMessage);
        setBlueprintError(errorMessage);
        setPanoError(errorMessage);
    } finally {
        setIsRenderLoading(false);
        setIsBlueprintLoading(false);
        setIsPanoLoading(false);
    }
}, [materialsMap, handleClearQuote]);


  const subtotal = useMemo(() => {
    return quoteItems.reduce((total, item) => total + item.material.price * item.quantity, 0);
  }, [quoteItems]);

  const addedMaterialIds = useMemo(() => new Set(quoteItems.map(item => item.material.id)), [quoteItems]);

  const showVisuals = isRenderLoading || isBlueprintLoading || isPanoLoading || renderImageUrl || blueprintImageUrl || panoImageUrl || renderError || blueprintError || panoError;

  return (
    <>
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Cotizador de Construcción Génesis Empresarial</h1>
          <p className="mt-2 text-lg text-blue-200">La herramienta IA de Génesis Empresarial para planificar tus proyectos.</p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
            <ProjectPlanner onGenerate={handleGenerateProject} />
            
            {showVisuals && (
                 <div className="grid grid-cols-1 gap-8 animate__animated animate__fadeInUp">
                    <BlueprintVisualization
                        imageUrl={blueprintImageUrl}
                        isLoading={isBlueprintLoading}
                        error={blueprintError}
                    />
                    <StaticRenderVisualization
                        imageUrl={renderImageUrl}
                        isLoading={isRenderLoading}
                        error={renderError}
                    />
                    <VirtualTourViewer
                        imageUrl={panoImageUrl}
                        isLoading={isPanoLoading}
                        error={panoError}
                    />
                 </div>
            )}

            {quoteItems.length > 0 && (
                <div className="space-y-8 animate__animated animate__fadeInUp">
                    <QuoteTable items={quoteItems} onRemoveItem={handleRemoveItem} />
                    <Summary subtotal={subtotal} />
                </div>
            )}
            
            {(quoteItems.length === 0 && !showVisuals) && (
                <div className="bg-white p-6 rounded-xl shadow-lg text-center text-slate-500">
                    <p className="text-lg">Tu cotización está vacía.</p>
                    <p>Usa el planificador con IA o agrega materiales manualmente para comenzar.</p>
                </div>
            )}

            <MaterialForm onAddItem={handleAddItem} addedMaterialIds={addedMaterialIds} />
            
            <LocationManager />

            {quoteItems.length > 0 && (
                <div className="pt-8 mt-8 border-t border-slate-200 animate__animated animate__fadeInUp">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
                            <h3 className="text-xl font-bold text-slate-800">¿Necesitas Financiamiento?</h3>
                            <p className="text-slate-500 mt-1 mb-4">Inicia tu solicitud de crédito con nosotros.</p>
                            <button
                                onClick={() => setIsCreditModalOpen(true)}
                                className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            >
                                Solicitar Crédito
                            </button>
                             <p className="text-xs text-slate-400 mt-3">
                                Ofrecido por Fundación Genesis Empresarial. Sujeto a análisis y aprobación.
                            </p>
                        </div>
                        <ExportButton 
                            items={quoteItems}
                            subtotal={subtotal}
                            blueprintUrl={blueprintImageUrl}
                            renderUrl={renderImageUrl}
                        />
                        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
                            <h3 className="text-xl font-bold text-slate-800">¿Quieres Empezar de Nuevo?</h3>
                            <p className="text-slate-500 mt-1 mb-4">Limpia la cotización actual para iniciar otra.</p>
                            <button
                                onClick={handleClearQuote}
                                className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <TrashIcon className="w-5 h-5"/>
                                Limpiar Cotización
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </main>
      
      <footer className="bg-slate-800 text-slate-400 mt-12 py-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p>&copy; {new Date().getFullYear()} Cotizador de Construcción - Génesis Empresarial. Todos los derechos reservados.</p>
              <p className="text-sm mt-1">Los precios son estimaciones y pueden variar según el proveedor y la región.</p>
          </div>
      </footer>
    </div>
    <CreditModal 
      isOpen={isCreditModalOpen}
      onClose={() => setIsCreditModalOpen(false)}
    />
     <ChatFab onClick={() => setIsChatOpen(true)} />
     <ChatPopup 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        onGetAdvice={handleGetAdviceInChat}
        isLoading={isChatLoading}
        hasItems={quoteItems.length > 0}
      />
    </>
  );
};

export default App;
