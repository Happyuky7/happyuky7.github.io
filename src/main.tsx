import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import RootErrorBoundary from '@/components/errors/RootErrorBoundary'
import { installPreloadErrorHandler } from '@/utils/lazyWithRetry'
import '@styles/global.css'
import 'highlight.js/styles/github-dark.css'


// A stale deploy makes Vite fail to preload chunks; recover before React sees it.
installPreloadErrorHandler()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
)
