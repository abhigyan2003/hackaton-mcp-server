'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'
import { useDescope, useSession, useUser } from '@descope/nextjs-sdk/client'

export default function Logout() {
  const router = useRouter()
  const { isAuthenticated, isSessionLoading } = useSession()
  const { user, isUserLoading } = useUser()
  const sdk = useDescope()

  const handleLogout = useCallback(async () => {
    try {
      await sdk.logout()
      // Redirect to login or home page after logout
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if there's an error
      router.push('/login')
    }
  }, [sdk, router])

  useEffect(() => {
    // If user is authenticated, log them out automatically
    if (isAuthenticated && user) {
      handleLogout()
    } else if (!isSessionLoading && !isUserLoading && !isAuthenticated) {
      // User is already logged out, redirect to login
      router.push('/login')
    }
  }, [isAuthenticated, user, isSessionLoading, isUserLoading, handleLogout, router])

  // Show loading while checking session/user status
  if (isSessionLoading || isUserLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg">Logging you out...</p>
        </div>
      </div>
    )
  }

  // Show logging out message
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-lg">Logging you out...</p>
      </div>
    </div>
  )
}