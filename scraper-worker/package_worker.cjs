const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const staging = path.join(root, 'temp_worker_dist');
if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
fs.mkdirSync(staging, { recursive: true });

fs.copyFileSync(path.join(root, 'scraper-worker/package.json'), path.join(staging, 'package.json'));
fs.copyFileSync(path.join(root, 'scraper-worker/package-lock.json'), path.join(staging, 'package-lock.json'));
if (fs.existsSync(path.join(root, 'scraper-worker/ecosystem.config.cjs'))) {
    fs.copyFileSync(path.join(root, 'scraper-worker/ecosystem.config.cjs'), path.join(staging, 'ecosystem.config.cjs'));
}

fs.cpSync(path.join(root, 'scraper-worker/src'), path.join(staging, 'src'), {
    recursive: true,
    filter: (src) => {
        const base = path.basename(src).toLowerCase();
        if (base.startsWith('test_')) return false;
        if (base.includes('profile')) return false;
        if (base.endsWith('.png') || base.endsWith('.log')) return false;
        if (base.includes('credential') || base.includes('secret') || base.includes('.env')) return false;
        if (base.endsWith('.pem') || base.endsWith('.key') || base.endsWith('.pfx')) return false;
        if (base.endsWith('.json')) return false; // no loose json allowed in src
        return true;
    }
});

const outZip = path.join(root, 'frontend/public/worker.zip');
if (fs.existsSync(outZip)) fs.unlinkSync(outZip);

execSync(`tar.exe -a -c -f "${outZip}" -C "${staging}" .`, { stdio: 'inherit' });
fs.rmSync(staging, { recursive: true, force: true });

const stat = fs.statSync(outZip);
console.log('Worker bundle created successfully: frontend/public/worker.zip (' + (stat.size / 1024).toFixed(1) + ' KB)');
