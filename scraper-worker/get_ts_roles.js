import net from 'net';
const API_KEY = 'BQ5B-KP7M-0NUK-D7RG-ET0J-FH04';
const socket = new net.Socket();
let buffer = '';

function parseTS3String(str) {
    if (!str) return '';
    return str.split('\\s').join(' ')
              .split('\\p').join('|')
              .split('\\/').join('/')
              .split('\\c').join(':');
}

console.log('Tentando conectar ao TeamSpeak 3 na porta 25639...');

socket.on('error', (err) => {
    console.log('\n[ERRO]', err.message);
    process.exit(1);
});

socket.connect(25639, '127.0.0.1', () => {
    socket.write('auth apikey=' + API_KEY + '\n');
    socket.write('clientnotifyregister schandlerid=1 event=notifyservergrouplist\n');
    socket.write('servergrouplist\n');
});

socket.on('data', (data) => {
    buffer += data.toString();
    
    if (buffer.includes('notifyservergrouplist')) {
        const lines = buffer.split('\n');
        for (const line of lines) {
            if (line.includes('notifyservergrouplist')) {
                const groups = line.replace('notifyservergrouplist ', '').split('|');
                console.log('\n====================================');
                console.log('   LISTA DE CARGOS DO TEAMSPEAK');
                console.log('====================================\n');
                
                let found = false;
                for (const g of groups) {
                    const idMatch = g.match(/sgid=(\d+)/);
                    const nameMatch = g.match(/name=([^ \n]+)/);
                    if (idMatch && nameMatch) {
                        found = true;
                        const id = idMatch[1].padEnd(5);
                        const name = parseTS3String(nameMatch[1]);
                        console.log(`ID: ${id} | NOME: ${name}`);
                    }
                }
                
                if (!found) {
                    console.log('Nenhum cargo encontrado.');
                }
                console.log('\n====================================');
                process.exit(0);
            }
        }
    }
    
    // Fallback if stuck for 3 seconds
    setTimeout(() => process.exit(0), 3000);
});
