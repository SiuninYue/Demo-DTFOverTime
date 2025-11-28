import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '@/App'
import HomePage from '@/pages/Home'
import ScheduleImportPage from '@/pages/ScheduleImport'
import CalendarPage from '@/pages/Calendar'
import TimecardPage from '@/pages/Timecard'
import SalaryPage from '@/pages/Salary'
import MCPage from '@/pages/MC'
import SettingsPage from '@/pages/Settings'
import LoginPage from '@/pages/Login'
import RegisterPage from '@/pages/Register'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/register',
      element: <RegisterPage />,
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <HomePage /> },
        {
          path: 'schedule/import',
          element: <ScheduleImportPage />,
        },
        {
          path: 'calendar/:monthId?',
          element: <CalendarPage />,
        },
        {
          path: 'timecard/:dateId?',
          element: <TimecardPage />,
        },
        {
          path: 'salary/:monthId?',
          element: <SalaryPage />,
        },
        {
          path: 'mc',
          element: <MCPage />,
        },
        {
          path: 'settings',
          element: <SettingsPage />,
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
