import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './components/AuthContext.jsx'
import { WorldProvider } from './context/WorldContext.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Auto-reload suave se um chunk lazy-loaded mudar de hash após deploy (evita tela branca)
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('[PWA] Chunk atualizado detectado, recarregando para versão mais recente...', event);
    window.location.reload();
  });
}

const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true);
  },
  immediate: true
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <WorldProvider>
        <App />
      </WorldProvider>
    </AuthProvider>
  </StrictMode>,
)

