import net from 'net';

function parseTS3String(str) {
    if (!str) return '';
    return str.replace(/\\s/g, ' ').replace(/\\p/g, '|').replace(/\\//g, '/').replace(/\\c/g, ':');
}

function extractName(desc) {
    if (!desc) return 'Sem Descrição';
    const cleanDesc = parseTS3String(desc);
    
    // Tenta pegar Auroria ou MA
    let match = cleanDesc.match(/Auroria:\s*([^|]+)/i) || cleanDesc.match(/MA:\s*([^|]+)/i);
    if (match) return match[1].trim();
    
    // Fallback para Main
    match = cleanDesc.match(/Main:\s*([^|]+)/i);
    if (match) return match[1].trim();
    
    return 'Não Identificado';
}

class TS3Client {
    constructor() {
        this.socket = new net.Socket();
        this.buffer = '';
        this.queue = [];
    }
    connect(port, host) {
        return new Promise((resolve, reject) => {
            this.socket.connect(port, host, resolve);
            this.socket.on('data', (data) => {
                this.buffer += data.toString();
                // O ClientQuery sempre termina a resposta com error id=XX
                if (this.buffer.includes('error id=')) {
                    const response = this.buffer;
                    this.buffer = '';
                    if (this.queue.length > 0) {
                        const cb = this.queue.shift();
                        cb(response);
                    }
                }
            });
            this.socket.on('error', reject);
        });
    }
    send(cmd) {
        return new Promise((resolve) => {
            this.queue.push(resolve);
            this.socket.write(cmd + '\n');
        });
    }
    close() {
        this.socket.destroy();
    }
}

export const runBankSync = async () => {
    console.log('[TS3_SYNC] Iniciando conexão segura com ClientQuery (localhost:25639)...');
    
    const API_KEY = 'BQ5B-KP7M-0NUK-D7RG-ET0J-FH04';
    const ts3 = new TS3Client();
    
    try {
        await ts3.connect(25639, '127.0.0.1');
        
        console.log('[TS3_SYNC] Autenticando com API Key...');
        const authRes = await ts3.send(`auth apikey=${API_KEY}`);
        if (!authRes || !authRes.includes('error id=0 msg=ok')) {
            console.error('[TS3_SYNC] Falha na autenticação da API KEY.');
            ts3.close();
            return;
        }

        console.log('[TS3_SYNC] Buscando lista de clientes...');
        const listRes = await ts3.send('clientlist -groups');
        const rawClients = listRes.split('|');
        
        const testResults = [];

        console.log(`[TS3_SYNC] Encontrados ${rawClients.length} usuários. Analisando descrições...`);
        for (const rc of rawClients) {
            if (!rc.includes('clid=')) continue;
            if (rc.includes('client_type=1')) continue; // ignora query bots
            
            const clidMatch = rc.match(/clid=(\d+)/);
            if (!clidMatch) continue;
            
            const clid = clidMatch[1];
            
            // Pega o nome e os grupos da string base
            const nicknameMatch = rc.match(/client_nickname=([^ ]+)/);
            const nickname = nicknameMatch ? parseTS3String(nicknameMatch[1]) : 'Unknown';
            
            const groupsMatch = rc.match(/client_servergroups=([^ ]+)/);
            const groups = groupsMatch ? groupsMatch[1].split(',') : [];

            // Faz uma requisição separada para ler a descrição (o clientlist normal não traz ela)
            const varRes = await ts3.send(`clientvariable clid=${clid} client_description`);
            let desc = '';
            const descMatch = varRes.match(/client_description=([^ \n]+)/);
            if (descMatch) {
                desc = descMatch[1];
            }

            const extractedName = extractName(desc);

            testResults.push({
                TS_Nome: nickname,
                Grupos: groups.join(','),
                Char_Extraido: extractedName,
                Tem_FBot_Bank: groups.includes('232') ? 'SIM' : 'NÃO', // TODO: Ajustaremos o ID do cargo depois
                Descricao_Original: parseTS3String(desc).substring(0, 40) + '...'
            });
        }

        ts3.close();

        console.log('\n======================================================');
        console.log('[TS3_SYNC] MODO DE TESTE (NADA INJETADO NO SUPABASE AINDA)');
        console.log('Resultados da extração (Regex):');
        console.table(testResults);
        console.log('======================================================\n');
        console.log('Se os nomes estiverem corretos na coluna "Char_Extraido", eu posso ativar o Update pro Banco de Dados!');

    } catch (err) {
        console.error('[TS3_SYNC] Erro Crítico:', err.message);
        ts3.close();
    }
};
