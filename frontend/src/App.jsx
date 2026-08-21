import React, { useState } from 'react';
import TopNav from './components/TopNav';
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
            <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Inspeção de Membro</h2>
            <p className="text-gray-400 mb-8 font-sans">Verifique a eficiência e a telemetria histórica de qualquer jogador da guilda.</p>
            <PlayerDashboard playerName="Exemplo de Jogador" />
          </div>
        );
      case 'analytics':
        return (
          <div className="p-8 max-w-7xl mx-auto w-full" id="report-content">
            <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
              <div>
                <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Auditoria da Guilda</h2>
                <p className="text-gray-400 font-sans">Livro-caixa de horas desperdiçadas e eficiência global.</p>
              </div>
              <ReportExport elementId="report-content" filename="Auditoria_Guilda.pdf" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-tibia-card border border-red-900 shadow-tibia-inset p-6 rounded relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-red-900 text-xs px-2 py-1 text-white uppercase font-bold">Crítico</div>
                <h3 className="text-red-500 font-medieval text-xl mb-2">Prejuízo Estimado (30 Dias)</h3>
                <p className="text-5xl font-black text-white font-sans">142<span className="text-xl text-gray-500 font-normal">h perdidas</span></p>
                <p className="text-sm text-gray-400 mt-3 font-sans border-t border-tibia-border pt-2">Equivalente a ~4.2kkk de XP desperdiçada por ausências e atrasos.</p>
              </div>
              <div className="bg-tibia-card border border-green-900 shadow-tibia-inset p-6 rounded relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-900 text-xs px-2 py-1 text-white uppercase font-bold">Excelente</div>
                <h3 className="text-green-500 font-medieval text-xl mb-2">Hall da Fama (Mais Eficientes)</h3>
                <p className="text-5xl font-black text-white font-sans text-tibia-highlight">Rushadores</p>
                <p className="text-sm text-gray-400 mt-3 font-sans border-t border-tibia-border pt-2">Média de 92% de aproveitamento de slot na semana.</p>
              </div>
            </div>
          </div>
        );
      default: return <LiveDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-tibia-bg text-gray-200 font-sans" style={{ backgroundImage: 'radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)' }}>
      <TopNav currentView={currentView} setCurrentView={setCurrentView} />
      <main className="w-full">
        {renderView()}
      </main>
    </div>
  );
}
