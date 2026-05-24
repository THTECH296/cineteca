import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AdminApp from './admin/AdminApp.tsx'
import { AuthProvider } from './auth/AuthContext'
import { supabase, supabaseAdmin } from './lib/supabase'

const path = window.location.pathname.replace(/\/+$/, '')
const isAdminRoute = path.endsWith('/admin') || window.location.hash === '#admin'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider client={isAdminRoute ? supabaseAdmin : supabase}>
      {isAdminRoute ? <AdminApp /> : <App />}
    </AuthProvider>
  </StrictMode>,
)
