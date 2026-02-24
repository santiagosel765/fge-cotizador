'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import type { Project } from '@/types/project';
import ChatTab from './components/ChatTab';
import QuotationTab from './components/QuotationTab';

type Tab = 'chat' | 'quotation' | 'map';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Project>(`/projects/${id}`)
      .then(setProject)
      .catch(() => setError('Proyecto no encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Cargando proyecto...</p>
    </div>
  );

  if (error || !project) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">{error || 'Error desconocido'}</p>
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'chat', label: '🤖 Asistente IA' },
    { key: 'quotation', label: '📋 Cotización' },
    { key: 'map', label: '📍 Ubicación' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
              {project.userDescription}
            </p>
          </div>
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${
            project.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
            project.status === 'planned' ? 'bg-blue-100 text-blue-700' :
            project.status === 'quoted' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {project.status}
          </span>
        </div>
      </header>

      <div className="bg-white border-b px-6">
        <div className="max-w-4xl mx-auto flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {activeTab === 'chat' && (
          <ChatTab project={project} onProjectUpdate={setProject} />
        )}
        {activeTab === 'quotation' && (
          <QuotationTab project={project} />
        )}
        {activeTab === 'map' && (
          <div className="bg-white rounded-xl p-6 text-center text-gray-400">
            Mapa de ubicación (próximamente)
          </div>
        )}
      </div>
    </div>
  );
}
