import { StrictMode, Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './components/AuthContext.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const InviteRequest = lazy(() => import('./views/InviteRequest.jsx'))

registerSW({ immediate: true })

const path = window.location.pathname.toLowerCase();
if (path === '/invites' || path === '/invite') {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <StrictMode>
      <div className="min-h-screen bg-tibia-bg bg-tibia-pattern">
        <Suspense fallback={<div className="text-yellow-500 font-medieval text-center p-8">Carregando formulário...</div>}>
          <InviteRequest isPublic={true} />
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
