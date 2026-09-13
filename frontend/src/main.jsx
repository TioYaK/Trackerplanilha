import { StrictMode, Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './components/AuthContext.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const GuildPerks = lazy(() => import('./views/GuildPerks.jsx'))

registerSW({ immediate: true })

const path = window.location.pathname.toLowerCase();
if (path === '/guild_pearks' || path === '/guild_perks' || path === '/pearks' || path === '/perks') {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <StrictMode>
      <div className="min-h-screen bg-tibia-bg bg-tibia-pattern">
        <Suspense fallback={<div className="text-yellow-500 font-medieval text-center p-8">Carregando Perks da Guilda...</div>}>
          <GuildPerks isPublic={true} />
        </Suspense>
      </div>
    </StrictMode>
  )
} else {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  )
}
