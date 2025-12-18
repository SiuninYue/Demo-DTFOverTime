import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from '@/config/routes'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { ToastProvider } from '@/components/common/Toast'
import '@/i18n/config'
import './index.css'
import './styles/auth.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('未找到根节点元素（root）')
}

createRoot(rootElement).render(
  <StrictMode>
    <ToastProvider>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ToastProvider>
  </StrictMode>,
)
