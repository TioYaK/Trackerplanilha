const fs = require('fs');
let code = fs.readFileSync('temp_dashboard.jsx', 'utf8');

// 1. Add History State
code = code.replace(
  "const [actualHuntTime, setActualHuntTime] = useState(null);",
  "const [actualHuntTime, setActualHuntTime] = useState(null);\n  const [historyRange, setHistoryRange] = useState('week');\n  const [historyChartData, setHistoryChartData] = useState([]);"
);

// 2. Modify Fetch to use historyRange
code = code.replace(
  "const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();",
  "const daysToFetch = historyRange === 'week' ? 7 : 30;\n      const historyStartDate = new Date(Date.now() - daysToFetch * 24 * 60 * 60 * 1000).toISOString();\n      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime();"
);

// 3. Modify the .gte in the query
code = code.replace(
  ".gte('recorded_at', twentyFourHoursAgo)",
  ".gte('recorded_at', historyStartDate)"
);

// 4. Update the stats loop to build history and 24h table separately
const oldStatsLoop = \        logs.forEach(log => {
          if (memberStats[log.character_name]) {
            memberStats[log.character_name].totalXpGained += parseInt(log.delta_xp || 0, 10);
            memberStats[log.character_name].level = log.level;
            memberStats[log.character_name].lastSeen = new Date(log.recorded_at);
          }
        });\;

const newStatsLoop = \        // Agrupamento para o Gráfico de Histórico
        const historyMap = {};
        const [sh, sm] = (party.slot_start || '00:00').split(':').map(Number);
        const [eh, em] = (party.slot_end || '23:59').split(':').map(Number);
        const startMins = sh * 60 + sm;
        let endMins = eh * 60 + em;
        if (endMins < startMins) endMins += 1440; // Cross midnight

        logs.forEach(log => {
          const date = new Date(log.recorded_at);
          const dxp = parseInt(log.delta_xp || 0, 10);
          
          // 24h Table Logic (Only add XP to the table if it's within the last 24h)
          if (date.getTime() >= twentyFourHoursAgo && memberStats[log.character_name]) {
            memberStats[log.character_name].totalXpGained += dxp;
            memberStats[log.character_name].level = log.level;
            memberStats[log.character_name].lastSeen = date;
          }

          // Historical Chart Logic (Filter only XP gained inside the Hunt Window)
          let logMins = date.getHours() * 60 + date.getMinutes();
          if (endMins > 1440 && logMins < 600) logMins += 1440;
          
          if (logMins >= startMins - 60 && logMins <= endMins + 60 && dxp > 0) {
              const dayStr = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
              
              if (!historyMap[dayStr]) {
                  historyMap[dayStr] = { day: dayStr, totalXp: 0, start: date, end: date, rawDate: date };
              }
              historyMap[dayStr].totalXp += dxp;
              if (date < historyMap[dayStr].start) historyMap[dayStr].start = date;
              if (date > historyMap[dayStr].end) historyMap[dayStr].end = date;
          }
        });

        // Converte historyMap para array e formata
        const chartDataArr = Object.values(historyMap)
          .sort((a, b) => a.rawDate - b.rawDate)
          .map(h => {
             const diffMins = (h.end - h.start) / (1000 * 60);
             const formatTime = (d) => d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
             return {
                 day: h.day,
                 totalXp: h.totalXp,
                 start: formatTime(h.start),
                 end: formatTime(h.end),
                 singlePing: diffMins < 5
             };
          });
        setHistoryChartData(chartDataArr);
\;
code = code.replace(oldStatsLoop, newStatsLoop);

// 5. Update Actual Hunt Time logic
const oldActualHuntTime = \        logs.forEach(log => {
          const dxp = parseInt(log.delta_xp || 0, 10);
          if (dxp > 0) {
            const date = new Date(log.recorded_at);
            let logMins = date.getHours() * 60 + date.getMinutes();
            if (endMins > 1440 && logMins < 600) logMins += 1440;

            if (logMins >= startMins - 60 && logMins <= endMins + 60) {
                if (!huntStart || date < huntStart) huntStart = date;
                if (!huntEnd || date > huntEnd) huntEnd = date;
            }
          }
        });

        if (huntStart && huntEnd) {
            const diffMins = (huntEnd - huntStart) / (1000 * 60);
            if (diffMins < 5) {
                // Was just a single ping or very short
                setActualHuntTime({ 
                    single: huntStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
            } else {
                setActualHuntTime({ 
                   start: huntStart.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
                   end: huntEnd.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                });
            }
        } else {
            setActualHuntTime(null);
        }\;

const newActualHuntTime = \        // Acha o huntStart e huntEnd apenas para HOJE (ou o último dia caçado no chartDataArr)
        if (chartDataArr.length > 0) {
            const lastHunt = chartDataArr[chartDataArr.length - 1];
            // Verifica se a última hunt foi nas últimas 24h
            if (Date.now() - historyMap[lastHunt.day].rawDate.getTime() < 24 * 60 * 60 * 1000) {
               if (lastHunt.singlePing) {
                   setActualHuntTime({ single: lastHunt.start });
               } else {
                   setActualHuntTime({ start: lastHunt.start, end: lastHunt.end });
               }
            } else {
               setActualHuntTime(null);
            }
        } else {
            setActualHuntTime(null);
        }\;
code = code.replace(oldActualHuntTime, newActualHuntTime);

// 6. Update Dependency Array of useEffect
code = code.replace(
  "}, [party]);",
  "}, [party, historyRange]);"
);

// 7. Add Tooltip Custom component for Recharts
const customTooltipInsert = \const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatXp = (raw) => {
      if (raw >= 1000000) return (raw / 1000000).toFixed(1) + 'M';
      if (raw >= 1000) return (raw / 1000).toFixed(1) + 'k';
      return raw;
    };
    return (
      <div className="bg-gray-900 border border-tibia-border p-3 rounded shadow-lg text-sm">
        <p className="font-bold text-tibia-primary mb-2">{label}</p>
        <p className="text-gray-300">XP Gained: <span className="text-white font-bold">{formatXp(data.totalXp)}</span></p>
        {data.singlePing ? (
           <p className="text-blue-400 mt-1"><Clock size={12} className="inline mr-1" /> Ping Isolado: {data.start}</p>
        ) : (
           <p className="text-blue-400 mt-1"><Clock size={12} className="inline mr-1" /> Entrada: {data.start} | Saída: {data.end}</p>
        )}
      </div>
    );
  }
  return null;
};
\;

code = code.replace(
  "export default function PartyDashboard({ party, onPlayerClick }) {",
  customTooltipInsert + "\\nexport default function PartyDashboard({ party, onPlayerClick }) {"
);

// 8. Add Chart UI at the bottom
const chartUI = \
          <div className="lg:col-span-3 bg-tibia-card border border-tibia-border rounded-lg shadow-xl overflow-hidden mt-8">
            <div className="p-4 bg-black/40 border-b border-tibia-border flex justify-between items-center">
               <h3 className="font-bold text-white">Histórico de Sessões</h3>
               <select 
                  value={historyRange} 
                  onChange={(e) => setHistoryRange(e.target.value)}
                  className="bg-black/50 border border-tibia-border text-gray-300 px-3 py-1 rounded outline-none text-sm cursor-pointer"
               >
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Últimos 30 dias</option>
               </select>
            </div>
            <div className="p-4" style={{ height: 300 }}>
              {historyChartData.length === 0 ? (
                 <div className="w-full h-full flex items-center justify-center text-gray-500 italic">Nenhum registro de caça neste período.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="day" stroke="#888" tick={{fill: '#888', fontSize: 12}} />
                    <YAxis stroke="#888" tickFormatter={formatXpAxis} tick={{fill: '#888', fontSize: 12}} width={60} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                    <Bar dataKey="totalXp" fill="#b9935a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
\;

code = code.replace(
  "</div>\n      )}\n    </div>",
  "</div>\n" + chartUI + "\n      )}\n    </div>"
);

fs.writeFileSync('temp_dashboard_patched.jsx', code);
