import net from 'net';
import { supabase } from '../db.js';

// Conecta no ClientQuery do TS3 local, extrai quem está online e atualiza o Guild Bank
export const runBankSync = async () => {
    console.log('[TS3_SYNC] Tentando conectar ao TS3 ClientQuery (localhost:25639)...');

    const client = new net.Socket();
    let dataBuffer = '';
    let isReady = false;

    // TODO: Adicione a sua API Key do TS3 aqui se necessário. 
    // Para gerar: TS3 -> Ferramentas -> Opções -> Complementos -> ClientQuery -> Configurações
    const API_KEY = process.env.TS3_API_KEY || 'SUA_API_KEY_AQUI'; 

    return new Promise((resolve, reject) => {
        client.connect(25639, '127.0.0.1', () => {
            console.log('[TS3_SYNC] Conectado ao TS3! Autenticando...');
            // Envia o comando de autenticação
            client.write(`auth apikey=${API_KEY}\n`);
            
            // Depois de autenticar, solicita a lista de clientes com grupos e DB ID
            // Precisaremos dar um delay leve para a API processar
            setTimeout(() => {
                client.write('clientlist -uid -voice -away -groups\n');
            }, 500);
        });

        client.on('data', async (data) => {
            const str = data.toString();
            dataBuffer += str;

            // Se o TS3 respondeu com erro ou ok da nossa lista
            if (str.includes('error id=0 msg=ok') && dataBuffer.includes('clid=')) {
                console.log('[TS3_SYNC] Lista de clientes recebida. Processando...');
                
                // Quebra a string maluca do ServerQuery
                // ex: clid=1 cid=1 client_nickname=Maggothz client_servergroups=123,456|clid=2...
                const rawClients = dataBuffer.split('|');
                
                const fbotClients = [];

                for (const rc of rawClients) {
                    if (!rc.includes('clid=')) continue;
                    
                    // Converte pra Objeto
                    const props = rc.split(' ');
                    const cObj = {};
                    props.forEach(p => {
                        const [k, v] = p.split('=');
                        if (k && v) cObj[k] = v;
                    });

                    // Verifica se tem o grupo 'FBot Bank'
                    // Como não sabemos o ID do grupo exato, vamos logar para você ver.
                    // Idealmente você olha no TS qual o ID, ou a gente busca.
                    // Exemplo fictício: grupo 55 é FBot Bank
                    const groups = (cObj.client_servergroups || '').split(',');
                    
                    // Precisamos também pegar a descrição!
                    // No ClientQuery, clientlist não traz description. Temos que rodar clientvariable
                    client.write(`clientvariable clid=${cObj.clid} client_description\n`);
                    
                    // Adicionamos na fila de processamento
                    fbotClients.push({
                        clid: cObj.clid,
                        name: cObj.client_nickname,
                        groups: groups
                    });
                }

                console.log(`[TS3_SYNC] Encontrados ${fbotClients.length} usuários online. Buscando descrições...`);
                // Encerra a conexão para não travar (Num ambiente real, você espera as descriptions)
                setTimeout(() => {
                    client.destroy();
                    resolve(true);
                }, 2000);
            }
        });

        client.on('error', (err) => {
            console.error('[TS3_SYNC] Erro de conexão. O TS3 está aberto e o ClientQuery ligado?');
            console.error(err.message);
            resolve(false);
        });
        
        client.on('close', () => {
            console.log('[TS3_SYNC] Conexão com TS3 fechada.');
        });
    });
};
