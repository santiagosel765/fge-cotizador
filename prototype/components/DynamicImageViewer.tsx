import React, { useRef } from 'react';
import { Pannellum } from "pannellum-react";
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface DynamicImageViewerProps {
  imageUrl: string;
  altText: string;
}

const DynamicImageViewer: React.FC<DynamicImageViewerProps> = ({ imageUrl, altText }) => {
    const pannellumRef = useRef<any>(null);

    const handleLook = (direction: 'up' | 'down' | 'left' | 'right') => {
        const viewer = pannellumRef.current?.getViewer();
        if (!viewer) return;

        const PITCH_STEP = 10;
        const YAW_STEP = 10;

        // Detener la autorotación cuando el usuario interactúa
        if (viewer.isLoaded()) {
            viewer.stopAutoRotate();
        }

        switch (direction) {
            case 'up':
                viewer.setPitch(viewer.getPitch() + PITCH_STEP);
                break;
            case 'down':
                viewer.setPitch(viewer.getPitch() - PITCH_STEP);
                break;
            case 'left':
                viewer.setYaw(viewer.getYaw() - YAW_STEP);
                break;
            case 'right':
                viewer.setYaw(viewer.getYaw() + YAW_STEP);
                break;
        }
    };
    
    const navButtonClass = "bg-black bg-opacity-40 text-white rounded-full p-2 hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-75 transition-all";

    return (
        <div className="w-full h-full rounded-lg overflow-hidden relative group">
            <Pannellum
                ref={pannellumRef}
                width="100%"
                height="100%"
                image={imageUrl}
                pitch={0}
                yaw={-20}
                hfov={120}
                autoLoad
                title={altText}
                compass={true}
                showZoomCtrl={true}
                showFullscreenCtrl={true}
                autoRotate={-2}
            >
                <Pannellum.Hotspot type="info" pitch={5} yaw={-10} text="Vista hacia la Entrada Principal"/>
                <Pannellum.Hotspot type="info" pitch={-5} yaw={100} text="Jardín y área verde"/>
                <Pannellum.Hotspot type="info" pitch={0} yaw={-140} text="Vista del entorno y el cielo"/>
            </Pannellum>
             {/* Controles de Navegación Superpuestos */}
             <div className="absolute bottom-5 right-5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="grid grid-cols-3 grid-rows-3 gap-2 w-32 h-32">
                    <button onClick={() => handleLook('up')} className={`${navButtonClass} col-start-2 row-start-1 flex items-center justify-center`} aria-label="Mirar arriba">
                        <ArrowUpIcon className="w-6 h-6"/>
                    </button>
                    <button onClick={() => handleLook('left')} className={`${navButtonClass} col-start-1 row-start-2 flex items-center justify-center`} aria-label="Mirar a la izquierda">
                        <ArrowLeftIcon className="w-6 h-6"/>
                    </button>
                    <button onClick={() => handleLook('right')} className={`${navButtonClass} col-start-3 row-start-2 flex items-center justify-center`} aria-label="Mirar a la derecha">
                        <ArrowRightIcon className="w-6 h-6"/>
                    </button>
                    <button onClick={() => handleLook('down')} className={`${navButtonClass} col-start-2 row-start-3 flex items-center justify-center`} aria-label="Mirar abajo">
                        <ArrowDownIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DynamicImageViewer;
