import React, { useState, useEffect } from 'react';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'form' | 'success';

const CreditModal: React.FC<CreditModalProps> = ({ isOpen, onClose }) => {
  const [view, setView] = useState<View>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState('');

  useEffect(() => {
    // Reset form when modal is opened
    if (isOpen) {
      setView('form');
      setName('');
      setPhone('');
      setError(null);
      setTicketNumber('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) {
      setError('Por favor, ingresa un nombre válido.');
      return;
    }
    if (!/^\d{8}$/.test(phone.trim())) {
      setError('Por favor, ingresa un número de teléfono de 8 dígitos.');
      return;
    }
    setError(null);
    setTicketNumber(`FGE-${Date.now()}`);
    setView('success');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center animate__animated animate__fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="credit-modal-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-8 m-4 max-w-md w-full transform transition-all animate__animated animate__zoomIn"
        onClick={e => e.stopPropagation()}
      >
        {view === 'form' && (
          <>
            <h2 id="credit-modal-title" className="text-2xl font-bold text-slate-800 text-center">Solicitar Crédito</h2>
            <p className="text-slate-600 mt-2 text-center">Completa tus datos para iniciar la solicitud. Un asesor se pondrá en contacto contigo.</p>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="name-input" className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Tu nombre y apellido"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone-input" className="block text-sm font-medium text-slate-700 mb-1">Número de Teléfono</label>
                <input
                  id="phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Ej: 55443322"
                  maxLength={8}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
              <button
                type="submit"
                className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Enviar Solicitud
              </button>
            </form>
          </>
        )}

        {view === 'success' && (
           <>
            <h2 id="credit-modal-title" className="text-2xl font-bold text-green-700 text-center">¡Solicitud Enviada!</h2>
            <p className="text-slate-600 mt-2 text-center">Guarda tu número de ticket. Un asesor de <span className="font-semibold">Fundación Genesis Empresarial</span> se pondrá en contacto contigo pronto.</p>
            
            <div className="bg-slate-100 rounded-lg p-4 my-6 text-center">
                <p className="text-sm text-slate-500">Tu Número de Ticket</p>
                <p className="text-3xl font-mono font-bold text-blue-700 tracking-wider">{ticketNumber}</p>
            </div>

            <div className="text-center text-slate-700 space-y-1">
                <p>Para más información, puedes contactarlos al:</p>
                <p className="font-bold text-lg">📞 180-100-27337</p>
            </div>

            <button
              onClick={onClose}
              className="mt-8 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              aria-label="Cerrar ventana modal"
            >
              Entendido
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CreditModal;