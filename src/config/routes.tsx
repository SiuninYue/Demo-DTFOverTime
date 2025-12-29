import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/App'
import Loading from '@/components/common/Loading'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

// Lazy load all pages for code splitting
const HomePage = lazy(() => import('@/pages/Home'))
const ScheduleImportPage = lazy(() => import('@/pages/ScheduleImport'))
const CalendarPage = lazy(() => import('@/pages/Calendar'))
const TimecardPage = lazy(() => import('@/pages/Timecard'))
const SalaryPage = lazy(() => import('@/pages/Salary'))
const MCPage = lazy(() => import('@/pages/MC'))
const SettingsPage = lazy(() => import('@/pages/Settings'))
const LoginPage = lazy(() => import('@/pages/Login'))
const RegisterPage = lazy(() => import('@/pages/Register'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPassword'))
const MobileMenuDemoPage = lazy(() => import('@/pages/MobileMenuDemo'))

// Suspense wrapper for lazy components
// eslint-disable-next-line react-refresh/only-export-components
const LazyPage = ({ children }: { children: ReactNode }) => (
  <Suspense fallback={<Loading variant="full" label="加载页面" />}>
    {children}
  </Suspense>
)

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LazyPage><LoginPage /></LazyPage>,
    },
    {
      path: '/register',
      element: <LazyPage><RegisterPage /></LazyPage>,
    },
    {
      path: '/forgot-password',
      element: <LazyPage><ForgotPasswordPage /></LazyPage>,
    },
    {
      path: '/reset-password',
      element: <LazyPage><ResetPasswordPage /></LazyPage>,
    },
    {
      path: '/mobile-menu-demo',
      element: <LazyPage><MobileMenuDemoPage /></LazyPage>,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <LazyPage><HomePage /></LazyPage> },
        {
          path: 'schedule/import',
          element: <LazyPage><ScheduleImportPage /></LazyPage>,
        },
        {
          path: 'calendar/:monthId?',
          element: <LazyPage><CalendarPage /></LazyPage>,
        },
        {
          path: 'timecard/:dateId?',
          element: <LazyPage><TimecardPage /></LazyPage>,
        },
        {
          path: 'salary/:monthId?',
          element: <LazyPage><SalaryPage /></LazyPage>,
        },
        {
          path: 'mc',
          element: <LazyPage><MCPage /></LazyPage>,
        },
        {
          path: 'settings',
          element: <LazyPage><SettingsPage /></LazyPage>,
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
)

export default router
