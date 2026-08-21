import React from 'react';
import { Trophy, AlertOctagon } from 'lucide-react';
import ReportExport from './ReportExport';

export default function Rankings() {
  const hallOfFame = [
    { name: 'Kina Master', efficiency: 94, category: 'Sanguine' },
    { name: 'Shooter Liso', efficiency: 89, category: 'Darashia' },
    { name: 'Healer Top', efficiency: 85, category: 'Darklight' },
  ];

  const wallOfShame = [
    { name: 'Ghost Hunt 1', ghostSlots: 14, lostXp: '150M' },
    { name: 'Dorminhoco', ghostSlots: 9, lostXp: '90M' },
    { name: 'Atrasado', ghostSlots: 7, lostXp: '70M' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full" id="report-content">
      <div className="flex justify-between items-center mb-8 border-b border-tibia-border pb-4">
        <div>
          <h2 className="text-4xl font-medieval text-tibia-highlight mb-2 drop-shadow-md">Auditoria da Guilda (Últimos 30 dias)</h2>
          <p className="text-gray-400 font-sans">Livro-caixa de horas desperdiçadas e eficiência global gerado para a Administração.</p>
        </div>
        <ReportExport elementId="report-content" filename="Auditoria_Guilda_30d.pdf" />
      </div>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-tibia-card border border-red-900 shadow-tibia-inset p-6 rounded relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-red-900 text-xs px-2 py-1 text-white uppercase font-bold">Crítico</div>
          <h3 className="text-red-500 font-medieval text-xl mb-2">Prejuízo Estimado</h3>
          <p className="text-5xl font-black text-white font-sans">142<span className="text-xl text-gray-500 font-normal">h perdidas</span></p>
          <p className="text-sm text-gray-400 mt-3 font-sans border-t border-tibia-border pt-2">Equivalente a ~4.2kkk de XP desperdiçada por ausências e ghost slots.</p>
        </div>
        <div className="bg-tibia-card border border-green-900 shadow-tibia-inset p-6 rounded relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-green-900 text-xs px-2 py-1 text-white uppercase font-bold">Excelente</div>
          <h3 className="text-green-500 font-medieval text-xl mb-2">Eficiência Global</h3>
          <p className="text-5xl font-black text-white font-sans text-tibia-highlight">68%</p>
          <p className="text-sm text-gray-400 mt-3 font-sans border-t border-tibia-border pt-2">Média de aproveitamento de todos os slots reservados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Hall da Fama */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
          <div className="flex items-center mb-6 border-b border-tibia-border pb-3">
            <Trophy className="text-yellow-500 mr-3" size={24} />
            <h3 className="text-2xl font-medieval text-white">Hall da Fama</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-sm uppercase">
                <th className="pb-3 font-medium">Líder</th>
                <th className="pb-3 font-medium">Respawn Favorito</th>
                <th className="pb-3 font-medium text-right">Eficiência</th>
              </tr>
            </thead>
            <tbody>
              {hallOfFame.map((p, idx) => (
                <tr key={idx} className="border-t border-tibia-border/50">
                  <td className="py-3 text-white font-medium">{p.name}</td>
                  <td className="py-3 text-gray-300">{p.category}</td>
                  <td className="py-3 text-right">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">{p.efficiency}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ranking da Vergonha */}
        <div className="bg-tibia-card border border-tibia-border rounded-lg p-6 shadow-xl">
          <div className="flex items-center mb-6 border-b border-tibia-border pb-3">
            <AlertOctagon className="text-red-500 mr-3" size={24} />
            <h3 className="text-2xl font-medieval text-white">Ranking da Vergonha</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 text-sm uppercase">
                <th className="pb-3 font-medium">Líder Ofensor</th>
                <th className="pb-3 font-medium">Ghost Slots</th>
                <th className="pb-3 font-medium text-right">XP Desperdiçada</th>
              </tr>
            </thead>
            <tbody>
              {wallOfShame.map((p, idx) => (
                <tr key={idx} className="border-t border-tibia-border/50">
                  <td className="py-3 text-white font-medium">{p.name}</td>
                  <td className="py-3">
                    <span className="text-red-400 font-bold">{p.ghostSlots} </span>
                    <span className="text-gray-500 text-xs">slots</span>
                  </td>
                  <td className="py-3 text-right text-gray-300">{p.lostXp}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-gray-500 italic">* Ghost Slots: Tolerância de 15 min esgotada sem check-in de XP contínua.</p>
        </div>

      </div>
    </div>
  );
}
