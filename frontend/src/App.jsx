import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import LiveDashboard from './views/LiveDashboard';
import PlanilhaManager from './views/PlanilhaManager';
import PlayerDashboard from './components/PlayerDashboard';
import ReportExport from './components/ReportExport';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch(currentView) {
      case 'dashboard': return <LiveDashboard />;
      case 'planilha': return <PlanilhaManager />;
      case 'players': 
        return (
          <div className="p-8 max-w-7xl mx-auto w-full">
            <h2 className="text-3xl font-black text-white mb-2">Raio-X de Jogador</h2>
            <p className="text-gray-400 mb-8">Busque por um jogador para ver sua eficiência e telemetria.</p>
            {/* Aqui poderiamos colocar um input de busca real */}
            <PlayerDashboard playerName="Qualquer Membro" />
          </div>
        );
      case 'analytics':
        return (
          <div className="p-8 max-w-7xl mx-auto w-full" id="report-content">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">Analytics & Auditoria</h2>
                <p className="text-gray-400">Visão macro de eficiência e prejuízos da guilda.</p>
              </div>
              <ReportExport elementId="report-content" filename="Auditoria_Guilda.pdf" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-tibia-card border border-red-500/30 p-6 rounded-lg">
                <h3 className="text-red-400 font-bold mb-2">Prejuízo Estimado (30d)</h3>
                <p className="text-4xl font-black text-white">142<span className="text-xl text-gray-500 font-normal">h perdidas</span></p>
                <p className="text-sm text-gray-400 mt-2">Equivalente a ~4.2kkk de XP desperdiçada por ausências.</p>
              </div>
              <div className="bg-tibia-card border border-green-500/30 p-6 rounded-lg">
                <h3 className="text-green-400 font-bold mb-2">Party Mais Eficiente</h3>
                <p className="text-4xl font-black text-white">Rushadores</p>
                <p className="text-sm text-gray-400 mt-2">Média de 92% de aproveitamento do slot.</p>
              </div>
            </div>
            {/* Espaço para mais tabelas de analytics */}
          </div>
        );
      default: return <LiveDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-tibia-bg text-gray-200">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
}
