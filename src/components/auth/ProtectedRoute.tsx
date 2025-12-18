import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUserStore } from '@/store/userStore'

interface ProtectedRouteProps {
  children: React.ReactNode
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isInitialized, initialize } = useAuthStore()
  const clearProfile = useUserStore((state) => state.clearProfile)
  const profileId = useUserStore((state) => state.profile?.id)
  const location = useLocation()

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  useEffect(() => {
    if (!isInitialized) {
      return
    }
    if (!user) {
      clearProfile()
      return
    }
    if (profileId && profileId !== user.id) {
      clearProfile()
    }
  }, [clearProfile, isInitialized, profileId, user])

  if (!isInitialized) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>加载中…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
