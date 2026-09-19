/**
 * Utilitários compartilhados para o Tracker Tibia / RubinOT
 */

export const parseUtcDate = (dStr) => {
  if (!dStr) return null;
  if (dStr instanceof Date) return dStr;
  if (typeof dStr !== 'string') return new Date(dStr);
  // Se for uma string ISO sem Z ou offset (+ / -), adiciona 'Z' para garantir interpretação UTC
  if (!dStr.endsWith('Z') && !dStr.includes('+') && !dStr.includes('-', 10)) {
    return new Date(dStr + 'Z');
  }
  return new Date(dStr);
};

export const toBrtDateStr = (dateObj) => {
  if (!dateObj) return '';
  const d = parseUtcDate(dateObj);
  if (!d || isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
};

export const toBrtTimeStr = (dateObj) => {
  if (!dateObj) return '';
  const d = parseUtcDate(dateObj);
  if (!d || isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
};

export const getBrtCurrentMinutes = () => {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  }).formatToParts(now);
  const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10) % 24;
  const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  return h * 60 + m;
};

export const timeStringToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Verifica se um slot está ativo no momento, tratando corretamente slots que cruzam meia-noite (ex: 22:00 às 02:00).
 */
export const isSlotActiveNow = (slotStart, slotEnd, currentMinutes = null) => {
  if (!slotStart || !slotEnd) return false;
  const cur = currentMinutes !== null ? currentMinutes : getBrtCurrentMinutes();
  const start = timeStringToMinutes(slotStart);
  let end = timeStringToMinutes(slotEnd);

  if (end < start) end += 1440; // cruza meia-noite
  let adjustedCur = cur;
  if (adjustedCur < start && end > 1440) adjustedCur += 1440;

  return adjustedCur >= start && adjustedCur <= end;
};

export const VOCATION_MAP = {
  '0': 'Nenhuma',
  '1': 'Sorcerer',
  '2': 'Druid',
  '3': 'Paladin',
  '4': 'Knight',
  '5': 'Master Sorcerer',
  '6': 'Elder Druid',
  '7': 'Royal Paladin',
  '8': 'Elite Knight',
  '9': 'Monk',
  '10': 'Exalted Monk'
};

export const formatVocation = (voc) => {
  if (!voc) return 'Desconhecida';
  const str = String(voc).trim();
  if (VOCATION_MAP[str]) return VOCATION_MAP[str];

  // Caso seja string não-numérica, normaliza casing se necessário
  const lower = str.toLowerCase();
  if (lower === 'elder druid' || lower === 'ed') return 'Elder Druid';
  if (lower === 'master sorcerer' || lower === 'ms') return 'Master Sorcerer';
  if (lower === 'elite knight' || lower === 'ek') return 'Elite Knight';
  if (lower === 'royal paladin' || lower === 'rp') return 'Royal Paladin';
  if (lower === 'druid') return 'Druid';
  if (lower === 'sorcerer') return 'Sorcerer';
  if (lower === 'knight') return 'Knight';
  if (lower === 'paladin') return 'Paladin';
  if (lower === 'monk') return 'Monk';
  if (lower === 'exalted monk') return 'Exalted Monk';

  return voc;
};

/**
 * Normaliza o nome de um personagem para o padrão Title Case oficial do Tibia/RubinOT
 * (Ex: "aizen ingrato" -> "Aizen Ingrato", "lord'paulistinha" -> "Lord'Paulistinha")
 */
export const toTibiaTitleCase = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name.trim().split(/\s+/).map(w => {
    if (!w) return '';
    if (w.includes("'")) {
      return w.split("'").map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("'");
    }
    if (w.includes("-")) {
      return w.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("-");
    }
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
};

export const toBrtHourNum = (dateObj) => {
  if (!dateObj) return 0;
  const d = parseUtcDate(dateObj);
  if (!d || isNaN(d.getTime())) return 0;
  const h = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    hour: 'numeric',
    hour12: false
  }).format(d);
  return parseInt(h, 10) % 24;
};

export const formatBrtDateWithWeekday = (dateStr) => {
  if (!dateStr) return '';
  // dateStr can be YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const rawDay = dateObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long' });
  const weekday = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} (${weekday})`;
};

