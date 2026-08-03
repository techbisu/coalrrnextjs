'use client'

import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOnlineBanner, setShowOnlineBanner] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setShowOnlineBanner(true)
      // Hide the green "Back Online" banner after 3 seconds for better UX
      setTimeout(() => {
        setShowOnlineBanner(false)
      }, 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOnlineBanner(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !showOnlineBanner) return null

  return (
    <>
      {/* Full page disable overlay when offline */}
      {!isOnline && (
        <div className="fixed inset-0 z-[90] bg-background/50 backdrop-blur-sm transition-all duration-300" />
      )}

      {/* Network Banner */}
      <div 
        className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium shadow-md transition-all duration-500 ease-in-out ${
          isOnline 
            ? 'bg-emerald-600 text-white translate-y-0 opacity-100' 
            : 'bg-destructive text-destructive-foreground translate-y-0 opacity-100'
        } animate-in slide-in-from-top-full`}
      >
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4 animate-pulse" />
            <span>Connection restored! You are back online.</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 animate-pulse" />
            <span>You are currently offline. Please reconnect to continue.</span>
          </>
        )}
      </div>
    </>
  )
}
