
import React, { useState } from 'react';
import { QuoteItem } from '../types';
import { IVA_RATE } from '../constants';
import DownloadIcon from './icons/DownloadIcon';

// Tell TypeScript about the globals from the script tags
declare global {
  interface Window {
    jspdf: any;
  }
}

interface ExportButtonProps {
  items: QuoteItem[];
  subtotal: number;
  blueprintUrl: string | null;
  renderUrl: string | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(amount);
};

const ExportButton: React.FC<ExportButtonProps> = ({ items, subtotal, blueprintUrl, renderUrl }) => {
    const [isExporting, setIsExporting] = useState(false);

    const generatePdf = async () => {
        setIsExporting(true);
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // 1. Header
            doc.setFontSize(20);
            doc.text("Cotización de Construcción", 105, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.text("Génesis Empresarial", 105, 28, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-GT')}`, 105, 34, { align: 'center' });
            
            let yPos = 45;

            // Helper to add images and handle pagination
            const addImageWithTitle = async (title: string, url: string): Promise<void> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.onload = () => {
                        const aspectRatio = img.width / img.height;
                        const imgWidth = 180;
                        const imgHeight = imgWidth / aspectRatio;
                        
                        // Check if space is enough for title + image
                        if (yPos + imgHeight + 10 > 280) { 
                            doc.addPage();
                            yPos = 20;
                        }

                        doc.setFontSize(14);
                        doc.text(title, 14, yPos);
                        yPos += 6;
                        
                        doc.addImage(img, 'JPEG', 15, yPos, imgWidth, imgHeight);
                        yPos += imgHeight + 10;
                        resolve();
                    };
                    img.onerror = reject;
                    img.src = url;
                });
            };
            
            if (blueprintUrl) {
                await addImageWithTitle("Plano Arquitectónico 2D", blueprintUrl);
            }
            if (renderUrl) {
                await addImageWithTitle("Render Fotorrealista", renderUrl);
            }

            // 2. Materials Table
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(14);
            doc.text("Lista de Materiales", 14, yPos);
            
            const tableColumn = ["Material", "Unidad", "Cantidad", "P/U", "Subtotal"];
            const tableRows = items.map(item => [
                item.material.name,
                item.material.unit,
                item.quantity,
                formatCurrency(item.material.price),
                formatCurrency(item.material.price * item.quantity),
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: yPos + 2,
                theme: 'grid',
                headStyles: { fillColor: [30, 58, 138] }, // Tailwind blue-800
                styles: { halign: 'center', valign: 'middle' },
                columnStyles: {
                    0: { halign: 'left' },
                    3: { halign: 'right' },
                    4: { halign: 'right' },
                }
            });

            yPos = doc.autoTable.previous.finalY + 15;

            // 3. Summary
            if (yPos > 260) {
                doc.addPage();
                yPos = 20;
            }
            
            const iva = subtotal * IVA_RATE;
            const total = subtotal + iva;

            doc.setFontSize(12);
            doc.text("Resumen de Costos", 14, yPos);
            yPos += 7;
            doc.setFontSize(10);
            doc.text(`Subtotal: ${formatCurrency(subtotal)}`, 14, yPos);
            yPos += 5;
            doc.text(`IVA (${(IVA_RATE * 100).toFixed(0)}%): ${formatCurrency(iva)}`, 14, yPos);
            yPos += 7;
            doc.setLineWidth(0.5);
            doc.line(14, yPos - 2, 60, yPos - 2);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`Total Estimado: ${formatCurrency(total)}`, 14, yPos);
            
            // 4. Footer on each page
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text('Los precios son estimaciones y pueden variar. Cotización generada por la herramienta IA de Génesis Empresarial.', 105, 285, { align: 'center' });
                doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
            }

            // 5. Save
            doc.save('Cotizacion-Genesis-Empresarial.pdf');
        } catch (e) {
            console.error("Error generating PDF:", e);
            alert("Hubo un error al generar el PDF. Asegúrate de que tu navegador no esté bloqueando la descarga.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center text-center">
            <h3 className="text-xl font-bold text-slate-800">¿Todo Listo?</h3>
            <p className="text-slate-500 mt-1 mb-4">Exporta tu cotización completa como un PDF.</p>
            <button
                onClick={generatePdf}
                disabled={isExporting}
                className="w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                {isExporting ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Exportando...
                    </>
                ) : (
                    <>
                        <DownloadIcon className="w-5 h-5" />
                        Exportar a PDF
                    </>
                )}
            </button>
        </div>
    );
};

export default ExportButton;
