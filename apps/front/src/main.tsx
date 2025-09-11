import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClerkProvider, SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <SignedIn>
        <App />
      </SignedIn>
      <SignedOut>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <SignIn afterSignInUrl="/" />
        </div>
      </SignedOut>
    </ClerkProvider>
  </StrictMode>,
)
