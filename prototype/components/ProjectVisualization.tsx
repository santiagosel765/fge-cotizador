import React, { useEffect, useState } from 'react';
import CameraIcon from './icons/CameraIcon';

// FIX: The A-Frame type definitions were moved to `types.ts` to be globally available, resolving errors with custom JSX elements.
interface VirtualTourViewerProps {
    imageUrl: string | null;
    isLoading: boolean;
    error: string | null;
}

const base64ToBlob = (dataUrl: string): Blob => {
    const parts = dataUrl.split(',');
    if (parts.length !== 2) {
        console.error('Formato de data URL inválido para la conversión a Blob.');
        return new Blob();
    }
    const meta = parts[0];
    const base64 = parts[1];
    
    const mimeTypeMatch = meta.match(/:(.*?);/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

    try {
        const byteCharacters = atob(base64);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: mimeType });
    } catch (e) {
        console.error("Error al decodificar la cadena base64:", e);
        return new Blob();
    }
};

const AFrameViewer: React.FC<{ panoImage: string }> = ({ panoImage }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useEffect(() => {
        if (panoImage) {
            const blob = base64ToBlob(panoImage);
            const url = URL.createObjectURL(blob);
            setBlobUrl(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        }
    }, [panoImage]);

    if (!blobUrl) {
        return <div className="w-full h-full flex items-center justify-center"><p>Cargando imagen...</p></div>;
    }

    return (
        <a-scene embedded vr-mode-ui="enabled: false" style={{ display: 'block', position: 'relative', height: '100%', width: '100%' }}>
            <a-assets>
                <img id="panorama" src={blobUrl} crossOrigin="anonymous" alt="Tour 360" />
            </a-assets>
            <a-sky src="#panorama" rotation="0 -130 0"></a-sky>
            <a-camera look-controls="magicWindowTrackingEnabled: true"></a-camera>
        </a-scene>
    );
};

const VirtualTourViewer: React.FC<VirtualTourViewerProps> = ({ imageUrl, isLoading, error }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-full">
                    <CameraIcon className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Tour Virtual 360°</h2>
                    <p className="text-sm text-slate-500">Haz clic y arrastra sobre la imagen para explorar el interior.</p>
                </div>
            </div>
            <div className="h-[60vh] bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border">
                {isLoading && (
                    <div className="text-center text-slate-500">
                        <svg className="animate-spin mx-auto h-10 w-10 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="mt-2 font-semibold">Generando tour virtual...</p>
                        <p className="text-sm">Esto puede tardar un momento.</p>
                    </div>
                )}
                {error && !isLoading && (
                    <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg w-full">
                        <p className="font-bold">Error de Visualización</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
                {imageUrl && !isLoading && !error && (
                    <div className="w-full h-full animate__animated animate__fadeIn">
                        <AFrameViewer panoImage={imageUrl} />
                    </div>
                )}
                 {!imageUrl && !isLoading && !error && (
                     <div className="text-center text-slate-400 p-4">
                        <CameraIcon className="w-12 h-12 mx-auto" />
                        <p className="mt-2 font-semibold">El tour virtual aparecerá aquí</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VirtualTourViewer;
