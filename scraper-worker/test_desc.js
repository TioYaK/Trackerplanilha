import net from 'net';

const API_KEY = 'BQ5B-KP7M-0NUK-D7RG-ET0J-FH04';
const socket = new net.Socket();
let buffer = '';
let queue = [];

function parseTS3String(str) {
    if (!str) return '';
    return str.split('\\s').join(' ')
              .split('\\p').join('|')
              .split('\\/').join('/')
              .split('\\c').join(':');
}

function extractName(desc) {
    if (!desc) return null;
    const cleanDesc = parseTS3String(desc);
    const match = cleanDesc.match(/Main:\s*([^|]+)/i);
    if (match) return match[1].trim();
    return null; // Retorna nulo se falhar
}

socket.connect(25639, '127.0.0.1', () => {
    socket.write('auth apikey=' + API_KEY + '\n');
});

socket.on('data', (data) => {
    buffer += data.toString();
    if (buffer.includes('error id=')) {
        const response = buffer;
        buffer = '';
        if (queue.length > 0) {
            queue.shift()(response);
        }
    }
});

queue.push((authRes) => {
    socket.write('clientlist -groups\n');
    queue.push(async (listRes) => {
        const rawClients = listRes.split('|');
        const results = [];

        for (const rc of rawClients) {
            if (!rc.includes('clid=')) continue;
            if (rc.includes('client_type=1')) continue; // ignora bots
            
            const clidMatch = rc.match(/clid=(\d+)/);
            if (!clidMatch) continue;
            const clid = clidMatch[1];
            
            const nicknameMatch = rc.match(/client_nickname=([^ ]+)/);
            const nickname = nicknameMatch ? parseTS3String(nicknameMatch[1]) : 'Unknown';
            
            const groupsMatch = rc.match(/client_servergroups=([^ ]+)/);
            const groups = groupsMatch ? groupsMatch[1].split(',') : [];
            const hasBank = groups.includes('292');

            // Promise para buscar descriǜo
            const desc = await new Promise((resolve) => {
                queue.push((varRes) => {
                    const descMatch = varRes.match(/client_description=([^ \n]+)/);
                    resolve(descMatch ? descMatch[1] : '');
                });
                socket.write(`clientvariable clid=${clid} client_description\n`);
            });

            const cleanDesc = parseTS3String(desc);
            const extracted = extractName(desc);

            results.push({
                nickname,
                hasBank,
                rawDesc: cleanDesc,
                extractedName: extracted
            });
        }

        console.log('\n======================================================');
        console.log('   DIAGNOSTICO DE DESCRICOES DO TEAMSPEAK 3');
        console.log('======================================================\n');
        
        let failures = 0;
        let success = 0;

        for (const r of results) {
            if (r.hasBank) {
                if (r.extractedName) {
                    console.log(`✅ [OK] ${r.nickname.padEnd(20)} -> Identificou: "${r.extractedName}"`);
                    success++;
                } else {
                    console.log(`❌ [FALHA] ${r.nickname.padEnd(20)} -> Tem o cargo 292, mas a descriǜo tǭ errada: "${r.rawDesc || 'VAZIA'}"`);
                    failures++;
                }
            } else {
                // Apenas para membros online que nǜo tem cargo banco, verifica se a formataǜo tǭ lǭ
                if (r.extractedName) {
                    // console.log(`ℹ️ [INFO] ${r.nickname.padEnd(20)} -> Nǜo tem GB Pago, mas formatou certo: "${r.extractedName}"`);
                } else {
                    // console.log(`⚠️ [AVISO] ${r.nickname.padEnd(20)} -> Nǜo tem cargo e nǜo formatou certo.`);
                }
            }
        }
        
        console.log('\n======================================================');
        console.log(`Resumo: ${success} membros com cargo lidos corretamente.`);
        console.log(`        ${failures} membros com cargo falharam por erro de descriǜo.`);
        console.log('======================================================\n');
        
        socket.destroy();
    });
});
