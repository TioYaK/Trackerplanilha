import React from 'react';
import { Clock, TrendingUp, AlertTriangle, Skull, Edit3, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RespawnCard({ party, onPlayerClick, onPartyClick, isAdmin }) {
  const statusColors = {
    EFFICIENT:  'border-green-500 bg-green-500/10',
    SUBOPTIMAL: 'border-yellow-500 bg-yellow-500/10',
    FALTA_1:    'border-orange-500 bg-orange-500/10',
    FALTA_2:    'border-orange-600 bg-orange-600/15',
    GHOST_SLOT: 'border-red-500 bg-red-500/10',
    DEFAULT:    'border-tibia-border bg-tibia-card',
  };

  const currentStatus = party.status || 'DEFAULT';
  const colorClass = statusColors[currentStatus] ?? statusColors.DEFAULT;
  const missCount = party.miss_count || 0;

  // Badge de faltas: só aparece para admin
  const missBadge = (isAdmin && missCount > 0) ? (
    <span
      title={`${missCount} falta${missCount > 1 ? 's' : ''} acumulada${missCount > 1 ? 's' : ''}`}
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
        missCount >= 3
          ? 'bg-red-900/60 border-red-500 text-red-300'
          : missCount === 2
          ? 'bg-orange-900/60 border-orange-500 text-orange-300'
          : 'bg-yellow-900/40 border-yellow-600 text-yellow-300'
      }`}
    >
      <Skull size={11} />
      {missCount}/3 falta{missCount > 1 ? 's' : ''}
    </span>
  ) : null;

  const statusLabel = {
    EFFICIENT:  'Caçando Ativamente',
    SUBOPTIMAL: 'Ociosidade Parcial',
    FALTA_1:    'Falta (1/3)',
    FALTA_2:    'Falta (2/3)',
    GHOST_SLOT: 'Slot Fantasma (Abandono)',
    DEFAULT:    'Aguardando Slot',
  }[currentStatus] ?? 'Aguardando Slot';

  const statusIcon = {
    EFFICIENT:  <TrendingUp size={16} className="text-green-400" />,
    SUBOPTIMAL: <Clock size={16} className="text-yellow-400" />,
    FALTA_1:    <AlertTriangle size={16} className="text-orange-400" />,
    FALTA_2:    <AlertTriangle size={16} className="text-orange-500" />,
    GHOST_SLOT: <AlertTriangle size={16} className="text-red-400" />,
  }[currentStatus] ?? null;

  const statusTextColor = {
    EFFICIENT:  'text-green-400',
    SUBOPTIMAL: 'text-yellow-400',
    FALTA_1:    'text-orange-400',
    FALTA_2:    'text-orange-400',
    GHOST_SLOT: 'text-red-400',
    DEFAULT:    'text-gray-400',
  }[currentStatus] ?? 'text-gray-400';

  const handleEditNote = async (e) => {
    e.stopPropagation();
    const newNote = prompt("Adicione uma nota (ex: PT avisou que vai atrasar, viajando, etc):", party.admin_note || '');
    if (newNote === null) return;
    
    try {
      const { error } = await supabase.from('parties_planilhadas').update({ admin_note: newNote }).eq('id', party.id);
      if (error) throw error;
      // Note: Component doesn't force re-render, it relies on LiveDashboard Realtime.
    } catch (err) {
      alert("Erro ao salvar nota: " + err.message);
    }
  };

  return (
    <div className={`p-5 rounded-lg border-2 ${colorClass} transition-all hover:scale-[1.01]`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-xl font-bold text-white flex items-center cursor-pointer hover:text-tibia-primary hover:underline"
              onClick={() => onPartyClick && onPartyClick(party)}
            >
              {party.party_name}
            </h3>
            {missBadge}
          </div>
          <p className="text-sm text-tibia-highlight font-medium mt-1">
            📍 Local: <span className="text-orange-300">{party.hunt_name || 'Desconhecido'}</span>
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Líder:{' '}
            <span
              className="cursor-pointer hover:text-tibia-primary hover:underline"
              onClick={() => onPlayerClick && onPlayerClick(party.leader_name)}
            >
              {party.leader_name}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0 ml-2">
          <span className="text-sm font-semibold bg-black/30 px-3 py-1 rounded-full text-gray-300">
            <Clock size={14} className="inline mr-1" />
            {party.slot_start} - {party.slot_end}
          </span>
          {isAdmin && (
            <button onClick={handleEditNote} className="mt-2 text-xs text-gray-500 hover:text-blue-400 flex items-center gap-1">
              <Edit3 size={12} />
              {party.admin_note ? 'Editar Nota' : 'Add Nota'}
            </button>
          )}
        </div>
      </div>

      {party.admin_note && (
        <div className="mb-4 bg-blue-900/20 border border-blue-500/30 p-2 rounded text-sm text-blue-200 flex items-start gap-2">
          <MessageSquare size={16} className="mt-0.5 shrink-0" />
          <p className="italic">"{party.admin_note}"</p>
        </div>
      )}

      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Integrantes Esperados</h4>
        <div className="flex flex-wrap gap-2">
          {party.members?.map((member, idx) => (
            <span
              key={idx}
              onClick={() => onPlayerClick && onPlayerClick(member)}
              className="bg-tibia-bg border border-tibia-border px-2 py-1 text-xs rounded text-gray-300 cursor-pointer hover:border-tibia-primary hover:text-white transition-colors"
            >
              {member}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-black/20 flex justify-between items-center">
        <div className="flex items-center text-sm gap-2">
          {statusIcon}
          <span className={statusTextColor}>{statusLabel}</span>
        </div>
        <div className="text-sm font-semibold text-gray-300">
          📈XP/h: <span className="text-white">{party.delta_xp || 0}</span>
        </div>
      </div>
    </div>
  );
}
