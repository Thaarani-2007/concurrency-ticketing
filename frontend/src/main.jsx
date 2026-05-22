import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './components/context/AuthContext.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId = "357139621858-hcq3etulbdanlc0hrfcuv2nmekqhcs2r.apps.googleusercontent.com">
        <AuthProvider>
          <App />
        </AuthProvider>
    </GoogleOAuthProvider>
    
    
  </StrictMode>,
)
