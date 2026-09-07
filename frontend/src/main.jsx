import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import InviteRequest from './views/InviteRequest.jsx'
import { AuthProvider } from './components/AuthContext.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

registerSW({ immediate: true })

const path = window.location.pathname.toLowerCase();
if (path === '/invites' || path === '/invite') {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <StrictMode>
      <div className="min-h-screen bg-tibia-bg bg-tibia-pattern">
        <InviteRequest isPublic={true} />
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
