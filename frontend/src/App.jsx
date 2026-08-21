import React, { useState } from 'react';
import HeaderMetrics from './components/HeaderMetrics';
import RespawnCard from './components/RespawnCard';
import ReportExport from './components/ReportExport';
import PlayerDashboard from './components/PlayerDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState('Sanguine');

  const categories = ['Darashia', 'Sanguine', 'Darklight', 'Piranhas', 'Totem'];

  // Mock de dados para demonstração do Frontend
  const mockParties = [
    { id: 1, category: 'Sanguine', party_name: 'Sanguine Team A', leader_name: 'Elite Knight', slot_start: '18:00', slot_end: '22:00', members: ['Elite Knight', 'Elder Druid', 'Master Sorcerer', 'Royal Paladin'], status: 'EFFICIENT', delta_xp: '15.4M' },
    { id: 2, category: 'Sanguine', party_name: 'Rushadores', leader_name: 'Sniper God', slot_start: '22:00', slot_end: '02:00', members: ['Sniper God', 'Healer Master'], status: 'GHOST_SLOT', delta_xp: '0' },
    { id: 3, category: 'Darklight', party_name: 'Madrugada', leader_name: 'No Sleep', slot_start: '02:00', slot_end: '06:00', members: ['No Sleep', 'Dark Mage'], status: 'SUBOPTIMAL', delta_xp: '4.2M' },
  ];

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto" id="report-content">
      <div className="flex justify-between items-end mb-8 border-b border-tibia-border pb-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Auroria <span className="text-tibia-primary">Telemetry</span></h1>
          <p className="text-gray-400 mt-2">Sistema de Auditoria e Censo de Respawns Planilhados</p>
        </div>
        <ReportExport elementId="report-content" filename="Relatorio_30d_Auroria.pdf" />
      </div>

      <HeaderMetrics />

      <div className="mb-8 flex space-x-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-6 py-3 rounded-lg font-bold whitespace-nowrap transition ${activeTab === cat ? 'bg-tibia-primary text-white' : 'bg-tibia-card text-gray-400 hover:text-white border border-tibia-border hover:border-gray-500'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockParties.filter(p => p.category === activeTab).length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            Nenhuma party planilhada neste respawn atualmente.
          </div>
        )}
        {mockParties
          .filter(p => p.category === activeTab)
          .map(party => (
            <RespawnCard key={party.id} party={party} />
          ))}
      </div>
      
      {/* Exemplo de uso do PlayerDashboard na página principal */}
      <PlayerDashboard playerName="Elite Knight" />
    </div>
  );
}
