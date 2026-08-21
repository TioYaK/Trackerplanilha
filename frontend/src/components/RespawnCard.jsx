import React from 'react';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function RespawnCard({ party }) {
  // party: { party_name, leader_name, slot_start, slot_end, members, status (EFFICIENT, SUBOPTIMAL, GHOST_SLOT) }
  
  const statusColors = {
    EFFICIENT: 'border-green-500 bg-green-500/10',
    SUBOPTIMAL: 'border-yellow-500 bg-yellow-500/10',
    GHOST_SLOT: 'border-red-500 bg-red-500/10',
    DEFAULT: 'border-tibia-border bg-tibia-card'
  };

  const currentStatus = party.status || 'DEFAULT';
  const colorClass = statusColors[currentStatus];

  return (
    <div className={`p-5 rounded-lg border-2 ${colorClass} transition-all`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center">
            {party.party_name}
          </h3>
          <p className="text-sm text-tibia-highlight font-medium mt-1">📍 Local: <span className="text-orange-300">{party.hunt_name || 'Desconhecido'}</span></p>
          <p className="text-sm text-gray-400 mt-1">Líder: {party.leader_name}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold bg-black/30 px-3 py-1 rounded-full text-gray-300">
            <Clock size={14} className="inline mr-1" />
            {party.slot_start} - {party.slot_end}
          </span>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Integrantes Esperados</h4>
        <div className="flex flex-wrap gap-2">
          {party.members?.map((member, idx) => (
            <span key={idx} className="bg-tibia-bg border border-tibia-border px-2 py-1 text-xs rounded text-gray-300">
              {member}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-black/20 flex justify-between items-center">
        <div className="flex items-center text-sm">
          {currentStatus === 'EFFICIENT' && <TrendingUp size={16} className="text-green-400 mr-2" />}
          {currentStatus === 'SUBOPTIMAL' && <Clock size={16} className="text-yellow-400 mr-2" />}
          {currentStatus === 'GHOST_SLOT' && <AlertTriangle size={16} className="text-red-400 mr-2" />}
          
          <span className={
            currentStatus === 'EFFICIENT' ? 'text-green-400' :
            currentStatus === 'SUBOPTIMAL' ? 'text-yellow-400' :
            currentStatus === 'GHOST_SLOT' ? 'text-red-400' : 'text-gray-400'
          }>
            {currentStatus === 'EFFICIENT' ? 'Caçando Ativamente' :
             currentStatus === 'SUBOPTIMAL' ? 'Ociosidade Parcial' :
             currentStatus === 'GHOST_SLOT' ? 'Slot Fantasma (Abandono)' : 'Aguardando Slot'}
          </span>
        </div>
        <div className="text-sm font-semibold text-gray-300">
          ΔXP/h: <span className="text-white">{party.delta_xp || 0}</span>
        </div>
      </div>
    </div>
  );
}
