'use client';

import { FormEvent, useState } from 'react';
import { creditService, type CreditRequestResponse } from '@/services/credit.service';

type Props = {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSubmitted: (response: CreditRequestResponse) => void;
};

export function CreditRequestModal({ isOpen, projectId, onClose, onSubmitted }: Props): JSX.Element | null {
  const [applicantName, setApplicantName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!applicantName.trim() || !phone.trim()) {
      setError('Completa nombre y teléfono.');
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone.length < 8 || trimmedPhone.length > 20) {
      setError('El teléfono debe tener entre 8 y 20 caracteres.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await creditService.create({
        projectId,
        applicantName: applicantName.trim(),
        phone: trimmedPhone,
        notes: notes.trim() || undefined,
      });

      setApplicantName('');
      setPhone('');
      setNotes('');
      onSubmitted(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-slate-800">Solicitud de Crédito</h3>
        <p className="mt-1 text-sm text-slate-600">Completa tus datos para enviar la solicitud.</p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="credit-applicant-name">Nombre completo</label>
            <input
              id="credit-applicant-name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={applicantName}
              onChange={(event) => setApplicantName(event.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="credit-phone">Teléfono</label>
            <input
              id="credit-phone"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              minLength={8}
              maxLength={20}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="credit-notes">Notas (opcional)</label>
            <textarea
              id="credit-notes"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white disabled:bg-green-300">
              {submitting ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
