import React, { useState } from 'react';

import { supabase } from '../lib/supabase';

export default function InviteRequest() {
  const [characterName, setCharacterName] = useState('');
  const [world, setWorld] = useState('Auroria');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const worldGuildMap = {
    'Auroria': 'Shellpatrocina',
    'Belaria': 'Battlestorm Belaria',
    'Bellum': 'Battlestorm Bellum',
    'Tenebrium': 'Battlestorm Retro',
    'Vesperia': 'Battlestorm Vesperia'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!characterName.trim()) return;

    setStatus('loading');
    setMessage('');

    const guildName = worldGuildMap[world];

    try {
      const { error } = await supabase
        .from('guild_invites_queue')
        .insert([
          {
            character_name: characterName.trim(),
            world: world,
            guild_name: guildName,
            status: 'PENDING',
            requested_by: 'WebSite'
          }
        ]);

      if (error) throw error;

      setStatus('success');
      setMessage(`Convite para ${characterName} solicitado com sucesso!<br/>O robô enviará o convite em breve.`);
      setCharacterName('');
    } catch (err) {
      setStatus('error');
      setMessage('Erro ao solicitar convite: ' + err.message);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto text-tibia-highlight">
      <div className="bg-tibia-card border border-tibia-border p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-tibia-primary">
          Solicitar Convite da Guilda
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Personagem</label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Ex: Kingg Archeer"
              className="w-full bg-[141414] border border-tibia-border rounded py-2 px-3 focus:outline-none focus:border-tibia-primary text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mundo</label>
            <select
              value={world}
              onChange={(e) => setWorld(e.target.value)}
              className="w-full bg-[141414] border border-tibia-border rounded py-2 px-3 focus:outline-none focus:border-tibia-primary text-white"
            >
              <option value="Auroria">Auroria - Shellpatrocina</option>
              <option value="Belaria">Belaria - Battlestorm Belaria</option>
              <option value="Bellum">Bellum - Battlestorm Bellum</option>
              <option value="Tenebrium">Tenebrium - Battlestorm Retro</option>
              <option value="Vesperia">Vesperia - Battlestorm Vesperia</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-tibia-primary hover:bg-[d4b236] text-black font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? 'Enviando...' : 'Solicitar Convite'}
          </button>
        </form>

        {status === 'success' && (
          <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 text-green-400 rounded text-center" dangerouslySetInnerHTML={{ __html: message }} />
        )}

        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 text-red-400 rounded text-center">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
